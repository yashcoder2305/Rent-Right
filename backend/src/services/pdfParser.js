/**
 * pdfParser.js
 * Uses pdfjs-dist (Mozilla PDF.js) — handles modern, cross-referenced,
 * and linearised PDFs that trip up the older pdf-parse library.
 */
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Polyfill DOMMatrix for Node.js environments where pdfjs-dist looks for browser matrix transforms
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor(init) {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
      if (Array.isArray(init)) {
        if (init.length >= 6) {
          this.a = init[0]; this.b = init[1]; this.c = init[2]; this.d = init[3]; this.e = init[4]; this.f = init[5];
        }
      }
    }
    multiply(m) { return this; }
    translate(tx = 0, ty = 0) { return this; }
    scale(sx = 1, sy = sx) { return this; }
    rotate(angle = 0) { return this; }
    inverse() { return this; }
    transformPoint(p) { return p || { x: 0, y: 0 }; }
  };
}

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// In Node.js we must point to the worker file explicitly
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localWorker = path.resolve(__dirname, '../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
const rootWorker = path.resolve(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
const workerPath = fs.existsSync(localWorker) ? localWorker : rootWorker;

if (fs.existsSync(workerPath)) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `file:///${workerPath.replace(/\\/g, '/')}`;
}

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
