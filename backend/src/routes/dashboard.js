import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/leases', requireAuth, (req, res) => {
  const leases = db
    .prepare('SELECT id, filename, jurisdiction_id, status, created_at, lease_summary_json FROM leases WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id)
    .map((l) => ({ ...l, lease_summary: JSON.parse(l.lease_summary_json || '[]') }));
  res.json({ leases });
});

router.get('/leases/:id', requireAuth, (req, res) => {
  const lease = db.prepare('SELECT * FROM leases WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!lease) return res.status(404).json({ error: 'Lease not found' });

  const violations = db.prepare('SELECT * FROM violations WHERE lease_id = ?').all(req.params.id);
  res.json({
    ...lease,
    clauses: JSON.parse(lease.clauses_json || '[]'),
    lease_summary: JSON.parse(lease.lease_summary_json || '[]'),
    violations,
  });
});

router.patch('/violations/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  if (!['open', 'awaiting_response', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'status must be one of: open, awaiting_response, resolved' });
  }
  // Ensure the violation belongs to a lease owned by this user
  const violation = db
    .prepare(
      `SELECT v.* FROM violations v JOIN leases l ON v.lease_id = l.id WHERE v.id = ? AND l.user_id = ?`
    )
    .get(req.params.id, req.user.id);
  if (!violation) return res.status(404).json({ error: 'Violation not found' });

  db.prepare('UPDATE violations SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

router.get('/letters', requireAuth, (req, res) => {
  const letters = db
    .prepare('SELECT * FROM letters WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  res.json({ letters });
});

export default router;
