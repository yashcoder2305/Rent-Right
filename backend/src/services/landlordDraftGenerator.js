// Landlord draft generator — takes a set of violations and the original clauses,
// and uses the LLM to produce a fully rewritten, legally compliant lease draft.

import { callGeminiJSON } from './gemini.js';
import { jsPDF } from 'jspdf';

/**
 * Returns true if the clause text is PDF metadata/binary garbage.
 */
function isGarbageClause(text) {
  if (!text || typeof text !== 'string' || text.trim().length < 15) return true;
  const t = text.trim();
  const MARKERS = ['CreationDate', 'ModDate', 'endobj', 'startxref', 'FlateDecode', '/MediaBox', 'XMPMeta'];
  if (MARKERS.some((m) => t.includes(m))) return true;
  if (/\b[0-9a-f]{24,}\b/i.test(t)) return true; // MD5/SHA hashes
  const realWords = (t.match(/[a-zA-Z]{3,}/g) || []).length;
  return realWords < 4; // fewer than 4 real words = garbage
}

/**
 * Generate a legally compliant lease draft from violations and original clauses.
 * @param {Array} clauses - The original parsed clauses from the lease.
 * @param {Array} violations - The violations found in the lease.
 * @param {string} jurisdictionId - e.g. 'IN', 'UG'
 * @returns {Promise<{ sections: Array, pdfBuffer: Buffer, summaryText: string }>}
 */
export async function generateCompliantDraft(clauses, violations, jurisdictionId) {
  // Filter out garbage PDF metadata clauses before any processing
  const cleanClauses = clauses.filter((c) => !isGarbageClause(c.text));
  if (cleanClauses.length === 0) {
    throw new Error('No readable lease clauses found. Please re-upload the lease or paste the text directly.');
  }

  // Build a structured view of clean clauses + their violations
  const clauseSummary = cleanClauses.map((c) => {
    const relatedViolations = violations.filter((v) => v.clause_id === c.clause_id);
    return {
      clause_id: c.clause_id,
      original_text: c.text,
      has_violations: relatedViolations.length > 0,
      violations: relatedViolations.map((v) => ({
        severity: v.severity,
        explanation: v.explanation,
        legal_reference: v.legal_reference,
      })),
    };
  });

  const violatedClauses = clauseSummary.filter((c) => c.has_violations);

  // If no violations exist, return original lease as-is without calling the LLM
  if (violatedClauses.length === 0) {
    const sections = cleanClauses.map((c) => ({
      clause_id: c.clause_id,
      title: c.clause_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      original_text: c.text,
      redrafted_text: c.text,
      was_changed: false,
      change_reason: null,
      legal_basis: null,
    }));
    const summary = 'All clauses are compliant with local tenancy laws. No changes required.';
    const pdfBuffer = generateDraftPdf({ summary, changes_count: 0, sections }, jurisdictionId);
    return {
      sections,
      summary,
      changes_count: 0,
      pdfBuffer,
    };
  }

  // Only pass violated clauses to the LLM to prevent hitting maxOutputTokens limit (2048)
  const prompt = `
You are a senior tenancy law expert specialising in the residential tenancy laws of jurisdiction: ${jurisdictionId}.

Several clauses in a proposed lease agreement have been flagged as legally non-compliant or unfair.
Your task is to draft legally sound, balanced rewrites for ONLY the flagged non-compliant clauses.

FLAGGED CLAUSES WITH VIOLATION DETAILS:
${JSON.stringify(violatedClauses, null, 2)}

Return a JSON object in EXACTLY this format:
{
  "summary": "A 2-3 sentence overview of the key changes made and why the draft is now compliant.",
  "rewrites": [
    {
      "clause_id": "the original clause_id",
      "title": "A short descriptive title for this clause (e.g. 'Security Deposit', 'Entry Rights')",
      "redrafted_text": "The new legally compliant text to replace the non-compliant clause.",
      "change_reason": "Brief explanation of why this change was necessary.",
      "legal_basis": "The specific act and section this complies with (e.g., 'Model Tenancy Act 2021, Section 11')"
    }
  ]
}

RULES:
- Provide rewrites ONLY for the clauses listed above.
- The redrafted_text must be professional, clear, and legally sound — suitable for an actual lease.
- Do NOT include any other clauses in your response.
- Respond with ONLY the JSON object. No markdown, no preamble.
`;

  const draftJson = await callGeminiJSON(prompt, { maxTokens: 8192 });

  if (!draftJson.rewrites || !Array.isArray(draftJson.rewrites)) {
    throw new Error('LLM returned an invalid draft rewrites format. Please try again.');
  }

  // Combine original compliant clauses with the LLM-rewritten clauses
  const sections = cleanClauses.map((c) => {
    const rewrite = draftJson.rewrites.find((r) => r.clause_id === c.clause_id);
    const title = c.clause_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    if (rewrite) {
      return {
        clause_id: c.clause_id,
        title: rewrite.title || title,
        original_text: c.text,
        redrafted_text: rewrite.redrafted_text,
        was_changed: true,
        change_reason: rewrite.change_reason,
        legal_basis: rewrite.legal_basis,
      };
    } else {
      return {
        clause_id: c.clause_id,
        title: title,
        original_text: c.text,
        redrafted_text: c.text,
        was_changed: false,
        change_reason: null,
        legal_basis: null,
      };
    }
  });

  const fullDraft = {
    summary: draftJson.summary,
    changes_count: sections.filter((s) => s.was_changed).length,
    sections,
  };

  // Generate PDF
  const pdfBuffer = generateDraftPdf(fullDraft, jurisdictionId);

  return {
    sections: fullDraft.sections,
    summary: fullDraft.summary,
    changes_count: fullDraft.changes_count,
    pdfBuffer,
  };
}

