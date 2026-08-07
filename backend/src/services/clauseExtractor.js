import { callGeminiJSON } from './gemini.js';

let clauseCounter = 0;
function nextId() {
  clauseCounter += 1;
  return `c_${Date.now()}_${clauseCounter}`;
}

// Guesses a clause_type label from clause text using keyword matching.
// Used so deterministic rule matching has something to key off before
// any LLM call happens.
const TYPE_KEYWORDS = {
  deposit:            /deposit|security\s+deposit/i,
  entry_rights:       /right\s+of\s+entry|landlord\s+may\s+enter|access\s+to\s+the\s+premises/i,
  notice_period:      /notice\s+period|terminat|vacat/i,
  repairs:            /repair|maintenance|structural/i,
  eviction:           /evict|lock\s?out|utilit(y|ies)\s+(disconnect|shut)/i,
  rent_increase:      /rent\s+increase|escalat/i,
  discrimination:     /discriminat/i,
  penalty:            /penalt|fine|late\s+fee|forfeit/i,
  subletting:         /sublet|sub-let|subleas|assign\s+the\s+(lease|tenancy)/i,
  pets:               /\bpet\b|animal|dog|cat/i,
  utilities:          /utilit|electricity|water\s+bill|gas\s+bill|maintenance\s+charge/i,
  arbitration:        /arbitrat|dispute\s+resolution|mediat/i,
  privacy:            /cctv|surveil|monitor|inspect|photograph/i,
  abandonment:        /abandon|deemed\s+vacated|vacate\s+without\s+notice/i,
  waiver:             /waiv|rights.*are.*given\s+up|relinquish/i,
  indemnity:          /indemnif|hold.*harmless|liable\s+for\s+all/i,
  modification:       /amend|modif|landlord.*change.*terms|unilateral/i,
  suspicious_clause:  /sole\s+discretion|without\s+reason|at\s+any\s+time|no\s+obligation/i,
};

function guessClauseType(text) {
  for (const [type, regex] of Object.entries(TYPE_KEYWORDS)) {
    if (regex.test(text)) return type;
  }
  return 'general';
}

function toClauseObjects(rawChunks, pageHint = 1) {
  return rawChunks
    .map((t) => t.trim())
    .filter((t) => t.length > 15) // discard noise fragments
    .map((text) => ({
      clause_id: nextId(),
      clause_type: guessClauseType(text),
      text,
      page: pageHint,
      confidence: 1.0, // regex-matched clauses are high-confidence structurally
      source: 'regex',
    }));
}

// Strategy 1: numbered clauses, e.g. "1. Deposit ..." / "1) ..."
function extractNumbered(text) {
  const parts = text.split(/\n(?=\s*\d{1,2}[.)]\s+)/g);
  return toClauseObjects(parts);
}

// Strategy 2: lettered subclauses, e.g. "(a) ..." / "a. ..."
function extractLettered(text) {
  const parts = text.split(/\n(?=\s*\(?[a-zA-Z]\)?[.)]\s+)/g);
  return toClauseObjects(parts);
}

// Strategy 3: bold-style header + paragraph, e.g. "DEPOSIT\nThe tenant shall..."
// (heuristic: a short ALL-CAPS or Title-Case line followed by body text)
function extractHeaderParagraph(text) {
  const parts = text.split(/\n(?=[A-Z][A-Za-z \/&-]{2,40}\n)/g);
  return toClauseObjects(parts);
}

/**
 * Hybrid clause extractor. Runs three cheap regex strategies and keeps
 * whichever produced the most clauses (best structural match). Only
 * escalates to an LLM segmentation call if all three strategies returned
 * fewer than 3 clauses — i.e. the lease is narrative/unstructured.
 */
export async function extractClauses(normalizedText) {
  const strategies = [
    extractNumbered(normalizedText),
    extractLettered(normalizedText),
    extractHeaderParagraph(normalizedText),
  ];

  const best = strategies.reduce((a, b) => (b.length > a.length ? b : a), []);

  if (best.length >= 3) {
    return { clauses: best, method: 'regex' };
  }

  // Fall back to LLM segmentation for unstructured/narrative leases.
  const prompt = `You are analyzing a residential lease agreement. Split the following lease text into
individual logical clauses. For each clause return an object with:
- "clause_type": one of [deposit, entry_rights, notice_period, repairs, eviction, rent_increase,
  discrimination, penalty, subletting, pets, utilities, arbitration, privacy, abandonment,
  waiver, indemnity, modification, suspicious_clause, general]
- "text": the exact clause text
- "confidence": your confidence (0-1) that this is a correctly segmented, complete clause

Return a JSON array of these objects only.

LEASE TEXT:
"""
${normalizedText.slice(0, 12000)}
"""`;

  const llmClauses = await callGeminiJSON(prompt);
  const clauses = (Array.isArray(llmClauses) ? llmClauses : []).map((c) => ({
    clause_id: nextId(),
    clause_type: c.clause_type || 'general',
    text: c.text,
    page: 1,
    confidence: typeof c.confidence === 'number' ? c.confidence : 0.7,
    source: 'llm',
  }));

  return { clauses, method: 'llm' };
}
