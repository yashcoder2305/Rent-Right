/**
 * pdfParser.js
 *
 * Multi-strategy PDF text extraction:
 *  1. pdf-parse with custom page renderer (handles most PDFs)
 *  2. pdf-parse default (no custom renderer)  
 *  3. Raw BT...ET binary extraction (fallback for corrupted/non-standard PDFs)
 *
 * Known garbage strings extracted by pdf-parse from ReportLab-generated PDFs
 * (library metadata embedded in the PDF info dict) are filtered out.
 */
import pdfParse from 'pdf-parse';

// ─── Known garbage patterns from PDF library metadata ────────────────────────
const GARBAGE_PATTERNS = [
  /ReportLab\s+(?:Generated\s+)?PDF\s+(?:document|library)/gi,
  /FnL6XDerLDdd7aQL/g,
  /ReportLab\s+PDF\s+Library/gi,
  /Acrobat\s+Distiller/gi,
  /iText\s+\d+\.\d+/gi,
  /Microsoft\s+Word\s+-/gi,
  /^Producer:/gim,
  /^Creator:/gim,
  /^Author:/gim,
  /digest$/gim,
  /--\s*digest/gi,
];

function cleanGarbage(text) {
  let t = text;
  for (const rx of GARBAGE_PATTERNS) {
    t = t.replace(rx, ' ');
  }
  return t.replace(/\s{3,}/g, '\n').trim();
}

function isGarbageText(text) {
  const cleaned = text.trim();
  if (cleaned.length < 40) return true;
  // If more than 60% of the content looks like garbage tokens, reject it
  const garbageMatches = GARBAGE_PATTERNS.reduce((n, rx) => {
    const m = cleaned.match(rx);
    return n + (m ? m.join('').length : 0);
  }, 0);
  return garbageMatches > cleaned.length * 0.4;
}

// ─── Raw binary BT...ET extraction ───────────────────────────────────────────
function extractRawPdfStrings(buffer) {
  try {
    const str = buffer.toString('latin1');
    const textParts = [];

    // Extract text within BT (Begin Text) ... ET (End Text) blocks
    const btBlocks = str.match(/BT[\s\S]*?ET/g) || [];
    for (const block of btBlocks) {
      // Literal strings: (text)
      const literalStrings = block.match(/\(([^()\\]|\\[\s\S])*\)/g) || [];
      for (const s of literalStrings) {
        const cleaned = s
          .slice(1, -1)
          .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\\t/g, ' ')
          .replace(/\\(.)/g, '$1')
          .trim();
        if (cleaned.length >= 2 && /[a-zA-Z]/.test(cleaned) && !/^FnL|^ReportLab/i.test(cleaned)) {
          textParts.push(cleaned);
        }
      }
    }

    if (textParts.length >= 5) {
      return textParts.join(' ');
    }

    // Wider ASCII string scan as last resort
    const asciiStrings = str.match(/[A-Za-z][A-Za-z0-9\s,.'"\-:;()]{20,}/g) || [];
    const filtered = asciiStrings.filter((s) => !/FnL6X|ReportLab|Acrobat|iText/i.test(s));
    return filtered.join('\n');
  } catch (e) {
    return '';
  }
}

// ─── pdf-parse with custom renderer ─────────────────────────────────────────
async function pdfParseCustom(buffer) {
  const pageTexts = [];
  const options = {
    pagerender: (pageData) => {
      return pageData.getTextContent({ normalizeWhitespace: true }).then((content) => {
        const lines = [];
        let lastY = null;
        for (const item of content.items) {
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 2) {
            lines.push('\n');
          }
          lines.push(item.str);
          lastY = item.transform[5];
        }
        const text = lines.join(' ');
        pageTexts.push(text);
        return text;
      });
    },
  };

  const data = await pdfParse(buffer, options);
  // Use our page-level texts if they exist, otherwise fall through to data.text
  const combined = pageTexts.join('\n\n');
  return combined.trim().length > data.text.trim().length ? combined : data.text;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function parseLeasePdf(buffer) {
  let text = '';
  let numPages = 1;

  // Strategy 1: pdf-parse with custom renderer
  try {
    text = await pdfParseCustom(buffer);
    const data = await pdfParse(buffer);
    numPages = data.numpages || 1;
  } catch (err1) {
    console.warn(`pdf-parse custom renderer failed (${err1.message}) — trying default…`);

    // Strategy 2: pdf-parse default
    try {
      const data = await pdfParse(buffer);
      text = data.text || '';
      numPages = data.numpages || 1;
    } catch (err2) {
      console.warn(`pdf-parse default failed (${err2.message}) — trying raw binary…`);
    }
  }

  // Strategy 3: raw binary BT/ET extraction if text is empty or garbage
  if (!text || text.trim().length < 40 || isGarbageText(text)) {
    const rawText = extractRawPdfStrings(buffer);
    if (rawText.trim().length > text.trim().length) {
      text = rawText;
    }
  }

  // Remove garbage metadata strings embedded by PDF generators
  text = cleanGarbage(text);

  // Normalisation pipeline
  text = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/Page \d+ of \d+/gi, '')
    .replace(/^\s*\d+\s*$/gm, '') // stray page-number-only lines
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!text || text.length < 30) {
    throw new Error(
      'Could not extract readable text from this PDF. If it is a scanned image or photo PDF, please use "Paste Lease Text" tab or upload it as a JPG/PNG image.'
    );
  }

  return { text, numPages };
}

/** For pasted plain text — runs through normalisation for consistency. */
export function normalizePlainText(raw) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