/**
 * Render the draft to a PDF using jsPDF.
 */
function generateDraftPdf(draft, jurisdictionId) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addText = (text, size = 10, style = 'normal', color = [30, 30, 30]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(text || ''), contentWidth);
    lines.forEach((line) => {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += size * 0.42;
    });
    y += 2;
  };

  const addDivider = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  };

  // Header
  addText('LEGALLY COMPLIANT LEASE DRAFT', 16, 'bold', [37, 99, 235]);
  addText(`Generated by RentRight • Jurisdiction: ${jurisdictionId}`, 8, 'normal', [100, 100, 100]);
  addText(`Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 8, 'normal', [100, 100, 100]);
  y += 3;
  addDivider();

  // Summary
  addText('SUMMARY OF CHANGES', 11, 'bold', [37, 99, 235]);
  addText(draft.summary, 10, 'normal');
  addText(`Total clauses modified: ${draft.changes_count}`, 10, 'bolditalic', [100, 100, 100]);
  y += 2;
  addDivider();

  // Clauses
  draft.sections.forEach((section, i) => {
    // Clause title
    const titleColor = section.was_changed ? [220, 38, 38] : [30, 30, 30];
    addText(`${i + 1}. ${section.title}${section.was_changed ? '  [REVISED]' : ''}`, 11, 'bold', titleColor);

    if (section.was_changed) {
      addText('▸ REDRAFTED (Compliant Version):', 9, 'bold', [22, 163, 74]);
      addText(section.redrafted_text, 10, 'normal', [30, 30, 30]);

      if (section.legal_basis) {
        addText(`Legal basis: ${section.legal_basis}`, 8, 'italic', [100, 100, 100]);
      }

      if (section.change_reason) {
        addText(`Why changed: ${section.change_reason}`, 8, 'italic', [120, 80, 0]);
      }
    } else {
      addText(section.redrafted_text, 10, 'normal', [60, 60, 60]);
    }

    y += 2;
    if (i < draft.sections.length - 1) {
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, y, pageWidth - margin, y);
      y += 4;
    }
  });

  // Footer
  y += 5;
  addDivider();
  addText(
    'This document was generated by RentRight AI. It is intended as a starting point for a legally compliant lease ' +
    'and should be reviewed by a qualified legal professional before use.',
    7, 'italic', [130, 130, 130]
  );

  return Buffer.from(doc.output('arraybuffer'));
}
