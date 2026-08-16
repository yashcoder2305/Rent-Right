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

function getDefaultLegalRef(jurisdictionId) {
  if (jurisdictionId === 'IN') return 'Model Tenancy Act 2021 / State Rent Control Act';
  if (jurisdictionId === 'UG') return 'Landlord and Tenant Act 2022 (Uganda)';
  return 'Applicable Tenancy Law';
}

/**
 * Second-pass scan: sends ALL clauses to the LLM for a general illegal-clause check.
 * This catches violations that slipped through the typed-rule matching (e.g. because
 * clause_type was "general" or the rule set doesn't yet cover an exotic clause type).
 */
async function universalViolationScan(clauses, rawViolations, jurisdictionId) {
  // Only scan clauses not already flagged as clear_violation
  const flaggedIds = new Set(
    rawViolations.filter((v) => v.classification === 'clear_violation').map((v) => v.clause_id)
  );
  const toScan = clauses.filter((c) => !flaggedIds.has(c.clause_id));
  if (toScan.length === 0) return;

  const jurisdictionLabel = jurisdictionId === 'IN'
    ? 'Indian (Model Tenancy Act 2021, State Rent Control Acts, Transfer of Property Act 1882)'
    : jurisdictionId === 'UG'
    ? 'Ugandan (Landlord and Tenant Act 2022)'
    : jurisdictionId;

  const prompt = `You are a strict ${jurisdictionLabel} tenant-rights legal expert.

Review the following lease clauses and flag ANY clause that is:
- Illegal or unenforceable under ${jurisdictionLabel} residential tenancy law
- Unfair, oppressive, or gives the landlord unchecked power
- In violation of a tenant's statutory rights (e.g. right to peaceful enjoyment, refundable deposit, notice before entry, limits on rent hikes)

For EACH clause, return a JSON object. If you find a problem, set "violation": true. If the clause is completely standard and legal, set "violation": false.

KNOWN VIOLATIONS TO ALWAYS FLAG:
- Non-refundable security deposit → clear_violation
- Landlord can enter without notice or "at any time" → clear_violation  
- Rent increases without formula, cap, or minimum notice → clear_violation
- Waiver of statutory rights → clear_violation
- Penalty clauses that are disproportionate → potential_violation
- Vague clauses giving landlord "sole discretion" → potential_violation

Return a JSON array, one item per clause in the SAME ORDER:
{ "clause_id": "...", "violation": true/false, "classification": "clear_violation"|"potential_violation"|"compliant", "severity": "critical"|"moderate"|"minor", "explanation": "one sentence", "legal_reference": "cite specific law section" }

CLAUSES:
${JSON.stringify(toScan.map((c) => ({ clause_id: c.clause_id, clause_type: c.clause_type, text: c.text })))}`;

  try {
    const results = await callGeminiJSON(prompt, { temperature: 0.05, maxTokens: 6000 });
    if (!Array.isArray(results)) return;

    for (const r of results) {
      if (!r.violation || r.classification === 'compliant') continue;
      // Only add if not already flagged for this clause
      const alreadyFlagged = rawViolations.some((v) => v.clause_id === r.clause_id);
      const clause = toScan.find((c) => c.clause_id === r.clause_id);
      if (!clause) continue;

      rawViolations.push({
        rule_id: 'universal_scan',
        clause_id: r.clause_id,
        clause_text: clause.text,
        classification: r.classification || 'potential_violation',
        severity: r.severity || 'moderate',
        confidence: alreadyFlagged ? 0.6 : 0.85,
        explanation: r.explanation || 'Clause flagged as potentially illegal or unfair.',
        legal_reference: r.legal_reference || getDefaultLegalRef(jurisdictionId),
      });
    }
  } catch (err) {
    console.warn('universalViolationScan fallback:', err.message);
  }
}



export async function matchRules(clauses, jurisdictionId) {
  const rules = loadRules(jurisdictionId);
  const rawViolations = [];
  const llmQueue = [];

  // Track which clauses matched at least one rule (for universal scan below)
  const clausesWithRules = new Set();

  for (const clause of clauses) {
    // Match both exact clause_type AND suspicious_clause rules (catch-all)
    const relevantRules = rules.filter(
      (r) => r.clause_type === clause.clause_type || r.clause_type === 'suspicious_clause'
    );
    for (const rule of relevantRules) {
      clausesWithRules.add(clause.clause_id);
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

    const jurisdictionLabel = jurisdictionId === 'IN'
      ? 'Indian (governed by State Rent Control Acts, Model Tenancy Act 2021, Transfer of Property Act 1882, and Consumer Protection Act 2019)'
      : jurisdictionId === 'UG'
      ? 'Ugandan (governed by the Landlord and Tenant Act 2022)'
      : jurisdictionId;

    const prompt = `You are a strict tenant-rights legal analyst specialising in ${jurisdictionLabel} residential tenancy law.

Your task: For each item below, determine whether the lease clause VIOLATES the stated rule.

CRITICAL INSTRUCTIONS:
- You MUST err on the side of flagging. If there is ANY doubt, classify as "potential_violation" — NEVER default to "compliant" when the clause is ambiguous.
- "compliant" means the clause is CLEARLY and unambiguously lawful. If you are not 100% certain it is lawful, do NOT mark it compliant.
- A non-refundable security deposit is ALWAYS a clear_violation under Indian law.
- A landlord entering without notice is ALWAYS a clear_violation under Indian law.
- Arbitrary rent increases with no formula or cap are ALWAYS a clear_violation.
- Clauses giving the landlord "sole discretion" without limits are suspicious_clause violations.
- Waiver of statutory rights is ALWAYS a clear_violation.

Classify each clause as one of:
  "clear_violation"      — clause directly breaks the stated law/rule with high certainty
  "potential_violation"  — clause is suspicious, unfair, or likely unenforceable even if not 100% certain
  "compliant"            — clause is CLEARLY and unambiguously lawful (use sparingly)

Return a JSON array with one object per item in the SAME ORDER:
{ "index": <number>, "classification": "...", "confidence": 0.0–1.0, "explanation": "One sentence citing which law/principle is violated and how it harms the tenant." }

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
          legal_reference: item.rule.legal_reference || getDefaultLegalRef(jurisdictionId),
        });
      }
    }
  }

  // Universal scan: run ALL clauses through a general illegal-clause detector
  // regardless of whether they matched specific typed rules
  await universalViolationScan(clauses, rawViolations, jurisdictionId);

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
