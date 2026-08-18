import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function History() {
  const [leases, setLeases] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    api.leases().then((d) => setLeases(d.leases)).catch((e) => setError(e.message));
  }, []);

  const filteredLeases = leases?.filter(l => {
    const matchesSearch = (l.filename || `Lease #${l.id}`).toLowerCase().includes(search.toLowerCase());
    if (filter === 'all') return matchesSearch;
    if (filter === 'issues') return matchesSearch && (l.status === 'flagged' || l.status === 'analyzed');
    return matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 font-sans">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-outfit text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Audit Trail & History
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Complete record of all lease documents uploaded, analyzed, and generated legal notices.
          </p>
        </div>

        <Link
          to="/upload"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl px-4 py-2.5 shadow-md shadow-blue-600/30 transition-all flex items-center gap-2"
        >
          <span>📄</span> Scan New Lease
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by file name or property..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg border transition-all ${filter === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            All Logs ({leases?.length || 0})
          </button>
        </div>
      </div>

      {error && <p className="text-xs font-medium text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">{error}</p>}
      {!leases && !error && <p className="text-slate-500 text-xs animate-pulse">Loading history logs...</p>}

      {leases && leases.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-3 text-xl">
            📜
          </div>
          <h3 className="font-outfit text-base font-bold text-slate-900 mb-1">No scan history recorded</h3>
          <p className="text-slate-500 text-xs mb-6 max-w-sm mx-auto">Upload your first lease document to start building your legal audit log.</p>
          <Link
            to="/upload"
            className="inline-block bg-blue-600 text-white font-bold text-xs rounded-xl px-5 py-2.5 shadow-md shadow-blue-600/30"
          >
            Scan a Lease Now &rarr;
          </Link>
        </div>
      )}

      {/* History Timeline Cards */}
      <div className="space-y-4">
        {filteredLeases?.map((l) => (
          <div
            key={l.id}
            className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4 transition-all hover:border-blue-300"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-lg shrink-0 mt-0.5">
                📄
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-outfit font-bold text-slate-900 text-base">
                    {l.filename || `Lease Document #${l.id}`}
                  </h3>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {l.jurisdiction_id || 'IN'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-400 font-semibold mt-1">
                  <span>📅 Uploaded {new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span>•</span>
                  <span>ID: #{l.id}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/results/${l.id}`)}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all"
              >
                View Report &rarr;
              </button>
              <button
                onClick={() => navigate(`/letter?lease_id=${l.id}`)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all"
              >
                Generate Letter
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
