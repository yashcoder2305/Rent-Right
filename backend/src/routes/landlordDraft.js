import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { generateCompliantDraft } from '../services/landlordDraftGenerator.js';

const router = Router();

/**
 * POST /api/landlord/draft
 * body: { lease_id }
 * Landlord-only endpoint. Takes an already-analyzed lease and generates
 * a fully redrafted, legally compliant version.
 */
router.post('/draft', requireAuth, async (req, res) => {
  try {
    // Only landlords can use this endpoint
    if (req.user.role !== 'landlord') {
      return res.status(403).json({
        error: 'This feature is only available for landlord accounts.',
      });
    }

    const { lease_id } = req.body;
    if (!lease_id) {
      return res.status(400).json({ error: 'lease_id is required' });
    }

    // Verify the lease belongs to this user
    const lease = db.prepare('SELECT * FROM leases WHERE id = ? AND user_id = ?').get(lease_id, req.user.id);
    if (!lease) {
      return res.status(404).json({ error: 'Lease not found' });
    }

    // Parse clauses and violations
    const clauses = JSON.parse(lease.clauses_json || '[]');
    const violations = db
      .prepare('SELECT * FROM violations WHERE lease_id = ?')
      .all(lease_id);

    if (clauses.length === 0) {
      return res.status(422).json({ error: 'No clauses found for this lease. Please re-analyze first.' });
    }

    // Generate compliant draft
    const { sections, summary, changes_count, pdfBuffer } = await generateCompliantDraft(
      clauses,
      violations,
      lease.jurisdiction_id
    );

    // Save the draft JSON to the database
    const draftJson = JSON.stringify({ summary, changes_count, sections });
    db.prepare('UPDATE leases SET landlord_draft_json = ? WHERE id = ?').run(draftJson, lease_id);

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
    if (req.user.role !== 'landlord') {
      return res.status(403).json({ error: 'This feature is only available for landlord accounts.' });
    }

    const lease = db
      .prepare('SELECT landlord_draft_json FROM leases WHERE id = ? AND user_id = ?')
      .get(req.params.lease_id, req.user.id);

    if (!lease) return res.status(404).json({ error: 'Lease not found' });
    if (!lease.landlord_draft_json) return res.status(404).json({ error: 'No draft generated yet for this lease.' });

    res.json(JSON.parse(lease.landlord_draft_json));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to retrieve draft' });
  }
});

export default router;
