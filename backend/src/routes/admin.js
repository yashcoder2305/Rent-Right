import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/rules', requireAuth, requireAdmin, (req, res) => {
  const rules = db.prepare('SELECT * FROM rules').all();
  res.json({ rules });
});

/** Add or update a rule. No redeploy needed — it's a straight upsert. */
router.post('/rules', requireAuth, requireAdmin, (req, res) => {
  const {
    id, jurisdiction_id, clause_type, description, what_it_prohibits,
    severity, legal_reference, check_type, check_config, source_url,
  } = req.body;

  if (!id || !jurisdiction_id || !clause_type || !description || !severity || !legal_reference || !check_type) {
    return res.status(400).json({ error: 'Missing required rule fields' });
  }

  const lastVerified = new Date().toISOString().slice(0, 10);
  const checkConfigStr = check_config ? JSON.stringify(check_config) : null;

  db.prepare(
    `INSERT INTO rules (id, jurisdiction_id, clause_type, description, what_it_prohibits, severity, legal_reference, check_type, check_config, last_verified, source_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       jurisdiction_id=excluded.jurisdiction_id, clause_type=excluded.clause_type, description=excluded.description,
       what_it_prohibits=excluded.what_it_prohibits, severity=excluded.severity, legal_reference=excluded.legal_reference,
       check_type=excluded.check_type, check_config=excluded.check_config, last_verified=excluded.last_verified, source_url=excluded.source_url`
  ).run(
    id, jurisdiction_id, clause_type, description, what_it_prohibits || '',
    severity, legal_reference, check_type, checkConfigStr, lastVerified, source_url || null
  );

  res.json({ ok: true });
});

router.post('/jurisdictions', requireAuth, requireAdmin, (req, res) => {
  const { id, name } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'id and name are required' });
  db.prepare('INSERT OR REPLACE INTO jurisdictions (id, name) VALUES (?, ?)').run(id, name);
  res.json({ ok: true });
});

export default router;
