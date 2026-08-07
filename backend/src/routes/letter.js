import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { generateDisputeLetter } from '../services/letterGenerator.js';

const router = Router();

/**
 * POST /api/letter
 * body: { lease_id, violation_ids: [...], tenant_address, landlord_name, landlord_address }
 * Generates a single combined dispute letter covering every violation passed in.
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { lease_id, violation_ids, tenant_address, landlord_name, landlord_address } = req.body;
    if (!lease_id || !Array.isArray(violation_ids) || violation_ids.length === 0) {
      return res.status(400).json({ error: 'lease_id and a non-empty violation_ids array are required' });
    }

    const lease = db.prepare('SELECT * FROM leases WHERE id = ? AND user_id = ?').get(lease_id, req.user.id);
    if (!lease) return res.status(404).json({ error: 'Lease not found' });

    const placeholders = violation_ids.map(() => '?').join(',');
    const violations = db
      .prepare(`SELECT * FROM violations WHERE lease_id = ? AND id IN (${placeholders})`)
      .all(lease_id, ...violation_ids);

    if (violations.length === 0) {
      return res.status(404).json({ error: 'No matching violations found for this lease' });
    }

    const { pdfBuffer, bodyText } = await generateDisputeLetter({
      tenantName: req.user.name,
      tenantAddress: tenant_address,
      landlordName: landlord_name,
      landlordAddress: landlord_address,
      violations,
    });

    db.prepare(
      'INSERT INTO letters (lease_id, user_id, violation_ids, body_text) VALUES (?, ?, ?, ?)'
    ).run(lease_id, req.user.id, JSON.stringify(violation_ids), bodyText);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="dispute-letter-lease-${lease_id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Letter generation failed' });
  }
});

export default router;
