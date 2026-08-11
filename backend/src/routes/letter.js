import { Router } from 'express';
import store from '../store.js';
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

    const lease = await store.getLeaseById(lease_id, req.user.id);
    if (!lease) return res.status(404).json({ error: 'Lease not found' });

    const violations = await store.getViolationsByIds(lease_id, violation_ids);
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

    await store.createLetter({
      lease_id,
      user_id: req.user.id,
      violation_ids,
      body_text: bodyText,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="dispute-letter-lease-${lease_id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Letter generation failed' });
  }
});

export default router;
