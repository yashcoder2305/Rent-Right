/**
 * clauseExtractor.js
 *
 * Hybrid clause extraction pipeline:
 *  1. Normalise all line endings
 *  2. Try 5 cheap structural regex strategies (numbered, lettered, header-para, keyword-header, paragraph)
 *  3. Keep whichever strategy yielded the most clauses
 *  4. Only call LLM if regex produced < 2 clauses (truly unstructured text)
 *  5. Hard fallback: split by double-newlines (paragraphs) if everything else fails
 */

import { callGeminiJSON } from './gemini.js';

let clauseCounter = 0;
function nextId() {
  clauseCounter += 1;
  return `c_${Date.now()}_${clauseCounter}`;
}

// ─── Clause Type Keyword Matcher ──────────────────────────────────────────────

const TYPE_KEYWORDS = {
  deposit:           /deposit|security\s+deposit/i,
  entry_rights:      /landlord\s+may\s+enter|right\s+of\s+entry|access\s+to\s+the\s+premises|enter\s+(the\s+)?premises/i,
  notice_period:     /notice\s+period|terminat|vacat/i,
  repairs:           /repair|maintenance|structural/i,
  eviction:          /evict|lock\s?out|utilit(y|ies)\s+(disconnect|shut)/i,
  rent_increase:     /rent\s+increase|escalat|increase.*rent|rent.*increas/i,
  discrimination:    /discriminat/i,
  penalty:           /penalt|fine|late\s+fee|forfeit/i,
  subletting:        /sublet|sub-let|subleas|assign\s+the\s+(lease|tenancy)/i,
  pets:              /\bpet\b|animal|dog|cat/i,
  utilities:         /utilit|electricity|water\s+bill|gas\s+bill|maintenance\s+charge/i,
  arbitration:       /arbitrat|dispute\s+resolution|mediat/i,
  privacy:           /cctv|surveil|monitor|inspect|photograph/i,
  abandonment:       /abandon|deemed\s+vacated|vacate\s+without\s+notice/i,
  waiver:            /waiv|rights.*are.*given\s+up|relinquish/i,
  indemnity:         /indemnif|hold.*harmless|liable\s+for\s+all/i,
  modification:      /amend|modif|landlord.*change.*terms|unilateral/i,
  suspicious_clause: /sole\s+discretion|without\s+(reason|notice)|at\s+any\s+time|no\s+obligation|non.refundable/i,
};

function guessClauseType(text) {
  for (const [type, regex] of Object.entries(TYPE_KEYWORDS)) {
    if (regex.test(text)) return type;
  }
  return 'general';
}

/**
 * Returns true if the text chunk is garbage PDF content and should be discarded.
 * Guards against MD5 hashes, binary tokens, and metadata leaking into clauses.
 */
