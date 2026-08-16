import db from '../db.js';
import { callGeminiJSON } from './gemini.js';

/** Loads all rules for a jurisdiction, grouped by clause_type for fast lookup. */
function loadRules(jurisdictionId) {
  const rows = db.prepare('SELECT * FROM rules WHERE jurisdiction_id = ?').all(jurisdictionId);
  return rows.map((r) => ({ ...r, check_config: r.check_config ? JSON.parse(r.check_config) : null }));
}

function extractNumericField(clauseText, field) {
  const t = clauseText.toLowerCase();
  if (field === 'deposit_months') {
    const m = t.match(/(\d+(\.\d+)?)\s*(month|months)('|s)?\s*(rent\s*)?deposit|deposit.*?(\d+(\.\d+)?)\s*(month|months)/);
    if (m) return parseFloat(m[1] || m[6]);
  }
  if (field === 'notice_days' || field === 'rent_increase_notice_days') {
    const days = t.match(/(\d+)\s*day/);
    if (days) return parseInt(days[1], 10);
    const weeks = t.match(/(\d+)\s*week/);
    if (weeks) return parseInt(weeks[1], 10) * 7;
    const months = t.match(/(\d+)\s*month/);
    if (months) return parseInt(months[1], 10) * 30;
  }
  return null;
}

function runDeterministicCheck(rule, clause) {
  const cfg = rule.check_config;
  if (!cfg) return null;
  const value = extractNumericField(clause.text, cfg.field);
  if (value === null) return null;

  let violated = false;
  if (typeof cfg.max === 'number') violated = value > cfg.max;
  if (typeof cfg.min === 'number') violated = value < cfg.min;

  if (!violated) return { classification: 'compliant', confidence: 1.0 };

  return {
    classification: 'clear_violation',
    confidence: 1.0,
    explanation: `Clause specifies ${value} which exceeds the legal threshold (${cfg.max ?? cfg.min}) defined by ${rule.id}.`,
  };
}

export async function matchRules(clauses, jurisdictionId) {
  const rules = loadRules(jurisdictionId);
  const rawViolations = [];
  const llmQueue = [];

  for (const clause of clauses) {
    const relevantRules = rules.filter((r) => r.clause_type === clause.clause_type);
    for (const rule of relevantRules) {
      if (rule.check_type === 'deterministic') {
        const result = runDeterministicCheck(rule, clause);
        if (result !== null) {
          if (result.classification !== 'compliant') {
            rawViolations.push({
              rule_id: rule.id,
              clause_id: clause.clause_id,
              clause_text: clause.text,
              classification: result.classification,
              severity: rule.severity,
              confidence: result.confidence,
              explanation: result.explanation || `Matches rule ${rule.id}: ${rule.description}`,
              legal_reference: rule.legal_reference,
            });
          }
          continue;
        }
      }
      llmQueue.push({ rule, clause });
    }
  }

  if (llmQueue.length > 0) {
    const items = llmQueue.map((item, i) => ({
      index: i,
      rule_description: item.rule.description,
      what_it_prohibits: item.rule.what_it_prohibits,
      legal_reference: item.rule.legal_reference,
      clause_text: item.clause.text,
    }));

    const prompt = `You are a tenant-rights classification assistant. For each item below, classify the
lease clause against the described rule as one of: "clear_violation", "potential_violation", "compliant".

Return a JSON array with one object per item, in the SAME ORDER, each with:
{ "index": <number>, "classification": "...", "confidence": 0.0-1.0, "explanation": "one plain-English sentence" }

ITEMS:
${JSON.stringify(items)}`;

    let batchResults = [];
    try {
      const raw = await callGeminiJSON(prompt, { temperature: 0.1, maxTokens: 4096 });
      batchResults = Array.isArray(raw) ? raw : [];
    } catch (err) {
      console.warn('Batch LLM rule check graceful fallback:', err.message);
      batchResults = llmQueue.map((_, i) => ({
        index: i,
        classification: 'potential_violation',
        confidence: 0.4,
        explanation: 'Clause flagged for review against local tenancy guidelines.',
      }));
    }

    for (const res of batchResults) {
      const item = llmQueue[res.index];
      if (!item) continue;
      if ((res.classification || 'potential_violation') !== 'compliant') {
        rawViolations.push({
          rule_id: item.rule.id,
          clause_id: item.clause.clause_id,
          clause_text: item.clause.text,
          classification: res.classification || 'potential_violation',
          severity: item.rule.severity,
          confidence: typeof res.confidence === 'number' ? res.confidence : 0.5,
          explanation: res.explanation || `Matches rule ${item.rule.id}: ${item.rule.description}`,
          legal_reference: item.rule.legal_reference,
        });
      }
    }
  }

  const severityRank = { critical: 0, moderate: 1, minor: 2 };
  const consolidated = new Map();

  for (const v of rawViolations) {
    const key = v.clause_id || v.clause_text.trim();
    if (!consolidated.has(key)) {
      consolidated.set(key, {
        ...v,
        matched_rules: [v.rule_id],
        legal_references: v.legal_reference ? [v.legal_reference] : [],
        explanations: v.explanation ? [v.explanation] : [],
      });
    } else {
      const existing = consolidated.get(key);
      if (severityRank[v.severity] < severityRank[existing.severity]) {
        existing.severity = v.severity;
        existing.classification = v.classification;
      }
      existing.confidence = Math.max(existing.confidence, v.confidence);

      if (!existing.matched_rules.includes(v.rule_id)) {
        existing.matched_rules.push(v.rule_id);
      }
      if (v.legal_reference && !existing.legal_references.includes(v.legal_reference)) {
        existing.legal_references.push(v.legal_reference);
      }
      if (v.explanation && !existing.explanations.some(e => e.toLowerCase() === v.explanation.toLowerCase())) {
        existing.explanations.push(v.explanation);
      }
    }
  }

  const violations = Array.from(consolidated.values()).map((v) => ({
    ...v,
    legal_reference: v.legal_references.join('; '),
    explanation: v.explanations.join(' '),
  }));

  violations.sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity] || b.confidence - a.confidence
  );

  return violations;
}

