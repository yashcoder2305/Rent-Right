import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db;

try {
  // Use dynamic require/import for node:sqlite to prevent crash on environments without node:sqlite support (like older Vercel Node runtimes)
  const { DatabaseSync } = await import('node:sqlite');
  
  const dbPath = process.env.VERCEL
    ? path.join('/tmp', 'rentright.sqlite')
    : path.join(__dirname, '..', 'rentright.sqlite');

  db = new DatabaseSync(dbPath);

  // --- Schema ---
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'tenant',
    is_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS jurisdictions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rules (
    id TEXT PRIMARY KEY,
    jurisdiction_id TEXT NOT NULL,
    clause_type TEXT NOT NULL,
    description TEXT NOT NULL,
    what_it_prohibits TEXT NOT NULL,
    severity TEXT NOT NULL,
    legal_reference TEXT NOT NULL,
    check_type TEXT NOT NULL,
    check_config TEXT,
    last_verified TEXT,
    source_url TEXT,
    FOREIGN KEY (jurisdiction_id) REFERENCES jurisdictions(id)
  );

  CREATE TABLE IF NOT EXISTS leases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    jurisdiction_id TEXT NOT NULL,
    filename TEXT,
    cloudinary_url TEXT,
    raw_text TEXT,
    clauses_json TEXT,
    lease_summary_json TEXT,
    landlord_draft_json TEXT,
    status TEXT DEFAULT 'analyzed',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lease_id INTEGER NOT NULL,
    rule_id TEXT,
    clause_id TEXT,
    clause_text TEXT,
    classification TEXT,
    severity TEXT,
    confidence REAL,
    explanation TEXT,
    legal_reference TEXT,
    status TEXT DEFAULT 'open',
    FOREIGN KEY (lease_id) REFERENCES leases(id)
  );

  CREATE TABLE IF NOT EXISTS letters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lease_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    violation_ids TEXT,
    body_text TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (lease_id) REFERENCES leases(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  `);

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
} catch (e) {
  console.warn('⚠️ SQLite DatabaseSync is not supported in this environment. Falling back to mock wrapper.', e.message);
  
  // Safe mock wrapper for runtime compatibility
  db = {
    exec: () => {},
    prepare: () => ({
      run: () => ({ lastInsertRowid: 1 }),
      get: () => null,
      all: () => []
    })
  };
}

export default db;
