import { Router } from 'express';
import multer from 'multer';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { parseLeasePdf, normalizePlainText } from '../services/pdfParser.js';
import { parseLeaseDocx } from '../services/docxParser.js';
import { extractTextFromOcrData } from '../services/imageOcrParser.js';
import { uploadToCloudinary, isCloudinaryConfigured } from '../services/cloudinaryService.js';
import { extractClauses } from '../services/clauseExtractor.js';
import { matchRules, explainClausesPlainly, summarizeLease } from '../services/rulesMatcher.js';

// Accept PDF, DOCX, and images — up to 20 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Please upload a PDF, DOCX, or image file.`));
    }
  },
});

const router = Router();

/**
 * POST /api/analyze
 * multipart/form-data: file (PDF/DOCX/image) OR text (plain text), plus jurisdiction_id
 * Runs the full analysis pipeline and persists the result.
 */
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const jurisdictionId = req.body.jurisdiction_id || 'IN';
    let text;
    let filename = null;
    let cloudinaryUrl = null;

    if (req.file) {
      filename = req.file.originalname;
      const mime = req.file.mimetype;

      // 1. Upload to Cloudinary if configured
      if (isCloudinaryConfigured()) {
        try {
          const uploadResult = await uploadToCloudinary(req.file.buffer, filename, mime);
          cloudinaryUrl = uploadResult.secure_url;

          // For images, try to extract text via Cloudinary OCR
          if (mime.startsWith('image/')) {
            text = extractTextFromOcrData(uploadResult.ocr_data);
          }
        } catch (uploadErr) {
          console.warn('Cloudinary upload failed (continuing with local parse):', uploadErr.message);
          // For images, we cannot proceed without OCR — re-throw
          if (req.file.mimetype.startsWith('image/')) {
            return res.status(422).json({ error: uploadErr.message });
          }
          // For PDF/DOCX, fall through to local parse
        }
      } else if (mime.startsWith('image/')) {
        return res.status(422).json({
          error: 'Image uploads require Cloudinary to be configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your backend .env file, or upload a PDF or DOCX instead.',
        });
      }

      // 2. Parse text locally for PDF and DOCX
      if (!text) {
        if (mime === 'application/pdf') {
          const parsed = await parseLeasePdf(req.file.buffer);
          text = parsed.text;
        } else if (
          mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          mime === 'application/msword'
        ) {
          text = await parseLeaseDocx(req.file.buffer);
        }
      }
    } else if (req.body.text) {
      text = normalizePlainText(req.body.text);
    } else {
      return res.status(400).json({ error: 'Provide a file (PDF, DOCX, or image) or pasted text.' });
    }

    if (!text || text.length < 30) {
      return res.status(422).json({
        error: 'Could not extract usable text from the document. Try a clearer scan or paste the text directly.',
      });
    }

    const { clauses, method } = await extractClauses(text);
    if (clauses.length === 0) {
      return res.status(422).json({ error: 'No clauses could be identified in this document.' });
    }

    const [violations, plainExplanations] = await Promise.all([
      matchRules(clauses, jurisdictionId),
      explainClausesPlainly(clauses),
    ]);

    // summarizeLease runs after matchRules so it can flag illegal clauses explicitly.
    const leaseSummary = await summarizeLease(clauses, violations);

    const explanationMap = Object.fromEntries(
      plainExplanations.map((e) => [e.clause_id, e.plain_explanation])
    );
    const clausesWithPlainText = clauses.map((c) => ({
      ...c,
      plain_explanation: explanationMap[c.clause_id] || null,
    }));

    const leaseInsert = db
      .prepare(
        `INSERT INTO leases (user_id, jurisdiction_id, filename, cloudinary_url, raw_text, clauses_json, lease_summary_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.user.id,
        jurisdictionId,
        filename,
        cloudinaryUrl,
        text,
        JSON.stringify(clausesWithPlainText),
        JSON.stringify(leaseSummary)
      );

    const leaseId = leaseInsert.lastInsertRowid;

    const insertViolation = db.prepare(
      `INSERT INTO violations (lease_id, rule_id, clause_id, clause_text, classification, severity, confidence, explanation, legal_reference)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const violationIds = [];
    for (const v of violations) {
      const info = insertViolation.run(
        leaseId, v.rule_id, v.clause_id, v.clause_text, v.classification,
        v.severity, v.confidence, v.explanation, v.legal_reference
      );
      violationIds.push(info.lastInsertRowid);
    }

    res.json({
      lease_id: leaseId,
      extraction_method: method,
      clause_count: clauses.length,
      clauses: clausesWithPlainText,
      lease_summary: leaseSummary,
      violations: violations.map((v, i) => ({ id: violationIds[i], ...v })),
      cloudinary_url: cloudinaryUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

export default router;
