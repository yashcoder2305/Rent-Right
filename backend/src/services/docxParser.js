// DOCX parser — converts Word document buffers to plain text using mammoth.

import mammoth from 'mammoth';

/**
 * Extract plain text from a .docx buffer.
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
export async function parseLeaseDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  const text = (result.value || '').trim();
  if (!text) {
    throw new Error('Could not extract text from DOCX. The document may be empty or corrupted.');
  }
  return text;
}
