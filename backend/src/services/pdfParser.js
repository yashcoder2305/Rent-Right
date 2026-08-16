/**
 * pdfParser.js
 * Uses pdf-parse — native, pure Node.js PDF text extraction without DOM/worker dependencies.
 */
import pdfParse from 'pdf-parse';

/**
 * Extracts and normalises text from an uploaded lease PDF buffer.
 */
export async function parseLeasePdf(buffer) {
  let text = '';
  let numPages = 0;

  try {
    const data = await pdfParse(buffer);
    text = data.text || '';
    numPages = data.numpages || 1;
  } catch (err) {
    throw new Error(
      `Could not read the PDF file — it may be corrupted, password-protected, or in an unsupported format. ` +
      `Try re-saving it as a standard PDF, or paste the lease text directly. (Details: ${err.message})`
    );
  }

  // Normalisation pipeline
  text = text
    .replace(/\r\n/g, '\n')
    .replace(/Page \d+ of \d+/gi, '')
    .replace(/^\s*\d+\s*$/gm, '') // stray page-number-only lines
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { text, numPages };
}

/** For pasted plain text — still runs through normalisation for consistency. */
export function normalizePlainText(raw) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
