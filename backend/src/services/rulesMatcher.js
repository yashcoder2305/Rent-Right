/**
 * rulesMatcher.js
 *
 * Rules are embedded as JS constants so this module works correctly on Vercel
 * (where SQLite / MongoDB cannot store static rule data reliably).
 * The LLM is used for semantic classification; deterministic checks handle
 * simple numeric thresholds.
 */

import { callGeminiJSON } from './gemini.js';

// ─── Hardcoded Rule Catalogue ─────────────────────────────────────────────────

const RULES = [
  // ── India ──────────────────────────────────────────────────────────────────
  { id: 'in_deposit_001', jurisdiction_id: 'IN', clause_type: 'deposit', severity: 'critical', check_type: 'llm', description: 'Security deposit declared non-refundable', legal_reference: 'Model Tenancy Act 2021 §11; State Rent Control Acts' },
  { id: 'in_deposit_002', jurisdiction_id: 'IN', clause_type: 'deposit', severity: 'critical', check_type: 'deterministic', description: 'Deposit exceeds 2 months rent (residential)', legal_reference: 'Model Tenancy Act 2021 §11(2)', check_config: { field: 'deposit_months', max: 2 } },
  { id: 'in_deposit_003', jurisdiction_id: 'IN', clause_type: 'deposit', severity: 'moderate', check_type: 'llm', description: 'No timeline for deposit refund after vacating', legal_reference: 'Model Tenancy Act 2021 §11(3)' },
  { id: 'in_deposit_004', jurisdiction_id: 'IN', clause_type: 'deposit', severity: 'moderate', check_type: 'llm', description: 'Deductions from deposit allowed at landlord sole discretion', legal_reference: 'Model Tenancy Act 2021 §11' },

  { id: 'in_entry_001', jurisdiction_id: 'IN', clause_type: 'entry_rights', severity: 'critical', check_type: 'llm', description: 'Landlord may enter premises without any notice', legal_reference: 'Model Tenancy Act 2021 §14; Transfer of Property Act 1882 §108(c)' },
  { id: 'in_entry_002', jurisdiction_id: 'IN', clause_type: 'entry_rights', severity: 'critical', check_type: 'llm', description: 'Landlord entry "at any time" without reasonable notice', legal_reference: 'Model Tenancy Act 2021 §14' },

  { id: 'in_notice_001', jurisdiction_id: 'IN', clause_type: 'notice_period', severity: 'moderate', check_type: 'deterministic', description: 'Termination notice period less than 1 month', legal_reference: 'Model Tenancy Act 2021 §21', check_config: { field: 'notice_days', min: 30 } },
  { id: 'in_notice_002', jurisdiction_id: 'IN', clause_type: 'notice_period', severity: 'moderate', check_type: 'llm', description: 'Landlord can terminate tenancy with shorter notice than tenant', legal_reference: 'Model Tenancy Act 2021 §21' },
  { id: 'in_notice_003', jurisdiction_id: 'IN', clause_type: 'notice_period', severity: 'critical', check_type: 'llm', description: 'No notice required for eviction / immediate eviction clause', legal_reference: 'Model Tenancy Act 2021 §21; CPC Order 39' },

  { id: 'in_repairs_001', jurisdiction_id: 'IN', clause_type: 'repairs', severity: 'critical', check_type: 'llm', description: 'Landlord has no obligation to maintain structural soundness', legal_reference: 'Transfer of Property Act 1882 §108(b)' },
  { id: 'in_repairs_002', jurisdiction_id: 'IN', clause_type: 'repairs', severity: 'critical', check_type: 'llm', description: 'Landlord has no obligation to restore habitability after damage', legal_reference: 'Transfer of Property Act 1882 §108(b)' },
  { id: 'in_repairs_003', jurisdiction_id: 'IN', clause_type: 'repairs', severity: 'moderate', check_type: 'llm', description: 'Tenant held responsible for wear and tear deductions without objective standard', legal_reference: 'Transfer of Property Act 1882 §108(o)' },

  { id: 'in_eviction_001', jurisdiction_id: 'IN', clause_type: 'eviction', severity: 'critical', check_type: 'llm', description: 'Self-help eviction (lockout / utility shutoff without Rent Court order)', legal_reference: 'Model Tenancy Act 2021 §24; IPC §441' },
  { id: 'in_eviction_002', jurisdiction_id: 'IN', clause_type: 'eviction', severity: 'critical', check_type: 'llm', description: 'Clause allows eviction for minor or subjective lease breaches', legal_reference: 'Model Tenancy Act 2021 §21' },

  { id: 'in_increase_001', jurisdiction_id: 'IN', clause_type: 'rent_increase', severity: 'moderate', check_type: 'deterministic', description: 'Rent increase with less than 3 months written notice', legal_reference: 'Model Tenancy Act 2021 §9', check_config: { field: 'rent_increase_notice_days', min: 90 } },
  { id: 'in_increase_002', jurisdiction_id: 'IN', clause_type: 'rent_increase', severity: 'critical', check_type: 'llm', description: 'Landlord can increase rent arbitrarily at any time without cap or formula', legal_reference: 'Model Tenancy Act 2021 §9' },
  { id: 'in_increase_003', jurisdiction_id: 'IN', clause_type: 'rent_increase', severity: 'critical', check_type: 'llm', description: 'Retroactive rent increase applied to already-paid rent', legal_reference: 'Model Tenancy Act 2021 §9' },

  { id: 'in_discrimination_001', jurisdiction_id: 'IN', clause_type: 'discrimination', severity: 'critical', check_type: 'llm', description: 'Discriminatory conditions based on religion, caste, gender, or diet', legal_reference: 'Constitution of India Art.15; IPC §153A' },
  { id: 'in_discrimination_002', jurisdiction_id: 'IN', clause_type: 'discrimination', severity: 'critical', check_type: 'llm', description: 'Clause restricts dietary practices based on religion/community', legal_reference: 'Constitution of India Art.25' },
  { id: 'in_discrimination_003', jurisdiction_id: 'IN', clause_type: 'discrimination', severity: 'critical', check_type: 'llm', description: 'Curfew or guest restriction targeting female tenants', legal_reference: 'Constitution of India Art.14, 15' },

  { id: 'in_penalty_001', jurisdiction_id: 'IN', clause_type: 'penalty', severity: 'moderate', check_type: 'llm', description: 'Late-payment penalty is disproportionate and constitutes a penalty clause in law', legal_reference: 'Indian Contract Act 1872 §74' },
  { id: 'in_penalty_002', jurisdiction_id: 'IN', clause_type: 'penalty', severity: 'moderate', check_type: 'llm', description: 'Compound interest on overdue rent', legal_reference: 'Indian Contract Act 1872 §74' },
  { id: 'in_penalty_003', jurisdiction_id: 'IN', clause_type: 'penalty', severity: 'moderate', check_type: 'llm', description: 'Tenant liable for penalties caused by landlord breach', legal_reference: 'Indian Contract Act 1872 §74' },

  { id: 'in_subletting_001', jurisdiction_id: 'IN', clause_type: 'subletting', severity: 'minor', check_type: 'llm', description: 'Absolute ban on subletting with severe automatic penalty', legal_reference: 'Transfer of Property Act 1882 §108(j)' },

  { id: 'in_utilities_001', jurisdiction_id: 'IN', clause_type: 'utilities', severity: 'critical', check_type: 'llm', description: 'Landlord charges utilities above actual metered rate', legal_reference: 'Electricity Act 2003 §163; Consumer Protection Act 2019' },
  { id: 'in_utilities_002', jurisdiction_id: 'IN', clause_type: 'utilities', severity: 'critical', check_type: 'llm', description: 'Landlord can disconnect utilities as remedy for non-payment of rent', legal_reference: 'Model Tenancy Act 2021 §24' },
  { id: 'in_utilities_003', jurisdiction_id: 'IN', clause_type: 'utilities', severity: 'minor', check_type: 'llm', description: 'Maintenance charges undefined or revisable arbitrarily', legal_reference: 'Model Tenancy Act 2021 §10' },

  { id: 'in_arbitration_001', jurisdiction_id: 'IN', clause_type: 'arbitration', severity: 'critical', check_type: 'llm', description: 'Dispute resolution ousts jurisdiction of Rent Authority / civil courts', legal_reference: 'Model Tenancy Act 2021 §33; Arbitration & Conciliation Act 1996 §8' },
  { id: 'in_arbitration_002', jurisdiction_id: 'IN', clause_type: 'arbitration', severity: 'moderate', check_type: 'llm', description: 'Arbitrator appointed solely by landlord', legal_reference: 'Arbitration & Conciliation Act 1996 §11' },

  { id: 'in_privacy_001', jurisdiction_id: 'IN', clause_type: 'privacy', severity: 'critical', check_type: 'llm', description: 'CCTV / surveillance inside rented premises without tenant consent', legal_reference: 'Constitution of India Art.21; Puttaswamy judgment 2017' },
  { id: 'in_privacy_002', jurisdiction_id: 'IN', clause_type: 'privacy', severity: 'moderate', check_type: 'llm', description: 'Landlord can photograph interior without tenant consent', legal_reference: 'Constitution of India Art.21' },

  { id: 'in_abandonment_001', jurisdiction_id: 'IN', clause_type: 'abandonment', severity: 'critical', check_type: 'llm', description: 'Tenant deemed to have abandoned premises after very short absence', legal_reference: 'Model Tenancy Act 2021 §22' },

  { id: 'in_waiver_001', jurisdiction_id: 'IN', clause_type: 'waiver', severity: 'critical', check_type: 'llm', description: 'Tenant required to waive statutory rights under Rent Control Acts', legal_reference: 'Model Tenancy Act 2021 §35; State Rent Control Acts' },
  { id: 'in_waiver_002', jurisdiction_id: 'IN', clause_type: 'waiver', severity: 'moderate', check_type: 'llm', description: 'Tenant acknowledges property in perfect condition without inspection', legal_reference: 'Model Tenancy Act 2021 §4' },

  { id: 'in_indemnity_001', jurisdiction_id: 'IN', clause_type: 'indemnity', severity: 'critical', check_type: 'llm', description: 'Tenant liable for all landlord legal costs including cases landlord loses', legal_reference: 'Indian Contract Act 1872 §124' },
  { id: 'in_indemnity_002', jurisdiction_id: 'IN', clause_type: 'indemnity', severity: 'critical', check_type: 'llm', description: 'Tenant indemnifies landlord for landlord own structural negligence', legal_reference: 'Transfer of Property Act 1882 §108(b)' },

  { id: 'in_modification_001', jurisdiction_id: 'IN', clause_type: 'modification', severity: 'critical', check_type: 'llm', description: 'Landlord can unilaterally amend lease terms without tenant consent', legal_reference: 'Indian Contract Act 1872 §62; Model Tenancy Act 2021 §5' },
  { id: 'in_modification_002', jurisdiction_id: 'IN', clause_type: 'modification', severity: 'moderate', check_type: 'llm', description: 'Landlord can add house rules at any time binding on tenant', legal_reference: 'Indian Contract Act 1872 §62' },

  { id: 'in_suspicious_001', jurisdiction_id: 'IN', clause_type: 'suspicious_clause', severity: 'moderate', check_type: 'llm', description: 'Material breach defined at landlord sole discretion', legal_reference: 'Indian Contract Act 1872 §39' },
  { id: 'in_suspicious_002', jurisdiction_id: 'IN', clause_type: 'suspicious_clause', severity: 'moderate', check_type: 'llm', description: 'Blanket liability for all damage regardless of tenant fault', legal_reference: 'Indian Contract Act 1872 §73' },
  { id: 'in_suspicious_003', jurisdiction_id: 'IN', clause_type: 'suspicious_clause', severity: 'moderate', check_type: 'llm', description: 'No-claim clause — tenant agrees not to make any future claims against landlord', legal_reference: 'Indian Contract Act 1872 §28; Model Tenancy Act 2021 §35' },
  { id: 'in_suspicious_004', jurisdiction_id: 'IN', clause_type: 'general', severity: 'moderate', check_type: 'llm', description: 'Clause gives landlord "sole discretion" over a material term without any limit', legal_reference: 'Indian Contract Act 1872 §§23,74' },

  // ── Uganda ──────────────────────────────────────────────────────────────────
  { id: 'ug_deposit_001', jurisdiction_id: 'UG', clause_type: 'deposit', severity: 'critical', check_type: 'llm', description: 'Security deposit declared non-refundable', legal_reference: 'Landlord and Tenant Act 2022 §32' },
  { id: 'ug_entry_001', jurisdiction_id: 'UG', clause_type: 'entry_rights', severity: 'critical', check_type: 'llm', description: 'Landlord entry without 24-hour written notice', legal_reference: 'Landlord and Tenant Act 2022 §28' },
  { id: 'ug_increase_001', jurisdiction_id: 'UG', clause_type: 'rent_increase', severity: 'moderate', check_type: 'llm', description: 'Rent increase without 30-day written notice', legal_reference: 'Landlord and Tenant Act 2022 §19' },
  { id: 'ug_eviction_001', jurisdiction_id: 'UG', clause_type: 'eviction', severity: 'critical', check_type: 'llm', description: 'Self-help eviction or lockout without court order', legal_reference: 'Landlord and Tenant Act 2022 §45' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadRules(jurisdictionId) {
  // Match exact jurisdiction OR the base code (e.g. 'IN-MH' → also load 'IN' rules)
  const base = jurisdictionId.split('-')[0];
  return RULES.filter((r) => r.jurisdiction_id === jurisdictionId || r.jurisdiction_id === base);
}

/**
 * Sanitize raw PDF extracted text.
 * Returns null if the text is clearly garbage (PDF metadata, binary, XMP).
 * Returns a cleaned, trimmed string otherwise.
 */
function cleanClauseText(text) {
  if (!text || typeof text !== 'string') return null;
  const t = text.trim();
  if (t.length < 10) return null;

  // Detect PDF metadata / binary garbage markers
  const GARBAGE_MARKERS = [
    'CreationDate', 'ModDate', 'XMPMeta', 'xpacket', 'rdf:RDF',
    'pdfmark', 'endobj', 'endstream', 'BT\n', '\x00', '\x01',
    'obj\n', 'xref\n', 'startxref', '/Type /Page', 'Helvetica',
    'FlateDecode', 'Resources', '/MediaBox', 'procset',
  ];
  if (GARBAGE_MARKERS.some((m) => t.includes(m))) return null;

  // Detect too many non-printable / non-ASCII characters (binary PDF)
  const nonPrintable = (t.match(/[\x00-\x08\x0b-\x1f\x7f-\x9f]/g) || []).length;
  if (nonPrintable / t.length > 0.05) return null;

  // Detect very long token-like strings (binary encoded)
  const tokens = t.split(/\s+/);
  const longTokens = tokens.filter((tok) => tok.length > 40).length;
  if (longTokens / Math.max(tokens.length, 1) > 0.25) return null;

  return t;
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

  const violated = typeof cfg.max === 'number' ? value > cfg.max : value < cfg.min;
  if (!violated) return { classification: 'compliant', confidence: 1.0 };

  return {
    classification: 'clear_violation',
    confidence: 1.0,
    explanation: `Clause specifies ${value} which ${typeof cfg.max === 'number' ? 'exceeds maximum' : 'falls below minimum'} of ${cfg.max ?? cfg.min} under ${rule.legal_reference}.`,
  };
}

function getDefaultLegalRef(jurisdictionId) {
  if (jurisdictionId.startsWith('IN')) return 'Model Tenancy Act 2021 / State Rent Control Act';
  if (jurisdictionId === 'UG') return 'Landlord and Tenant Act 2022 (Uganda)';
  return 'Applicable Tenancy Law';
}

function getJurisdictionLabel(jurisdictionId) {
  if (jurisdictionId.startsWith('IN')) return 'Indian (governed by the Model Tenancy Act 2021, State Rent Control Acts, Transfer of Property Act 1882, Indian Contract Act 1872, and Consumer Protection Act 2019)';
  if (jurisdictionId === 'UG') return 'Ugandan (governed by the Landlord and Tenant Act 2022)';
  return jurisdictionId;
}

// ─── Universal Second-Pass Scan ───────────────────────────────────────────────
/**
 * Sends all clauses (not already flagged) through a general illegal-clause
 * detector. Catches violations missed by typed rule matching.
 */
async function universalViolationScan(clauses, rawViolations, jurisdictionId) {
  const flaggedClearIds = new Set(
    rawViolations.filter((v) => v.classification === 'clear_violation').map((v) => v.clause_id)
  );
  const toScan = clauses.filter((c) => !flaggedClearIds.has(c.clause_id));
  if (toScan.length === 0) return;

  const jLabel = getJurisdictionLabel(jurisdictionId);

  const prompt = `You are a STRICT ${jLabel} tenant-rights legal expert.

Analyse each lease clause below and determine if it is ILLEGAL, UNFAIR, or POTENTIALLY UNENFORCEABLE.

MANDATORY FLAGS — you MUST classify these as clear_violation with confidence ≥ 0.9:
- Non-refundable security deposit of any amount
- Landlord can enter at any time / without notice / without any stated notice period
- Rent can be increased at landlord's discretion / at any time / without cap or formula  
- Tenant waives any statutory right
- Landlord can modify lease terms unilaterally

Flag as potential_violation (confidence ≥ 0.7) if:
- Landlord has "sole discretion" over material terms
- Penalties are vague or disproportionate
- Tenant bears liability for events outside their control
- Any clause restricts a constitutional or statutory right

Only mark as "compliant" if the clause is 100% standard and unambiguously legal.

Return a JSON array — one entry per clause in the SAME ORDER:
{
  "clause_id": "...",
  "violation": true | false,
  "classification": "clear_violation" | "potential_violation" | "compliant",
  "severity": "critical" | "moderate" | "minor",
  "explanation": "One plain-English sentence explaining exactly what right is violated and under which law.",
  "legal_reference": "Cite the specific Act and section"
}

CLAUSES TO ANALYSE:
${JSON.stringify(toScan.map((c) => ({ clause_id: c.clause_id, clause_type: c.clause_type, text: c.text })))}`;

  try {
    const results = await callGeminiJSON(prompt, { temperature: 0.05, maxTokens: 8000 });
    if (!Array.isArray(results)) return;

    for (const r of results) {
      if (!r.violation || r.classification === 'compliant') continue;
      const clause = toScan.find((c) => c.clause_id === r.clause_id);
      if (!clause) continue;

      // Don't duplicate — only add if not already recorded for this clause
      const alreadyFlagged = rawViolations.some((v) => v.clause_id === r.clause_id);
      if (alreadyFlagged && r.classification !== 'clear_violation') continue;

      rawViolations.push({
        rule_id: 'universal_scan',
        clause_id: r.clause_id,
        clause_text: cleanClauseText(clause.text) || '',
        classification: r.classification || 'potential_violation',
        severity: r.severity || 'moderate',
        confidence: typeof r.confidence === 'number' ? r.confidence : 0.85,
        explanation: r.explanation || 'Clause flagged as potentially illegal or unfair.',
        legal_reference: r.legal_reference || getDefaultLegalRef(jurisdictionId),
      });
    }
  } catch (err) {
    console.warn('universalViolationScan error:', err.message);
  }
}

// ─── Main Exports ─────────────────────────────────────────────────────────────

export async function matchRules(clauses, jurisdictionId) {
  const rules = loadRules(jurisdictionId);
  const rawViolations = [];
  const llmQueue = [];

  for (const clause of clauses) {
    // Match exact type rules + catch-all suspicious_clause and general rules
    const relevantRules = rules.filter(
      (r) => r.clause_type === clause.clause_type
        || r.clause_type === 'suspicious_clause'
        || r.clause_type === 'general'
    );

    for (const rule of relevantRules) {
      if (rule.check_type === 'deterministic') {
        const result = runDeterministicCheck(rule, clause);
        if (result !== null) {
          if (result.classification !== 'compliant') {
            rawViolations.push({
              rule_id: rule.id,
              clause_id: clause.clause_id,
              clause_text: cleanClauseText(clause.text) || '',
              classification: result.classification,
              severity: rule.severity,
              confidence: result.confidence,
              explanation: result.explanation,
              legal_reference: rule.legal_reference,
            });
          }
          continue;
        }
      }
      llmQueue.push({ rule, clause });
    }
  }

  // ── Batch LLM check for typed rules ──────────────────────────────────────
  if (llmQueue.length > 0) {
    const items = llmQueue.map((item, i) => ({
      index: i,
      rule_id: item.rule.id,
      rule_description: item.rule.description,
      legal_reference: item.rule.legal_reference,
      clause_text: item.clause.text,
    }));

    const jLabel = getJurisdictionLabel(jurisdictionId);

    const prompt = `You are a strict ${jLabel} tenant-rights legal analyst.

For each item below, decide whether the lease clause violates the described rule.

CRITICAL: Err on the side of flagging. Only mark "compliant" when 100% certain the clause is lawful.
- Non-refundable deposit → ALWAYS clear_violation
- Entry without notice / "at any time" → ALWAYS clear_violation  
- Arbitrary rent increases → ALWAYS clear_violation
- Waiver of rights → ALWAYS clear_violation
- Sole discretion clauses → potential_violation

Classify each as: "clear_violation" | "potential_violation" | "compliant"

Return a JSON array in the SAME ORDER, each object:
{ "index": <number>, "classification": "...", "confidence": 0.0–1.0, "explanation": "One sentence citing which law is violated." }

ITEMS:
${JSON.stringify(items)}`;

    try {
      const batchResults = await callGeminiJSON(prompt, { temperature: 0.05, maxTokens: 6000 });
      const results = Array.isArray(batchResults) ? batchResults : [];

      for (const res of results) {
        const item = llmQueue[res.index];
        if (!item) continue;
        if ((res.classification || 'potential_violation') !== 'compliant') {
          rawViolations.push({
            rule_id: item.rule.id,
            clause_id: item.clause.clause_id,
            clause_text: cleanClauseText(item.clause.text) || '',
            classification: res.classification || 'potential_violation',
            severity: item.rule.severity,
            confidence: typeof res.confidence === 'number' ? res.confidence : 0.75,
            explanation: res.explanation || item.rule.description,
            legal_reference: item.rule.legal_reference || getDefaultLegalRef(jurisdictionId),
          });
        }
      }
    } catch (err) {
      console.warn('Typed LLM rule check failed, continuing to universal scan:', err.message);
    }
  }

  // ── Universal second-pass scan ────────────────────────────────────────────
  await universalViolationScan(clauses, rawViolations, jurisdictionId);

  // ── Deduplicate and sort ──────────────────────────────────────────────────
  const severityRank = { critical: 0, moderate: 1, minor: 2 };
  const consolidated = new Map();

  for (const v of rawViolations) {
    const key = v.clause_id || v.clause_text.trim().slice(0, 80);
    if (!consolidated.has(key)) {
      consolidated.set(key, {
        ...v,
        matched_rules: [v.rule_id],
        legal_references: v.legal_reference ? [v.legal_reference] : [],
        explanations: v.explanation ? [v.explanation] : [],
      });
    } else {
      const existing = consolidated.get(key);
      if ((severityRank[v.severity] ?? 2) < (severityRank[existing.severity] ?? 2)) {
        existing.severity = v.severity;
        existing.classification = v.classification;
      }
      existing.confidence = Math.max(existing.confidence, v.confidence);
      if (!existing.matched_rules.includes(v.rule_id)) existing.matched_rules.push(v.rule_id);
      if (v.legal_reference && !existing.legal_references.includes(v.legal_reference)) existing.legal_references.push(v.legal_reference);
      if (v.explanation && !existing.explanations.some((e) => e.toLowerCase() === v.explanation.toLowerCase())) existing.explanations.push(v.explanation);
    }
  }

  const violations = Array.from(consolidated.values()).map((v) => ({
    ...v,
    legal_reference: v.legal_references.join('; '),
    explanation: v.explanations.join(' '),
  }));

  violations.sort((a, b) => (severityRank[a.severity] ?? 2) - (severityRank[b.severity] ?? 2) || b.confidence - a.confidence);
  return violations;
}

export async function explainClausesPlainly(clauses) {
  try {
    const prompt = `Explain each of the following lease clauses in plain English, in exactly two short sentences, as if speaking to a tenant with no legal background. Return a JSON array of objects:
{ "clause_id": "...", "plain_explanation": "..." }

CLAUSES:
${JSON.stringify(clauses.map((c) => ({ clause_id: c.clause_id, text: c.text })))}`;

    const result = await callGeminiJSON(prompt, { maxTokens: 4096 });
    return Array.isArray(result) ? result : [];
  } catch (err) {
    console.warn('explainClausesPlainly fallback:', err.message);
    return clauses.map((c) => ({
      clause_id: c.clause_id,
      plain_explanation: `Clause covers ${(c.clause_type || 'tenancy').replace(/_/g, ' ')}. Review applicable local tenancy rules before signing.`,
    }));
  }
}

export async function summarizeLease(clauses, violations = []) {
  try {
    const violationMap = Object.fromEntries(violations.map((v) => [v.clause_id, v]));
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
Identify the 3 most important things the tenant MUST know before signing.

RULES:
- If a clause is CLEAR_VIOLATION or POTENTIAL_VIOLATION, warn clearly: use phrases like "This is illegal", "This violates your rights", "This clause cannot be enforced under Indian law".
- Each item must be ONE clear, actionable sentence.
- Prioritise violations first, then suspicious terms, then important-but-legal terms.
- Return a JSON array of exactly 3 strings.

ANNOTATED CLAUSES:
${JSON.stringify(annotated).slice(0, 9000)}`;

    const result = await callGeminiJSON(prompt, { temperature: 0.15 });
    return Array.isArray(result) ? result.slice(0, 3) : [];
  } catch (err) {
    console.warn('summarizeLease fallback:', err.message);
    if (violations.length > 0) {
      return violations.slice(0, 3).map(
        (v) => `⚠️ ${v.clause_text.slice(0, 50)}... — ${v.explanation}`
      );
    }
    return [
      'Lease scan completed. Review all flagged sections below carefully.',
      'Check security deposit refundability and notice period terms before signing.',
      'Verify landlord entry rights — they must provide prior written notice under Indian law.',
    ];
  }
}