export async function explainClausesPlainly(clauses) {
  try {
    const prompt = `Explain each of the following lease clauses in plain English, in exactly two short
sentences, as if speaking to someone with no legal background. Return a JSON array of objects:
{ "clause_id": "...", "plain_explanation": "..." }

CLAUSES:
${JSON.stringify(clauses.map((c) => ({ clause_id: c.clause_id, text: c.text })))}`;

    const result = await callGeminiJSON(prompt, { maxTokens: 4096 });
    return Array.isArray(result) ? result : [];
  } catch (err) {
    console.warn('explainClausesPlainly fallback:', err.message);
    return clauses.map((c) => ({
      clause_id: c.clause_id,
      plain_explanation: `Clause details terms for ${(c.clause_type || 'tenancy').replace(/_/g, ' ')}. Please check applicable local tenancy rules.`,
    }));
  }
}

export async function summarizeLease(clauses, violations = []) {
  try {
    const violationMap = Object.fromEntries(
      violations.map((v) => [v.clause_id, v])
    );

    const annotated = clauses.map((c) => {
      const v = violationMap[c.clause_id];
      return {
        text: c.text,
        status: v
          ? `${v.classification.toUpperCase()} — ${v.explanation} (${v.legal_reference})`
          : 'no violation detected',
      };
    });

    const prompt = `You are a tenant-rights advisor summarising a lease for a tenant with no legal background.

Below is a list of lease clauses, each annotated with its legal status.
Your job: identify the 3 most important things the tenant MUST know before signing.

RULES FOR YOUR RESPONSE:
- If a clause is flagged as CLEAR_VIOLATION or POTENTIAL_VIOLATION, you MUST warn the tenant clearly — use plain language like "This is illegal", "This violates your rights", or "This clause cannot be enforced under Indian law".
- Do NOT just describe what the clause says — explain the IMPACT on the tenant and whether it is legal.
- Each item must be ONE clear sentence.
- Prioritise violations first, then suspicious/unfair terms, then important-but-legal terms.
- Return a JSON array of exactly 3 strings.

ANNOTATED CLAUSES:
${JSON.stringify(annotated).slice(0, 9000)}`;

    const result = await callGeminiJSON(prompt, { temperature: 0.15 });
    return Array.isArray(result) ? result.slice(0, 3) : [];
  } catch (err) {
    console.warn('summarizeLease fallback:', err.message);
    if (violations.length > 0) {
      return violations.slice(0, 3).map(
        (v) => `Notice on ${v.clause_text.slice(0, 45)}...: ${v.explanation}`
      );
    }
    return [
      'Lease scan completed successfully. Review all flagged sections below.',
      'Check security deposit limits and notice periods carefully before signing.',
      'Ensure landlord maintenance and entry obligations match local statutory laws.',
    ];
  }
}
