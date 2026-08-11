import mongoose from 'mongoose';

// MongoDB Atlas Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, default: 'tenant' },
  is_admin: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
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
  created_at: { type: Date, default: Date.now }
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
  status: { type: String, default: 'open' }
});

export const UserMongo = mongoose.model('User', userSchema);
export const LeaseMongo = mongoose.model('Lease', leaseSchema);
export const ViolationMongo = mongoose.model('Violation', violationSchema);

export async function connectMongoDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('ℹ️ MONGODB_URI not provided — using embedded SQLite database.');
    return false;
  }
  if (mongoose.connection.readyState >= 1) {
    return true;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log('🍃 Successfully connected to MongoDB Atlas!');
    return true;
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB Atlas:', err.message);
    console.log('ℹ️ Falling back to embedded SQLite database.');
    return false;
  }
}
