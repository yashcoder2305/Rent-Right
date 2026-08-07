import db from '../db.js';
import { callGeminiJSON } from './gemini.js';

/** Loads all rules for a jurisdiction, grouped by clause_type for fast lookup. */
function loadRules(jurisdictionId) {
  const rows = db.prepare('SELECT * FROM rules WHERE jurisdiction_id = ?').all(jurisdictionId);
  return rows.map((r) => ({ ...r, check_config: r.check_config ? JSON.parse(r.check_config) : null }));
}

// Very small heuristic extractors for deterministic fields mentioned in
// check_config (deposit_months, notice_days, rent_increase_notice_days).
// A real system would extract these more robustly; kept simple and explicit
// so the deterministic layer stays transparent and debuggable.
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
  if (value === null) return null; // can't determine — let it fall through, don't guess

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

async function runLlmCheck(rule, clause) {
  const prompt = `You are a tenant-rights classification assistant. You do NOT give definitive legal
conclusions — you only classify how clearly a lease clause matches a described legal rule, for a
human/rules-engine to review afterward.

RULE:
- Description: ${rule.description}
- What it prohibits: ${rule.what_it_prohibits}
- Legal reference: ${rule.legal_reference}

LEASE CLAUSE:
"""
${clause.text}
"""

Classify the clause against the rule as one of: "clear_violation", "potential_violation", "compliant".
Return JSON: { "classification": "...", "confidence": 0.0-1.0, "explanation": "one plain-English sentence" }`;

  const result = await callGeminiJSON(prompt, { temperature: 0.1 });
  return {
    classification: result.classification || 'potential_violation',
    confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
    explanation: result.explanation || '',
  };
}

/**
 * Matches every clause against the jurisdiction's rule set.
 * Deterministic rules run first (no LLM cost). All LLM-needed pairs are then
 * sent in a SINGLE batched call to minimise API quota usage.
 * Returns only non-compliant findings (violations array).
 */
export async function matchRules(clauses, jurisdictionId) {
  const rules = loadRules(jurisdictionId);
  const rawViolations = [];

  // --- Phase 1: deterministic checks (no LLM) ---
  const llmQueue = []; // { rule, clause } pairs that need LLM

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
          continue; // deterministic result — no LLM needed
        }
      }
      llmQueue.push({ rule, clause });
    }
  }

  // --- Phase 2: single batched LLM call for all remaining pairs ---
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
      console.error('Batch LLM rule check failed:', err.message);
      // Gracefully degrade — treat all as potential_violation with low confidence
      batchResults = llmQueue.map((_, i) => ({
        index: i,
        classification: 'potential_violation',
        confidence: 0.3,
        explanation: 'Could not verify automatically — please review manually.',
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

  // --- Phase 3: Deduplicate and consolidate per clause ---
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
      // Promote severity if this finding is higher severity
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

  // Severity scoring: critical first, then by confidence descending.
  violations.sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity] || b.confidence - a.confidence
  );

  return violations;
}

/** Module 6 — plain language explainer for every clause (not just violations). */
export async function explainClausesPlainly(clauses) {
  const prompt = `Explain each of the following lease clauses in plain English, in exactly two short
sentences, as if speaking to someone with no legal background. Return a JSON array of objects:
{ "clause_id": "...", "plain_explanation": "..." }

CLAUSES:
${JSON.stringify(clauses.map((c) => ({ clause_id: c.clause_id, text: c.text })))}`;

  const result = await callGeminiJSON(prompt, { maxTokens: 4096 });
  return Array.isArray(result) ? result : [];
}

/**
 * Generates 3–5 plain-English "things a tenant must know" about this lease,
 * explicitly flagging any clauses that are illegal, suspicious, or highly unfair.
 * @param {Array} clauses - all extracted lease clauses
 * @param {Array} violations - output of matchRules (may be empty)
 */
export async function summarizeLease(clauses, violations = []) {
  const violationMap = Object.fromEntries(
    violations.map((v) => [v.clause_id, v])
  );

  // Annotate each clause with its violation status so the LLM has full context.
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
}
