/**
 * store.js — Unified data adapter
 *
 * Transparently uses MongoDB Atlas when connected, or falls back to SQLite.
 * All routes import from here — no raw db/mongoose calls in route files.
 *
 * Usage:
 *   import store from '../store.js';
 *   const user = await store.getUserByEmail(email);
 */

import db from './db.js';
import { UserMongo, LeaseMongo, ViolationMongo } from './mongoDb.js';
import mongoose from 'mongoose';

// Helpers -----------------------------------------------------------------

/** True when Mongoose has an open connection */
function useMongo() {
  return mongoose.connection.readyState === 1;
}

/** Convert a Mongoose document to a plain object with `id` as a string */
function toPlain(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject({ virtuals: false }) : { ...doc };
  obj.id = String(obj._id || obj.id);
  delete obj._id;
  delete obj.__v;
  return obj;
}

/** Convert all docs in an array */
function toPlainArray(docs) {
  return (docs || []).map(toPlain);
}

// =========================================================================
// AUTH
// =========================================================================

export async function getUserByEmail(email) {
  if (useMongo()) {
    const doc = await UserMongo.findOne({ email }).lean();
    if (!doc) return null;
    return { ...doc, id: String(doc._id), password_hash: doc.password_hash };
  }
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) || null;
}

export async function getUserById(id) {
  if (useMongo()) {
    try {
      const doc = await UserMongo.findById(id).lean();
      if (!doc) return null;
      return { ...doc, id: String(doc._id) };
    } catch {
      return null;
    }
  }
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
}

export async function createUser({ name, email, password_hash, role }) {
  if (useMongo()) {
    const doc = await UserMongo.create({ name, email, password_hash, role });
    return { id: String(doc._id), name: doc.name, email: doc.email, role: doc.role };
  }
  const info = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name, email, password_hash, role);
  return { id: info.lastInsertRowid, name, email, role };
}

// =========================================================================
// LEASES
// =========================================================================

