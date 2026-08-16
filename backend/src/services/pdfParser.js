/**
 * pdfParser.js
 * Uses pdf-parse with automatic raw buffer text stream fallback for PDFs with non-standard tokens.
 */
import pdfParse from 'pdf-parse';

/**
 * Fallback text extractor: extracts text streams directly from PDF binary buffer
 * when pdf-parse encounters malformed stream tokens (e.g. "Command token too long").
 */
function extractRawPdfStrings(buffer) {
  try {
    const str = buffer.toString('latin1');
    const textParts = [];

    // Extract text within BT (Begin Text) ... ET (End Text) blocks
    const btBlocks = str.match(/BT[\s\S]*?ET/g) || [];
    for (const block of btBlocks) {
      // Find strings in parentheses (...) or hex strings <...>
      const strings = block.match(/\(([^()\\]|\\[\s\S])*\)/g) || [];
      for (const s of strings) {
        const cleaned = s
          .slice(1, -1)
          .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
          .replace(/\\(.)/g, '$1')
          .trim();
        if (cleaned.length >= 2 && /[a-zA-Z0-9]/.test(cleaned)) {
          textParts.push(cleaned);
        }
      }
    }

    // If BT...ET blocks were not found, scan all ASCII strings in the PDF
    if (textParts.length < 5) {
      const asciiStrings = str.match(/[A-Z][A-Za-z0-9\s,.'"-]{15,}/g) || [];
      return asciiStrings.join('\n');
    }

    return textParts.join(' ');
  } catch (e) {
    return '';
  }
}

/**
 * Extracts and normalises text from an uploaded lease PDF buffer.
 */
export async function parseLeasePdf(buffer) {
  let text = '';
  let numPages = 1;

  try {
    const data = await pdfParse(buffer);
    text = data.text || '';
    numPages = data.numpages || 1;
  } catch (err) {
    console.warn(`pdf-parse failed (${err.message}) — attempting fallback string extraction…`);
    text = extractRawPdfStrings(buffer);
  }

  // If pdf-parse returned almost nothing or threw an error, check raw fallback
  if (!text || text.trim().length < 30) {
    const rawFallback = extractRawPdfStrings(buffer);
    if (rawFallback && rawFallback.length > text.length) {
      text = rawFallback;
    }
  }

  if (!text || text.trim().length < 20) {
    throw new Error(
      `Could not extract readable text from this PDF file. If it is a scanned image or photo PDF, please use the 'Paste Lease Text' tab or upload it as an image (JPG/PNG).`
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
