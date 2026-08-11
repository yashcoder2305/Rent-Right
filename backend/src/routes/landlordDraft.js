import { Router } from 'express';
import store from '../store.js';
import { requireAuth } from '../middleware/auth.js';
import { generateCompliantDraft } from '../services/landlordDraftGenerator.js';

const router = Router();

/**
 * POST /api/landlord/draft
 * body: { lease_id }
 * Generates a fully redrafted, legally compliant lease version.
 * Available to all users (mode-based, not role-based).
 */
router.post('/draft', requireAuth, async (req, res) => {
  try {
    const { lease_id } = req.body;
    if (!lease_id) {
      return res.status(400).json({ error: 'lease_id is required' });
    }

    const lease = await store.getLeaseById(lease_id, req.user.id);
    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' });
    }

    // Parse clauses and get violations
    const clauses = JSON.parse(lease.clauses_json || '[]');
    const violations = await store.getViolationsForLease(lease_id);

    if (clauses.length === 0) {
      return res.status(422).json({ error: 'No clauses found for this lease. Please re-analyze first.' });
    }

    // Generate compliant draft
    const { sections, summary, changes_count, pdfBuffer } = await generateCompliantDraft(
      clauses,
      violations,
      lease.jurisdiction_id
    );

    // Save the draft to the database
    await store.saveLandlordDraft(lease_id, { summary, changes_count, sections });

    // Return the PDF as a download and include JSON data in headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="compliant-draft-lease-${lease_id}.pdf"`);
    res.setHeader('X-Draft-Summary', encodeURIComponent(summary));
    res.setHeader('X-Changes-Count', String(changes_count));
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Draft generation failed' });
  }
});

/**
 * GET /api/landlord/draft/:lease_id
 * Returns the saved draft JSON for a lease (for displaying on-screen).
 */
router.get('/draft/:lease_id', requireAuth, async (req, res) => {
  try {
    const draft = await store.getLandlordDraft(req.params.lease_id, req.user.id);
    if (!draft) return res.status(404).json({ error: 'No draft generated yet for this lease.' });
    res.json(draft);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to retrieve draft' });
  }
});

export default router;
