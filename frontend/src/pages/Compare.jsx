import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Compare() {
  const [leases, setLeases] = useState([]);
  const [oldId, setOldId] = useState('');
  const [newId, setNewId] = useState('');
  const [diff, setDiff] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.leases().then((d) => setLeases(d.leases)).catch(() => {});
  }, []);

  async function handleCompare(e) {
    e.preventDefault();
    setError('');
    if (!oldId || !newId || oldId === newId) return setError('Please select two different leases to compare.');
    setLoading(true);
    try {
      const result = await api.compare(
        isNaN(oldId) ? oldId : Number(oldId),
        isNaN(newId) ? newId : Number(newId)
      );
      setDiff(result);
    } catch (err) {
      setError(err.message || 'Comparison failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-brand-600 bg-brand-50 border border-brand-200 px-3 py-1 rounded-full inline-block mb-3">
          LEASE COMPARISON TOOL
        </span>
        <h1 className="font-outfit text-3xl font-extrabold text-slate-900 tracking-tight">Compare Lease Versions</h1>
        <p className="text-slate-600 text-sm mt-1">See exact additions, removals, and modifications between lease renewals.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        <form onSubmit={handleCompare} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Earlier Lease Version</label>
            <select
              value={oldId}
              onChange={(e) => setOldId(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50/50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="">Select earlier lease…</option>
              {leases.map((l) => (
                <option key={l.id} value={l.id}>{l.filename || `Lease #${l.id}`}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Newer Lease Version</label>
            <select
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50/50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="">Select newer lease…</option>
              {leases.map((l) => (
                <option key={l.id} value={l.id}>{l.filename || `Lease #${l.id}`}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl py-2.5 text-sm transition-all shadow-md shadow-brand-600/20 disabled:opacity-50"
            >
              {loading ? 'Comparing…' : 'Compare →'}
            </button>
          </div>
        </form>

        {error && <p className="text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 mt-4">{error}</p>}
      </div>

      {diff && (
        <div className="space-y-6">
          {diff.added?.length > 0 && (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-6">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-2">
                ➕ Added Clauses ({diff.added.length})
              </h3>
              <div className="space-y-2">
                {diff.added.map((c, i) => (
                  <p key={i} className="text-sm text-emerald-950 bg-white/80 border border-emerald-200 rounded-lg p-3 leading-relaxed">
                    {c.text}
                  </p>
                ))}
              </div>
            </div>
          )}

          {diff.removed?.length > 0 && (
            <div className="bg-red-50/60 border border-red-200 rounded-2xl p-6">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-red-800 mb-3 flex items-center gap-2">
                ➖ Removed Clauses ({diff.removed.length})
              </h3>
              <div className="space-y-2">
                {diff.removed.map((c, i) => (
                  <p key={i} className="text-sm text-red-950 bg-white/80 border border-red-200 rounded-lg p-3 line-through leading-relaxed opacity-80">
                    {c.text}
                  </p>
                ))}
              </div>
            </div>
          )}

          {diff.modified?.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-6">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-900 mb-3 flex items-center gap-2">
                ✏️ Modified Clauses ({diff.modified.length})
              </h3>
              <div className="space-y-3">
                {diff.modified.map((c, i) => (
                  <div key={i} className="bg-white/90 border border-amber-200 rounded-lg p-3 text-sm">
                    <p className="text-slate-400 line-through mb-1">{c.old_text}</p>
                    <p className="text-slate-900 font-medium">{c.new_text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {diff.added?.length === 0 && diff.removed?.length === 0 && diff.modified?.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
              No structural differences found between these two lease documents.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
