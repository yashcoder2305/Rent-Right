import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// ─── Mongoose Schemas (inline to avoid any SQLite/pdfjs imports crashing) ───

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, default: 'tenant' },
  is_admin: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

const leaseSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  jurisdiction_id: { type: String, required: true },
  filename: String,
  cloudinary_url: String,
  raw_text: String,
  clauses: Array,
  lease_summary: Array,
  landlord_draft: Object,
  status: { type: String, default: 'analyzed' },
  created_at: { type: Date, default: Date.now },
});

const violationSchema = new mongoose.Schema({
  lease_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lease' },
  rule_id: String,
  clause_id: String,
  clause_text: String,
  classification: String,
  severity: String,
  confidence: Number,
  explanation: String,
  legal_reference: String,
  status: { type: String, default: 'open' },
});

const letterSchema = new mongoose.Schema({
  lease_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lease' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  violation_ids: [String],
  body_text: String,
  created_at: { type: Date, default: Date.now },
});

// Use existing models if already registered (important for hot reloads in serverless)
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Lease = mongoose.models.Lease || mongoose.model('Lease', leaseSchema);
const Violation = mongoose.models.Violation || mongoose.model('Violation', violationSchema);
const Letter = mongoose.models.Letter || mongoose.model('Letter', letterSchema);

// ─── MongoDB Connection ───────────────────────────────────────────────────────

let mongoConnected = false;

async function connectDB() {
  if (mongoConnected || mongoose.connection.readyState >= 1) {
    mongoConnected = true;
    return;
  }
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  mongoConnected = true;
  console.log('🍃 MongoDB Atlas connected!');
}

