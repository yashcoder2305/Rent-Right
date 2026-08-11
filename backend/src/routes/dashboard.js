import { Router } from 'express';
import store from '../store.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/leases', requireAuth, async (req, res) => {
  const leases = await store.getLeasesForUser(req.user.id);
  res.json({ leases });
});

router.get('/leases/:id', requireAuth, async (req, res) => {
  const lease = await store.getLeaseById(req.params.id, req.user.id);
  if (!lease) return res.status(404).json({ error: 'Lease not found' });

  const violations = await store.getViolationsForLease(req.params.id);
  res.json({
    ...lease,
    clauses: JSON.parse(lease.clauses_json || '[]'),
    lease_summary: JSON.parse(lease.lease_summary_json || '[]'),
    violations,
  });
});

router.patch('/violations/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body;
  if (!['open', 'awaiting_response', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'status must be one of: open, awaiting_response, resolved' });
  }
  const ok = await store.updateViolationStatus(req.params.id, req.user.id, status);
  if (!ok) return res.status(404).json({ error: 'Violation not found' });
  res.json({ ok: true });
});

router.get('/letters', requireAuth, async (req, res) => {
  const letters = await store.getLettersForUser(req.user.id);
  res.json({ letters });
});

export default router;
