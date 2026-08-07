import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import db from './db.js';
import { connectMongoDB } from './mongoDb.js';

// Try connecting to MongoDB Atlas if configured
connectMongoDB();

import authRoutes from './routes/auth.js';
import analyzeRoutes from './routes/analyze.js';
import letterRoutes from './routes/letter.js';
import dashboardRoutes from './routes/dashboard.js';
import compareRoutes from './routes/compare.js';
import adminRoutes from './routes/admin.js';
import jurisdictionRoutes from './routes/jurisdictions.js';
import landlordDraftRoutes from './routes/landlordDraft.js';

// Run any pending migrations
try {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'tenant'");
} catch (_) { /* already exists */ }

try {
  db.exec("ALTER TABLE leases ADD COLUMN cloudinary_url TEXT");
} catch (_) { /* already exists */ }

try {
  db.exec("ALTER TABLE leases ADD COLUMN lease_summary_json TEXT");
} catch (_) { /* already exists */ }

try {
  db.exec("ALTER TABLE leases ADD COLUMN landlord_draft_json TEXT");
} catch (_) { /* already exists */ }

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'rentright-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/letter', letterRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/jurisdictions', jurisdictionRoutes);
app.use('/api/landlord', landlordDraftRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[Global Error]', err);
  res.status(500).json({ error: err.message || 'Unexpected server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ RentRight backend listening on http://localhost:${PORT}`);
});