// ─── Express App ─────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure DB is connected on every serverless invocation
app.use(async (_req, _res, next) => {
  try { await connectDB(); } catch (e) { console.error('DB connect error:', e.message); }
  next();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function signToken(user) {
  return jwt.sign(
    { id: String(user._id), name: user.name, email: user.email, role: user.role || 'tenant', isAdmin: !!user.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── Health ──────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'rentright-backend' }));

// ─── Auth Routes ─────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, and password are required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const existing = await User.findOne({ email }).lean();
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });
    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password_hash, role: 'tenant' });
    const token = signToken(user);
    res.json({ token, user: { id: String(user._id), name, email, role: 'tenant' } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    const token = signToken(user);
    res.json({ token, user: { id: String(user._id), name: user.name, email: user.email, role: user.role || 'tenant' } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// ─── Dashboard Routes ─────────────────────────────────────────────────────────

app.get('/api/dashboard/leases', requireAuth, async (req, res) => {
  try {
    const leases = await Lease.find({ user_id: req.user.id }).sort({ created_at: -1 }).lean();
    res.json({ leases: leases.map(l => ({ id: String(l._id), filename: l.filename, jurisdiction_id: l.jurisdiction_id, status: l.status, created_at: l.created_at, lease_summary: l.lease_summary || [] })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/dashboard/leases/:id', requireAuth, async (req, res) => {
  try {
    const lease = await Lease.findOne({ _id: req.params.id, user_id: req.user.id }).lean();
    if (!lease) return res.status(404).json({ error: 'Lease not found' });
    const violations = await Violation.find({ lease_id: req.params.id }).lean();
    res.json({ ...lease, id: String(lease._id), clauses: lease.clauses || [], lease_summary: lease.lease_summary || [], violations: violations.map(v => ({ ...v, id: String(v._id) })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/dashboard/violations/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'awaiting_response', 'resolved'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const viol = await Violation.findById(req.params.id).lean();
    if (!viol) return res.status(404).json({ error: 'Violation not found' });
    const lease = await Lease.findOne({ _id: viol.lease_id, user_id: req.user.id }).lean();
    if (!lease) return res.status(404).json({ error: 'Violation not found' });
    await Violation.findByIdAndUpdate(req.params.id, { status });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/dashboard/letters', requireAuth, async (req, res) => {
  try {
    const letters = await Letter.find({ user_id: req.user.id }).sort({ created_at: -1 }).lean();
    res.json({ letters: letters.map(l => ({ ...l, id: String(l._id) })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Analyze Route (lazy-load heavy modules) ──────────────────────────────────

app.post('/api/analyze', requireAuth, async (req, res) => {
  try {
    const multer = (await import('multer')).default;
    const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

    upload.single('file')(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      try {
        const { extractClauses } = await import('../backend/src/services/clauseExtractor.js');
        const { matchRules, explainClausesPlainly, summarizeLease } = await import('../backend/src/services/rulesMatcher.js');

        const jurisdictionId = req.body.jurisdiction_id || 'IN';
        let text;
        let filename = null;
        let cloudinaryUrl = null;

        if (req.file) {
          filename = req.file.originalname;
          const mime = req.file.mimetype;
          if (mime === 'application/pdf') {
            const { parseLeasePdf } = await import('../backend/src/services/pdfParser.js');
            const parsed = await parseLeasePdf(req.file.buffer);
            text = parsed.text;
          } else if (mime.includes('wordprocessingml') || mime.includes('msword')) {
            const { parseLeaseDocx } = await import('../backend/src/services/docxParser.js');
            text = await parseLeaseDocx(req.file.buffer);
          }
        } else if (req.body.text) {
          text = req.body.text.trim();
        } else {
          return res.status(400).json({ error: 'Provide a file or pasted text.' });
        }

        if (!text || text.length < 30) return res.status(422).json({ error: 'Could not extract usable text.' });

        const { clauses, method } = await extractClauses(text);
        if (!clauses.length) return res.status(422).json({ error: 'No clauses identified.' });

        const [violations, plainExplanations] = await Promise.all([matchRules(clauses, jurisdictionId), explainClausesPlainly(clauses)]);
        const leaseSummary = await summarizeLease(clauses, violations);

        const explMap = Object.fromEntries(plainExplanations.map(e => [e.clause_id, e.plain_explanation]));
        const clausesWithPlain = clauses.map(c => ({ ...c, plain_explanation: explMap[c.clause_id] || null }));

        const lease = await Lease.create({ user_id: req.user.id, jurisdiction_id: jurisdictionId, filename, cloudinary_url: cloudinaryUrl, raw_text: text, clauses: clausesWithPlain, lease_summary: leaseSummary });
        const leaseId = String(lease._id);

        const savedViolations = await Violation.insertMany(violations.map(v => ({ lease_id: leaseId, ...v })));

        res.json({ lease_id: leaseId, extraction_method: method, clause_count: clauses.length, clauses: clausesWithPlain, lease_summary: leaseSummary, violations: savedViolations.map(v => ({ ...v.toObject(), id: String(v._id) })), cloudinary_url: cloudinaryUrl });
      } catch (e) { console.error(e); res.status(500).json({ error: e.message || 'Analysis failed' }); }
    });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ─── Letter Route (lazy-load) ─────────────────────────────────────────────────

app.post('/api/letter', requireAuth, async (req, res) => {
  try {
    const { lease_id, violation_ids, tenant_address, landlord_name, landlord_address } = req.body;
    if (!lease_id || !Array.isArray(violation_ids) || !violation_ids.length) return res.status(400).json({ error: 'lease_id and violation_ids required' });
    const lease = await Lease.findOne({ _id: lease_id, user_id: req.user.id }).lean();
    if (!lease) return res.status(404).json({ error: 'Lease not found' });
    const violations = await Violation.find({ lease_id, _id: { $in: violation_ids } }).lean();
    if (!violations.length) return res.status(404).json({ error: 'No matching violations' });
    const { generateDisputeLetter } = await import('../backend/src/services/letterGenerator.js');
    const { pdfBuffer, bodyText } = await generateDisputeLetter({ tenantName: req.user.name, tenantAddress: tenant_address, landlordName: landlord_name, landlordAddress: landlord_address, violations });
    await Letter.create({ lease_id, user_id: req.user.id, violation_ids, body_text: bodyText });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="dispute-letter-${lease_id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ─── Landlord Draft Route (lazy-load) ────────────────────────────────────────

app.post('/api/landlord/draft', requireAuth, async (req, res) => {
  try {
    const { lease_id } = req.body;
    if (!lease_id) return res.status(400).json({ error: 'lease_id is required' });
    const lease = await Lease.findOne({ _id: lease_id, user_id: req.user.id }).lean();
    if (!lease) return res.status(404).json({ error: 'Lease not found' });
    const clauses = lease.clauses || [];
    const violations = await Violation.find({ lease_id }).lean();
    if (!clauses.length) return res.status(422).json({ error: 'No clauses found. Re-analyze first.' });
    const { generateCompliantDraft } = await import('../backend/src/services/landlordDraftGenerator.js');
    const { sections, summary, changes_count, pdfBuffer } = await generateCompliantDraft(clauses, violations, lease.jurisdiction_id);
    await Lease.findByIdAndUpdate(lease_id, { landlord_draft: { summary, changes_count, sections } });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="compliant-draft-${lease_id}.pdf"`);
    res.setHeader('X-Draft-Summary', encodeURIComponent(summary));
    res.setHeader('X-Changes-Count', String(changes_count));
    res.send(pdfBuffer);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

app.get('/api/landlord/draft/:lease_id', requireAuth, async (req, res) => {
  try {
    const lease = await Lease.findOne({ _id: req.params.lease_id, user_id: req.user.id }, 'landlord_draft').lean();
    if (!lease) return res.status(404).json({ error: 'Lease not found' });
    if (!lease.landlord_draft) return res.status(404).json({ error: 'No draft generated yet.' });
    res.json(lease.landlord_draft);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Compare Route ────────────────────────────────────────────────────────────

app.post('/api/compare', requireAuth, async (req, res) => {
  try {
    const { lease_id_old, lease_id_new } = req.body;
    if (!lease_id_old || !lease_id_new) return res.status(400).json({ error: 'lease_id_old and lease_id_new are required' });
    const [oldLease, newLease] = await Promise.all([
      Lease.findOne({ _id: lease_id_old, user_id: req.user.id }).lean(),
      Lease.findOne({ _id: lease_id_new, user_id: req.user.id }).lean(),
    ]);
    if (!oldLease || !newLease) return res.status(404).json({ error: 'One or both leases not found' });
    res.json({ old_lease_id: lease_id_old, new_lease_id: lease_id_new, added: [], removed: [], modified: [], unchanged: [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Jurisdictions Route ──────────────────────────────────────────────────────

app.get('/api/jurisdictions', async (_req, res) => {
  res.json({ jurisdictions: [
    { id: 'IN', name: 'India (General)' },
    { id: 'IN-MH', name: 'Maharashtra' },
    { id: 'IN-DL', name: 'Delhi' },
    { id: 'IN-KA', name: 'Karnataka' },
    { id: 'IN-TN', name: 'Tamil Nadu' },
    { id: 'IN-GJ', name: 'Gujarat' },
    { id: 'IN-WB', name: 'West Bengal' },
    { id: 'IN-RJ', name: 'Rajasthan' },
    { id: 'IN-UP', name: 'Uttar Pradesh' },
  ]});
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error('[Global Error]', err);
  res.status(500).json({ error: err.message || 'Unexpected server error' });
});

export default app;
