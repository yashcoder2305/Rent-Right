// Image OCR parser.
// Tries to extract text from image uploads (JPG/PNG scans of leases).
// Primary: reads OCR data returned by Cloudinary's adv_ocr add-on.
// Fallback: returns a friendly error asking the user to upload a text-based file instead.

/**
 * Extract text from Cloudinary OCR result data.
 * @param {object|null} ocrData - The ocr info object returned by Cloudinary after upload.
 * @returns {string} - Extracted text.
 */
export function extractTextFromOcrData(ocrData) {
  if (!ocrData) {
    throw new Error(
      'Image OCR is not enabled on your Cloudinary account. ' +
      'Please enable the "Optical Character Recognition" add-on in your Cloudinary console, ' +
      'or upload a PDF or DOCX version of the lease instead.'
    );
  }

  // Cloudinary adv_ocr nests text under info.ocr.adv_ocr.data[0].full_text_annotation.text
  const fullText =
    ocrData?.adv_ocr?.data?.[0]?.full_text_annotation?.text ||
    ocrData?.adv_ocr?.data?.[0]?.text_annotations?.[0]?.description ||
    '';

  if (!fullText || fullText.trim().length < 30) {
    throw new Error(
      'Could not extract readable text from the uploaded image. ' +
      'Please ensure the image is clear, well-lit, and contains visible lease text. ' +
      'For best results, upload a PDF or DOCX file instead.'
    );
  }

  return fullText.trim();
}