export async function createLease({ user_id, jurisdiction_id, filename, cloudinary_url, raw_text, clauses, lease_summary }) {
  if (useMongo()) {
    const doc = await LeaseMongo.create({
      user_id,
      jurisdiction_id,
      filename,
      cloudinary_url,
      raw_text,
      clauses,
      lease_summary,
    });
    return { id: String(doc._id), ...doc.toObject() };
  }
  const info = db
    .prepare(
      `INSERT INTO leases (user_id, jurisdiction_id, filename, cloudinary_url, raw_text, clauses_json, lease_summary_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(user_id, jurisdiction_id, filename, cloudinary_url, raw_text, JSON.stringify(clauses), JSON.stringify(lease_summary));
  return { id: info.lastInsertRowid };
}

export async function getLeaseById(id, user_id) {
  if (useMongo()) {
    try {
      const query = { _id: id };
      if (user_id) query.user_id = user_id;
      const doc = await LeaseMongo.findOne(query).lean();
      if (!doc) return null;
      return {
        ...doc,
        id: String(doc._id),
        clauses_json: JSON.stringify(doc.clauses || []),
        lease_summary_json: JSON.stringify(doc.lease_summary || []),
        landlord_draft_json: doc.landlord_draft ? JSON.stringify(doc.landlord_draft) : null,
      };
    } catch {
      return null;
    }
  }
  if (user_id !== undefined) {
    return db.prepare('SELECT * FROM leases WHERE id = ? AND user_id = ?').get(id, user_id) || null;
  }
  return db.prepare('SELECT * FROM leases WHERE id = ?').get(id) || null;
}

export async function getLeasesForUser(user_id) {
  if (useMongo()) {
    const docs = await LeaseMongo.find({ user_id }).sort({ created_at: -1 }).lean();
    return docs.map((doc) => ({
      id: String(doc._id),
      filename: doc.filename,
      jurisdiction_id: doc.jurisdiction_id,
      status: doc.status,
      created_at: doc.created_at,
      lease_summary: doc.lease_summary || [],
    }));
  }
  return db
    .prepare('SELECT id, filename, jurisdiction_id, status, created_at, lease_summary_json FROM leases WHERE user_id = ? ORDER BY created_at DESC')
    .all(user_id)
    .map((l) => ({ ...l, lease_summary: JSON.parse(l.lease_summary_json || '[]') }));
}

export async function saveLandlordDraft(lease_id, draftData) {
  if (useMongo()) {
    try {
      await LeaseMongo.findByIdAndUpdate(lease_id, { landlord_draft: draftData });
      return true;
    } catch {
      return false;
    }
  }
  db.prepare('UPDATE leases SET landlord_draft_json = ? WHERE id = ?').run(JSON.stringify(draftData), lease_id);
  return true;
}

export async function getLandlordDraft(lease_id, user_id) {
  if (useMongo()) {
    try {
      const query = { _id: lease_id };
      if (user_id) query.user_id = user_id;
      const doc = await LeaseMongo.findOne(query, 'landlord_draft').lean();
      if (!doc) return null;
      return doc.landlord_draft || null;
    } catch {
      return null;
    }
  }
  const row = user_id
    ? db.prepare('SELECT landlord_draft_json FROM leases WHERE id = ? AND user_id = ?').get(lease_id, user_id)
    : db.prepare('SELECT landlord_draft_json FROM leases WHERE id = ?').get(lease_id);
  if (!row) return null;
  return row.landlord_draft_json ? JSON.parse(row.landlord_draft_json) : null;
}

// =========================================================================
// VIOLATIONS
// =========================================================================

export async function createViolations(lease_id, violations) {
  if (useMongo()) {
    const docs = await ViolationMongo.insertMany(
      violations.map((v) => ({ lease_id, ...v }))
    );
    return docs.map((d) => ({ id: String(d._id), ...d.toObject() }));
  }
  const stmt = db.prepare(
    `INSERT INTO violations (lease_id, rule_id, clause_id, clause_text, classification, severity, confidence, explanation, legal_reference)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  return violations.map((v) => {
    const info = stmt.run(lease_id, v.rule_id, v.clause_id, v.clause_text, v.classification, v.severity, v.confidence, v.explanation, v.legal_reference);
    return { id: info.lastInsertRowid, ...v };
  });
}

export async function getViolationsForLease(lease_id) {
  if (useMongo()) {
    const docs = await ViolationMongo.find({ lease_id }).lean();
    return docs.map((d) => ({ ...d, id: String(d._id) }));
  }
  return db.prepare('SELECT * FROM violations WHERE lease_id = ?').all(lease_id);
}

export async function getViolationsByIds(lease_id, ids) {
  if (useMongo()) {
    const docs = await ViolationMongo.find({ lease_id, _id: { $in: ids } }).lean();
    return docs.map((d) => ({ ...d, id: String(d._id) }));
  }
  const placeholders = ids.map(() => '?').join(',');
  return db.prepare(`SELECT * FROM violations WHERE lease_id = ? AND id IN (${placeholders})`).all(lease_id, ...ids);
}

export async function updateViolationStatus(violation_id, user_id, status) {
  if (useMongo()) {
    // Verify ownership via lease
    const viol = await ViolationMongo.findById(violation_id).lean();
    if (!viol) return false;
    const lease = await LeaseMongo.findOne({ _id: viol.lease_id, user_id }).lean();
    if (!lease) return false;
    await ViolationMongo.findByIdAndUpdate(violation_id, { status });
    return true;
  }
  const violation = db
    .prepare(`SELECT v.* FROM violations v JOIN leases l ON v.lease_id = l.id WHERE v.id = ? AND l.user_id = ?`)
    .get(violation_id, user_id);
  if (!violation) return false;
  db.prepare('UPDATE violations SET status = ? WHERE id = ?').run(status, violation_id);
  return true;
}

// =========================================================================
// LETTERS (SQLite-only, stored as text)
// =========================================================================

export async function createLetter({ lease_id, user_id, violation_ids, body_text }) {
  // Letters are always stored in SQLite (small audit trail data)
  db.prepare('INSERT INTO letters (lease_id, user_id, violation_ids, body_text) VALUES (?, ?, ?, ?)')
    .run(lease_id, user_id, JSON.stringify(violation_ids), body_text);
}

export async function getLettersForUser(user_id) {
  return db.prepare('SELECT * FROM letters WHERE user_id = ? ORDER BY created_at DESC').all(user_id);
}

// =========================================================================
// Default export (for convenience)
// =========================================================================
export default {
  getUserByEmail,
  getUserById,
  createUser,
  createLease,
  getLeaseById,
  getLeasesForUser,
  saveLandlordDraft,
  getLandlordDraft,
  createViolations,
  getViolationsForLease,
  getViolationsByIds,
  updateViolationStatus,
  createLetter,
  getLettersForUser,
};
