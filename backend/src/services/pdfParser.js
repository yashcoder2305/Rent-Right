/**
 * pdfParser.js
 * Uses pdfjs-dist (Mozilla PDF.js) — handles modern, cross-referenced,
 * and linearised PDFs that trip up the older pdf-parse library.
 */
import { fileURLToPath } from 'url';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// In Node.js we must point to the worker file explicitly (no browser Web Worker context)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerPath = path.resolve(
  __dirname,
  '../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'
);
pdfjsLib.GlobalWorkerOptions.workerSrc = `file:///${workerPath.replace(/\\/g, '/')}`;

/**
 * Extracts and normalises text from an uploaded lease PDF buffer.
 */
export async function parseLeasePdf(buffer) {
  let text = '';
  let numPages = 0;

  try {
    const uint8 = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({
      data: uint8,
      verbosity: 0,       // suppress internal warnings
      stopAtErrors: false, // attempt recovery on minor corruption
    });

    const pdf = await loadingTask.promise;
    numPages = pdf.numPages;

    const pageTexts = [];
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(' ');
      pageTexts.push(pageText);
    }

    text = pageTexts.join('\n\n');
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
