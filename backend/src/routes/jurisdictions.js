import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const jurisdictions = db.prepare('SELECT * FROM jurisdictions ORDER BY name').all();
  res.json({ jurisdictions });
});

export default router;
