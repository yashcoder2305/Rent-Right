import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function Dashboard() {
  const [leases, setLeases] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.leases().then((d) => setLeases(d.leases)).catch((e) => setError(e.message));
  }, []);

  const totalScans = leases?.length || 0;
  const lastScan = leases?.[0];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 font-sans">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-outfit text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Lease Analyzer Dashboard
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Overview of your active lease risk profile and recent legal intelligence scans.
          </p>
        </div>

        <Link
          to="/upload"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl px-4 py-2.5 shadow-md shadow-blue-600/30 transition-all flex items-center gap-2"
        >
          <span>📄</span> Scan & Analyze New Lease
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            📊
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL LEASES SCANNED</div>
            <div className="text-2xl font-extrabold text-slate-900 font-outfit mt-0.5">{totalScans}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            🛡️
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SYSTEM STATUS</div>
            <div className="text-sm font-extrabold text-emerald-600 font-outfit mt-1">Model Tenancy Act Active</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
            ✉️
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LEGAL DISPUTE NOTICES</div>
            <div className="text-sm font-extrabold text-slate-900 font-outfit mt-1">Generator Ready</div>
          </div>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h2 className="font-outfit text-base font-bold text-slate-900">Recent Lease Reports</h2>
          <Link to="/history" className="text-xs font-bold text-blue-600 hover:underline">View All History &rarr;</Link>
        </div>

        {error && <p className="text-xs font-medium text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">{error}</p>}
        {!leases && !error && <p className="text-slate-500 text-xs animate-pulse">Loading dashboard overview...</p>}

        {leases && leases.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-slate-500 mb-4">No lease scans found in your workspace.</p>
            <Link to="/upload" className="bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm">
              Upload First Lease
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {leases?.slice(0, 5).map((l) => (
            <div
              key={l.id}
              onClick={() => navigate(`/results/${l.id}`)}
              className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-slate-50/50 transition-all cursor-pointer flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">📄</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{l.filename || `Lease #${l.id}`}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">Jurisdiction: {l.jurisdiction_id || 'IN'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                  View Report &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
