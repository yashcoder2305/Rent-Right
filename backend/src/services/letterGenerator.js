import { jsPDF } from 'jspdf';

/**
 * Generates a formal print-ready dispute letter PDF.
 * Constructs the body programmatically using the detailed explanations and
 * legal references from the selected violations, ensuring 100% reliability
 * and inclusion of all selected items.
 */
export async function generateDisputeLetter({ tenantName, tenantAddress, landlordName, landlordAddress, violations }) {
  const intro = `I am writing to you regarding the residential lease agreement for the premises located at ${tenantAddress || 'the leased premises'}. Upon legal review of the proposed terms, several clauses have been identified as violating statutory tenant rights, being unfair, or being legally unenforceable under applicable tenancy laws.`;

  const paragraphs = violations.map((v, i) => {
    const cleanClause = v.clause_text ? v.clause_text.replace(/\s+/g, ' ').trim() : 'Clause';
    return `${i + 1}. Regarding the clause: "${cleanClause}"\n   Legal Concern: ${v.explanation.trim()}\n   Statutory Reference: ${v.legal_reference.trim()}`;
  });

  const outro = `Please review these concerns and provide an updated, legally compliant lease agreement for signature. I kindly request that you confirm these amendments in writing within 14 days of this notice.\n\nThank you for your cooperation in ensuring a mutually fair, lawful, and transparent tenancy.`;

  const bodyText = `${intro}\n\n${paragraphs.join('\n\n')}\n\n${outro}`;

  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const marginX = 56;
  let y = 72;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - marginX * 2;
  const lineHeight = 15;

  function writeParagraph(text, opts = {}) {
    const size = opts.size || 10.5;
    doc.setFontSize(size);
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');

    // Split text into individual lines based on explicit newlines first
    const rawLines = text.split('\n');
    for (const rawLine of rawLines) {
      const wrappedLines = doc.splitTextToSize(rawLine, maxWidth);
      for (const line of wrappedLines) {
        if (y > doc.internal.pageSize.getHeight() - 72) {
          doc.addPage();
          y = 72;
        }
        doc.text(line, marginX, y);
        y += lineHeight;
      }
    }
  }

  // Header Details
  writeParagraph(tenantName || '[Tenant Name]', { bold: true });
  writeParagraph(tenantAddress || '[Tenant Address]');
  y += lineHeight;
  writeParagraph(new Date().toLocaleDateString());
  y += lineHeight;
  writeParagraph(landlordName || '[Landlord Name]', { bold: true });
  writeParagraph(landlordAddress || '[Landlord Address]');
  y += lineHeight * 1.5;

  // Subject Line
  writeParagraph('Re: Formal Notice of Non-Compliant Lease Clauses', { bold: true, size: 11.5 });
  y += lineHeight;

  writeParagraph(`Dear ${landlordName || 'Landlord'},`);
  y += lineHeight;

  // Intro
  writeParagraph(intro);
  y += lineHeight;

  // Violations List
  for (const paragraph of paragraphs) {
    writeParagraph(paragraph);
    y += lineHeight;
  }

  // Outro
  writeParagraph(outro);
  y += lineHeight * 1.5;

  // Sign-off
  writeParagraph('Sincerely,');
  y += lineHeight * 2;
  writeParagraph(tenantName || '[Tenant Name]', { bold: true });
  y += lineHeight * 2;
  writeParagraph('(Copies of this letter and the underlying lease are retained for legal proceedings if necessary.)', {
    size: 8.5,
  });

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return { pdfBuffer, bodyText };
}
