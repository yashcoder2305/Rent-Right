import { jsPDF } from 'jspdf';
import { callGemini } from './gemini.js';

/**
 * Generates the letter body text via LLM, addressing every violation as a
 * numbered paragraph, then renders a print-ready PDF with jsPDF.
 * Accepts an array of violations (not a single one) per the sprint plan.
 */
export async function generateDisputeLetter({ tenantName, tenantAddress, landlordName, landlordAddress, violations }) {
  const prompt = `Write the body of a formal, respectful but firm dispute letter from a tenant to their
landlord. The letter must address EACH of the following violations as its own numbered paragraph,
referencing the specific clause and the legal reference provided. End with a formal demand for remedy
within 14 days, and a note that copies will be retained for legal proceedings if necessary. Do not
include a greeting/salutation or signature block — only the body paragraphs starting from paragraph 1.

VIOLATIONS:
${violations
  .map(
    (v, i) =>
      `${i + 1}. Clause: "${v.clause_text}" | Issue: ${v.explanation} | Legal reference: ${v.legal_reference}`
  )
  .join('\n')}`;

  const bodyText = await callGemini(prompt, { temperature: 0.3, maxTokens: 2048 });

  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const marginX = 56;
  let y = 72;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - marginX * 2;
  const lineHeight = 16;

  function writeLine(text, opts = {}) {
    const size = opts.size || 11;
    doc.setFontSize(size);
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      if (y > doc.internal.pageSize.getHeight() - 72) {
        doc.addPage();
        y = 72;
      }
      doc.text(line, marginX, y);
      y += lineHeight;
    }
  }

  writeLine(tenantName || '[Tenant Name]', { bold: true });
  writeLine(tenantAddress || '[Tenant Address]');
  y += lineHeight;
  writeLine(new Date().toLocaleDateString());
  y += lineHeight;
  writeLine(landlordName || '[Landlord Name]', { bold: true });
  writeLine(landlordAddress || '[Landlord Address]');
  y += lineHeight * 1.5;

  writeLine('Re: Formal Notice of Lease Violations', { bold: true, size: 12 });
  y += lineHeight;

  writeLine(`Dear ${landlordName || 'Landlord'},`);
  y += lineHeight / 2;

  writeLine(bodyText);
  y += lineHeight;

  writeLine('Sincerely,');
  y += lineHeight * 2;
  writeLine(tenantName || '[Tenant Name]');
  y += lineHeight * 2;
  writeLine('(Copies of this letter and the underlying lease are retained for legal proceedings if necessary.)', {
    size: 9,
  });

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return { pdfBuffer, bodyText };
}
