import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Simple similarity check to decide if two clauses are "the same clause, modified"
// vs entirely different clauses. Uses normalized-text overlap rather than a
// heavy diff library, which is enough to group modified vs added/removed.
function similarity(a, b) {
  const wa = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const wb = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  if (wa.size === 0 || wb.size === 0) return 0;
  let overlap = 0;
  for (const w of wa) if (wb.has(w)) overlap += 1;
  return overlap / Math.max(wa.size, wb.size);
}

router.post('/', requireAuth, (req, res) => {
  const { lease_id_old, lease_id_new } = req.body;
  if (!lease_id_old || !lease_id_new) {
    return res.status(400).json({ error: 'lease_id_old and lease_id_new are required' });
  }

  const oldLease = db.prepare('SELECT * FROM leases WHERE id = ? AND user_id = ?').get(lease_id_old, req.user.id);
  const newLease = db.prepare('SELECT * FROM leases WHERE id = ? AND user_id = ?').get(lease_id_new, req.user.id);
  if (!oldLease || !newLease) return res.status(404).json({ error: 'One or both leases not found' });

  const oldClauses = JSON.parse(oldLease.clauses_json || '[]');
  const newClauses = JSON.parse(newLease.clauses_json || '[]');

  const matchedOld = new Set();
  const matchedNew = new Set();
  const modified = [];

  // Greedy best-match pairing above a similarity threshold = "modified"
  for (let i = 0; i < oldClauses.length; i++) {
    let bestJ = -1;
    let bestScore = 0;
    for (let j = 0; j < newClauses.length; j++) {
      if (matchedNew.has(j)) continue;
      const score = similarity(oldClauses[i].text, newClauses[j].text);
      if (score > bestScore) {
        bestScore = score;
        bestJ = j;
      }
    }
    if (bestJ !== -1 && bestScore >= 0.98) {
      // effectively identical — unchanged, handled below
      matchedOld.add(i);
      matchedNew.add(bestJ);
    } else if (bestJ !== -1 && bestScore >= 0.35) {
      matchedOld.add(i);
      matchedNew.add(bestJ);
      modified.push({
        clause_type: oldClauses[i].clause_type,
        old_text: oldClauses[i].text,
        new_text: newClauses[bestJ].text,
      });
    }
  }

  const unchanged = oldClauses.filter((_, i) => matchedOld.has(i) && !modified.find((m) => m.old_text === oldClauses[i].text));
  const removed = oldClauses.filter((_, i) => !matchedOld.has(i));
  const added = newClauses.filter((_, j) => !matchedNew.has(j));

  res.json({
    old_lease_id: lease_id_old,
    new_lease_id: lease_id_new,
    added: added.map((c) => ({ clause_type: c.clause_type, text: c.text })),
    removed: removed.map((c) => ({ clause_type: c.clause_type, text: c.text })),
    modified,
    unchanged: unchanged.map((c) => ({ clause_type: c.clause_type, text: c.text })),
  });
});

export default router;
