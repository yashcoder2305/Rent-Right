import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const _require = createRequire(import.meta.url);

// ─────────────────────────────────────────────────────────────────────────────
// If MONGODB_URI is configured (production / Vercel), we skip SQLite entirely.
// MongoDB handles all user data. SQLite is only used as a local fallback.
// ─────────────────────────────────────────────────────────────────────────────

let db;

if (process.env.MONGODB_URI) {
  // MongoDB is primary — provide a no-op adapter so import doesn't crash
  console.log('ℹ️  MongoDB URI detected — SQLite not initialised.');
  db = {
    exec: () => {},
    prepare: (_sql) => ({
      run: (..._args) => ({ lastInsertRowid: 0, changes: 0 }),
      get: (..._args) => null,
      all: (..._args) => [],
    }),
  };
} else {
  // Local fallback — try to use node:sqlite (requires --experimental-sqlite flag)
  try {
    const { DatabaseSync } = _require('node:sqlite');
    const dbPath = path.join(__dirname, '..', 'rentright.sqlite');
    db = new DatabaseSync(dbPath);

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
      CREATE TABLE IF NOT EXISTS jurisdictions (id TEXT PRIMARY KEY, name TEXT NOT NULL);
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
        rule_id TEXT, clause_id TEXT, clause_text TEXT,
        classification TEXT, severity TEXT, confidence REAL,
        explanation TEXT, legal_reference TEXT,
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

    // Normalise BigInt lastInsertRowid → Number
    const origPrepare = db.prepare.bind(db);
    db.prepare = (sql) => {
      const stmt = origPrepare(sql);
      const origRun = stmt.run.bind(stmt);
      stmt.run = (...args) => {
        const r = origRun(...args);
        if (typeof r.lastInsertRowid === 'bigint') r.lastInsertRowid = Number(r.lastInsertRowid);
        return r;
      };
      return stmt;
    };

    console.log('📁 SQLite database initialised for local development.');
  } catch (e) {
    console.warn('⚠️ Could not initialise SQLite (missing --experimental-sqlite flag?). Using no-op adapter.', e.message);
    db = {
      exec: () => {},
      prepare: (_sql) => ({
        run: (..._args) => ({ lastInsertRowid: 0, changes: 0 }),
        get: (..._args) => null,
        all: (..._args) => [],
      }),
    };
  }
}

export default db;