function isGarbageClause(text) {
  const t = text.trim();

  // Must have at least 4 real words (sequences of 3+ alphabetic chars)
  const realWords = (t.match(/[a-zA-Z]{3,}/g) || []).length;
  if (realWords < 4) return true;

  // Reject if the text contains MD5/SHA hex hashes
  if (/\b[0-9a-f]{24,}\b/i.test(t)) return true;

  // Reject if more than 20% of chars are non-printable or PDF-operator-like
  const nonWord = (t.match(/[^\w\s.,;:\-'"()!?%@&/\n]/g) || []).length;
  if (nonWord / t.length > 0.2) return true;

  // Reject PDF metadata keyword lines
  const PDF_KEYS = ['CreationDate', 'ModDate', 'XMPMeta', 'xpacket', 'endobj', 'endstream', 'startxref', 'FlateDecode', '/MediaBox', '/Type /'];
  if (PDF_KEYS.some((k) => t.includes(k))) return true;

  return false;
}

function toClauseObjects(rawChunks, source = 'regex') {
  return rawChunks
    .map((t) => t.trim())
    .filter((t) => t.length > 20 && !isGarbageClause(t))
    .map((text) => ({
      clause_id: nextId(),
      clause_type: guessClauseType(text),
      text,
      page: 1,
      confidence: source === 'regex' ? 1.0 : 0.85,
      source,
    }));
}

// ── Strategy 1: numbered clauses  "1. Rent ..."  or  "1) Rent ..." ──────────
function extractNumbered(text) {
  // Matches both \n and start-of-string before numbered item
  const parts = text.split(/(?:^|\n)(?=\s*\d{1,2}[.)]\s+\S)/gm);
  return toClauseObjects(parts);
}

// ── Strategy 2: lettered subclauses  "(a) ..."  /  "a. ..." ─────────────────
function extractLettered(text) {
  const parts = text.split(/\n(?=\s*\(?[a-zA-Z]\)?[.)]\s+)/g);
  return toClauseObjects(parts);
}

// ── Strategy 3: ALL-CAPS or Title-Case header on its own line ────────────────
//    e.g.  "DEPOSIT\nThe tenant shall..."
function extractHeaderParagraph(text) {
  const parts = text.split(/\n(?=[A-Z][A-Za-z \/&\-]{2,50}\n)/g);
  return toClauseObjects(parts);
}

// ── Strategy 4: keyword section headers  "Rent:", "Deposit:" etc. ───────────
function extractKeywordHeader(text) {
  const headerRx = /\n(?=\s*(?:Rent|Deposit|Security|Entry|Notice|Repair|Eviction|Increase|Penalty|Pet|Utili|Sublet|Arbitrat|Privacy|Abandon|Waiver|Indemni|Modif|Maintena|Termina|Vacate|Landlord|Tenant)[^.\n]{0,40}[:–—]\s)/gi;
  const parts = text.split(headerRx);
  return toClauseObjects(parts);
}

// ── Strategy 5: paragraph split (double newline) ─────────────────────────────
function extractParagraphs(text) {
  const parts = text.split(/\n{2,}/g);
  return toClauseObjects(parts);
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function extractClauses(rawText) {
  // Normalise line endings (\r\n → \n, lone \r → \n)
  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const strategies = [
    extractNumbered(text),
    extractLettered(text),
    extractHeaderParagraph(text),
    extractKeywordHeader(text),
    extractParagraphs(text),
  ];

  // Pick the strategy with the most clauses
  const best = strategies.reduce((a, b) => (b.length > a.length ? b : a), []);

  // If at least 2 clauses found, use regex result — no LLM needed
  if (best.length >= 2) {
    return { clauses: best, method: 'regex' };
  }

  // ── LLM segmentation for truly unstructured/narrative leases ────────────
  try {
    const prompt = `You are analysing a residential lease agreement. Your job is to split the text into individual logical clauses.

For each clause return:
- "clause_type": one of [deposit, entry_rights, notice_period, repairs, eviction, rent_increase, discrimination, penalty, subletting, pets, utilities, arbitration, privacy, abandonment, waiver, indemnity, modification, suspicious_clause, general]
- "text": the exact clause text as it appears
- "confidence": 0.0–1.0

Return ONLY a valid JSON array. No markdown. No explanation.

LEASE TEXT:
"""
${text.slice(0, 14000)}
"""`;

    const llmClauses = await callGeminiJSON(prompt, { maxTokens: 6000 });
    const clauses = (Array.isArray(llmClauses) ? llmClauses : [])
      .filter((c) => c && typeof c.text === 'string' && c.text.trim().length > 10)
      .map((c) => ({
        clause_id: nextId(),
        clause_type: c.clause_type || guessClauseType(c.text),
        text: c.text.trim(),
        page: 1,
        confidence: typeof c.confidence === 'number' ? c.confidence : 0.7,
        source: 'llm',
      }));

    if (clauses.length > 0) {
      return { clauses, method: 'llm' };
    }
  } catch (err) {
    console.warn('LLM clause extraction failed, using paragraph fallback:', err.message);
  }

  // ── Hard fallback: use paragraph split regardless ────────────────────────
  const paragraphClauses = extractParagraphs(text);
  if (paragraphClauses.length > 0) {
    return { clauses: paragraphClauses, method: 'paragraph_fallback' };
  }

  // ── Absolute last resort: treat entire text as one clause ────────────────
  if (text.trim().length > 20) {
    return {
      clauses: [{
        clause_id: nextId(),
        clause_type: guessClauseType(text),
        text: text.trim().slice(0, 3000),
        page: 1,
        confidence: 0.5,
        source: 'full_text_fallback',
      }],
      method: 'full_text_fallback',
    };
  }

  return { clauses: [], method: 'none' };
}
