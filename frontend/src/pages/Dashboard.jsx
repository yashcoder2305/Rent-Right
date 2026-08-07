import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Dashboard() {
  const [leases, setLeases] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.leases().then((d) => setLeases(d.leases)).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-outfit text-3xl font-bold text-slate-900">Your Scanned Leases</h1>
          <p className="text-slate-500 text-sm mt-1">Review previous lease analysis reports and legal findings.</p>
        </div>

        <Link
          to="/upload"
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl px-5 py-2.5 transition-all shadow-md shadow-brand-600/20 flex items-center gap-2"
        >
          <span>📄</span> Scan New Lease
        </Link>
      </div>

      {error && <p className="text-sm font-medium text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">{error}</p>}
      {!leases && !error && <p className="text-slate-500 text-sm animate-pulse">Loading lease history…</p>}
      {leases && leases.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mx-auto mb-3 text-xl">
            📑
          </div>
          <h3 className="font-outfit text-lg font-bold text-slate-900 mb-1">No leases scanned yet</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Upload a lease PDF or paste text to get instant AI analysis of legal rights and violations.</p>
          <Link
            to="/upload"
            className="inline-block bg-brand-600 text-white font-semibold text-sm rounded-xl px-6 py-3 transition-all shadow-sm"
          >
            Scan a Lease Now →
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {leases?.map((l) => (
          <Link
            key={l.id}
            to={`/results/${l.id}`}
            className="block bg-white border border-slate-200/90 hover:border-brand-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-outfit font-bold text-slate-900 text-lg group-hover:text-brand-600 transition-colors">
                    {l.filename || `Lease Document #${l.id}`}
                  </span>
                  <span className="text-[11px] font-mono font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                    {l.jurisdiction_id}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  Scanned on {new Date(l.created_at).toLocaleDateString()}
                </p>
              </div>

              <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                {l.status?.replace('_', ' ') || 'Analyzed'}
              </span>
            </div>

            {l.lease_summary?.[0] && (
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 italic">
                &ldquo;{l.lease_summary[0]}&rdquo;
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
