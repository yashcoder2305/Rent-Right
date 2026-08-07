# RentRight — Tenant Rights Assistant

Full-stack build covering the whole pipeline: upload a lease → parse it → extract
clauses (hybrid regex + LLM fallback) → match against a jurisdiction rules
database (deterministic + LLM ambiguity layer) → plain-language explanations →
flagged violations → combined dispute letter PDF → dashboard + lease comparison.

## What's using what (vs. the team's original plan)

- **Database:** SQLite (`backend/rentright.sqlite`, auto-created) standing in
  for Postgres + MongoDB, using Node's **built-in** `node:sqlite` module —
  no npm package to compile, no separate SQLite install. All DB access goes
  through `backend/src/db.js`, so swapping to real Postgres/Mongo later means
  rewriting that one file, not the routes or services. Requires Node 22.5+;
  you'll see an `ExperimentalWarning: SQLite is an experimental feature` on
  startup — that's expected and harmless.
- **LLM:** Gemini 1.5 Flash, called from `backend/src/services/gemini.js`.
  Same reasoning — one call-site, easy to add Groq/Ollama fallback later.
- **File storage:** local disk (in-memory buffer → SQLite text), no
  Cloudinary/S3 wired up yet — fine for a demo, swap in later if needed.
- **Auth:** JWT + bcrypt, matches the plan exactly.
- **Letters:** jsPDF, matches the plan.
- Not built yet: Redis/Bull async queue (analysis runs synchronously — fine
  at demo scale), OCR for scanned images, multi-language, landlord red-flag
  score (these were explicitly marked "cut if time is tight" in your sprint
  plan anyway).

## 1. Get a free Gemini API key

Go to https://aistudio.google.com/app/apikey, sign in, click "Create API key".
It's free for the usage tier this project needs. Note: `gemini-1.5-flash`
has been shut down by Google — this project now defaults to
`gemini-2.5-flash`, which is current as of writing. If you get a 404
"model not found" error, check https://ai.google.dev/gemini-api/docs/models
for the current model list and update `GEMINI_MODEL` in `.env`.

## 2. Backend setup

```bash
cd backend
cp .env.example .env
```

Open `.env` and paste your key into `GEMINI_API_KEY=`. Also change
`JWT_SECRET` to any random string.

```bash
npm install
npm run seed      # loads the Uganda jurisdiction + 8 legal rules into SQLite
npm run dev        # starts the API on http://localhost:4000
```

Check it's alive: `curl http://localhost:4000/api/health` should return `{"ok":true,...}`.

## 3. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev        # starts the UI on http://localhost:5173
```

Open http://localhost:5173 — it proxies `/api` calls to the backend
automatically (see `frontend/vite.config.js`).

## 4. Try it

1. Register an account.
2. Go to "Scan a Lease" → paste some lease text or upload a PDF, pick India
   or Uganda as the jurisdiction (India is seeded with Model Tenancy Act,
   2021 rules; Uganda with Landlord and Tenant Act, 2022 rules), hit Analyze.
3. You'll land on the Results page: a 3-point plain-English summary at the
   top, then flagged clauses ranked by severity with a confidence badge on
   each.
4. Tick a few violations → "Draft dispute letter" → fill in landlord details
   → downloads a print-ready PDF covering every violation you selected.
5. Dashboard shows your lease history; Compare lets you diff two saved
   leases against each other.

## Adding more jurisdictions / rules

Rules live in `backend/src/seed.js` for the initial seed, and can also be
added live via `POST /api/admin/rules` (requires an admin user — set
`is_admin = 1` for your user row in the SQLite DB to test this, e.g.:

```bash
sqlite3 backend/rentright.sqlite "UPDATE users SET is_admin = 1 WHERE email = 'you@example.com';"
```

## Project structure

```
backend/
  src/
    server.js            Express entry point, mounts all routes
    db.js                 SQLite schema (users, jurisdictions, rules, leases, violations, letters)
    seed.js                Seeds jurisdictions + legal rules (Module 3)
    middleware/auth.js      JWT auth + admin guard
    routes/
      auth.js               register/login
      analyze.js            Module 1+2+3+4+6 pipeline (the core endpoint)
      letter.js              Module 7 - combined dispute letter
      dashboard.js            Module 8 - lease history, violation status
      compare.js               Lease comparison / diff
      admin.js                  Rules management (no redeploy needed)
      jurisdictions.js          Public list for the upload dropdown
    services/
      pdfParser.js            Module 1 - PDF text extraction + normalisation
      clauseExtractor.js       Module 2 - hybrid regex + LLM segmentation
      rulesMatcher.js           Module 4 - deterministic + LLM rule matching, plain explainer, lease summary
      letterGenerator.js         Module 7 - LLM letter body + jsPDF render
      gemini.js                   Single Gemini API call-site

frontend/
  src/
    pages/                Login, Register, Upload, Results, Dashboard, Compare
    components/            Navbar, ViolationCard, ProtectedRoute
    api.js                   Fetch wrapper + auth token handling
```

## Known limitations to mention if asked in a viva/demo

- Deterministic numeric extraction (deposit months, notice days) is
  regex-based and simple by design — it's meant to be transparent and
  debuggable, not a full NLP entity extractor. It falls back to the LLM
  layer automatically when it can't confidently pull a number out.
- Lease comparison uses word-overlap similarity rather than a proper diff
  library — good enough to group added/removed/modified clauses, not a
  byte-level diff.
- No OCR yet (Tesseract/Google Vision) — only text-based PDFs and pasted
  text are supported right now. That's the most natural next module to add
  if you want to extend this further.
