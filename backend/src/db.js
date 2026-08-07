import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(__dirname, '..', 'rentright.sqlite'));

// --- Schema ---
// NOTE: In the team's original plan, "legal rules" live in PostgreSQL and
// "user data" (leases, disputes) live in MongoDB. This single SQLite file
// mirrors both as separate logical tables so the code can be swapped to
// real Postgres/Mongo later without changing the service layer much —
// see services/* which only talk to db.js, never raw SQL elsewhere.
//
// Uses Node's built-in `node:sqlite` module (stable in modern Node) —
// no native compilation, no separate SQLite install required.

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'tenant',      -- 'tenant' | 'landlord'
  is_admin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jurisdictions (
  id TEXT PRIMARY KEY,       -- e.g. 'UG', 'IN-KA'
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,               -- e.g. 'deposit_001'
  jurisdiction_id TEXT NOT NULL,
  clause_type TEXT NOT NULL,         -- e.g. 'deposit', 'entry_rights'
  description TEXT NOT NULL,
  what_it_prohibits TEXT NOT NULL,
  severity TEXT NOT NULL,            -- critical | moderate | minor
  legal_reference TEXT NOT NULL,
  check_type TEXT NOT NULL,          -- 'deterministic' | 'llm'
  check_config TEXT,                 -- JSON string, deterministic rule params
  last_verified TEXT,
  source_url TEXT,
  FOREIGN KEY (jurisdiction_id) REFERENCES jurisdictions(id)
);

CREATE TABLE IF NOT EXISTS leases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  jurisdiction_id TEXT NOT NULL,
  filename TEXT,
  cloudinary_url TEXT,        -- public URL of original file stored in Cloudinary
  raw_text TEXT,
  clauses_json TEXT,          -- structured clause array, JSON
  lease_summary_json TEXT,    -- 3-item plain-english summary, JSON
  landlord_draft_json TEXT,   -- AI-generated compliant draft, JSON (landlord mode)
  status TEXT DEFAULT 'analyzed', -- analyzed | dispute_open | resolved
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS violations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lease_id INTEGER NOT NULL,
  rule_id TEXT,
  clause_id TEXT,
  clause_text TEXT,
  classification TEXT,     -- clear_violation | potential_violation | compliant
  severity TEXT,
  confidence REAL,
  explanation TEXT,
  legal_reference TEXT,
  status TEXT DEFAULT 'open', -- open | awaiting_response | resolved
  FOREIGN KEY (lease_id) REFERENCES leases(id)
);

CREATE TABLE IF NOT EXISTS letters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lease_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  violation_ids TEXT,     -- JSON array of violation ids covered
  body_text TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (lease_id) REFERENCES leases(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`);

// node:sqlite's StatementSync.run() can return lastInsertRowid as a BigInt.
// Wrap .prepare() so every statement's .run() normalises it to a plain
// Number — keeps every route that does JSON.stringify(...) or arithmetic
// on an id working exactly as it did with better-sqlite3.
const originalPrepare = db.prepare.bind(db);
db.prepare = (sql) => {
  const stmt = originalPrepare(sql);
  const originalRun = stmt.run.bind(stmt);
  stmt.run = (...args) => {
    const result = originalRun(...args);
    if (typeof result.lastInsertRowid === 'bigint') {
      result.lastInsertRowid = Number(result.lastInsertRowid);
    }
    return result;
  };
  return stmt;
};

export default db;
