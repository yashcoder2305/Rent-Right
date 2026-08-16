import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import LandlordResults from './LandlordResults.jsx';

function SeverityBadge({ severity }) {
  const cfg = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    moderate: 'bg-amber-100 text-amber-700 border-amber-200',
    minor: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    suspicious: 'bg-purple-100 text-purple-700 border-purple-200',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg[severity] || cfg.minor}`}>
      {severity}
    </span>
  );
}

export default function Results() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [showLetterForm, setShowLetterForm] = useState(false);
  const [activeTab, setActiveTab] = useState('issues'); // 'issues' | 'clauses'
  const [expandedSection, setExpandedSection] = useState(null);
  const [landlordName, setLandlordName] = useState('');
  const [landlordAddress, setLandlordAddress] = useState('');
  const [tenantAddress, setTenantAddress] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem('rentright_last_result');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (String(parsed.lease_id) === id) {
        setData(parsed);
        // Pre-select critical & moderate violations
        const ids = (parsed.violations || []).map((v) => v.id);
        setSelected(new Set(ids));
        return;
      }
    }
    api.lease(id).then((res) => {
      setData(res);
      const ids = (res.violations || []).map((v) => v.id);
      setSelected(new Set(ids));
    }).catch((e) => setError(e.message));
  }, [id]);

  function toggleSelect(violationId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(violationId)) next.delete(violationId);
      else next.add(violationId);
      return next;
    });
  }

  async function handleGenerateLetter(e) {
    e.preventDefault();
    setGenerating(true);
    setError('');
    try {
      const blob = await api.generateLetter({
        lease_id: isNaN(id) ? id : Number(id),
        violation_ids: Array.from(selected),
        landlord_name: landlordName,
        landlord_address: landlordAddress,
        tenant_address: tenantAddress,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dispute-letter-lease-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setShowLetterForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  const mode = searchParams.get('mode') || 'tenant';

  if (error) return <div className="max-w-4xl mx-auto px-6 py-12 text-red-600 font-medium">{error}</div>;
  if (!data) return <div className="max-w-4xl mx-auto px-6 py-12 text-slate-500 font-medium animate-pulse">Analyzing lease structure…</div>;

  if (mode === 'landlord') {
    return <LandlordResults result={data} onToggleView={() => setSearchParams({ mode: 'tenant' })} />;
  }

  const violations = data.violations || [];
  const clauses = data.clauses || [];
  const criticalCount = violations.filter((v) => v.severity === 'critical').length;
  const moderateCount = violations.filter((v) => v.severity === 'moderate').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header matching Landlord layout */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-brand-700 bg-brand-50 border border-brand-200 px-3 py-1 rounded-full">
              🔍 TENANT LEASE REVIEW
            </span>
          </div>
          <h1 className="font-outfit text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
            Lease Analysis Complete
          </h1>
          <p className="text-slate-500 text-sm">
            {violations.length === 0
              ? 'Great news — no rights violations were found in this lease.'
              : `Found ${violations.length} issue${violations.length !== 1 ? 's' : ''} flagging potential legal rights concerns.`}
          </p>
        </div>

        <button
          onClick={() => setSearchParams({ mode: 'landlord' })}
          className="text-xs font-semibold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-3.5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 mt-2"
        >
          🏠 Switch to Landlord View
        </button>
      </div>

      {/* Score Cards matching Landlord layout */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total Clauses', value: clauses.length, color: 'slate' },
          { label: 'Issues Found', value: violations.length, color: violations.length > 0 ? 'red' : 'green' },
          { label: 'Critical Issues', value: criticalCount, color: criticalCount > 0 ? 'red' : 'slate' },
          { label: 'Moderate Issues', value: moderateCount, color: moderateCount > 0 ? 'amber' : 'slate' },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
            <div className={`text-2xl font-extrabold text-${card.color}-600`}>{card.value}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Dispute Letter CTA matching Landlord banner */}
      {violations.length > 0 && (
        <div className="bg-gradient-to-r from-brand-600 to-blue-700 rounded-2xl p-6 mb-8 text-white shadow-xl shadow-brand-600/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-outfit text-lg font-bold mb-1">Draft a Formal Legal Notice</h3>
              <p className="text-blue-100 text-sm">
                Select flagged clauses below and generate a professional, statutory-backed dispute letter to your landlord.
              </p>
            </div>
            <button
              onClick={() => setShowLetterForm(true)}
              disabled={selected.size === 0}
              className="shrink-0 bg-white text-brand-700 hover:bg-brand-50 font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
            >
              ✉️ Draft Dispute Letter ({selected.size}) &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Tabs matching Landlord layout */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('issues')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'issues' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          ⚠️ Issues Found ({violations.length})
        </button>
        <button
          onClick={() => setActiveTab('clauses')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'clauses' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          📋 All Clauses ({clauses.length})
        </button>
      </div>

      {/* Issues Tab */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          {violations.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-bold text-green-800 text-lg mb-1">No Issues Found!</h3>
              <p className="text-green-600 text-sm">Your lease agreement appears to be compliant with tenant rights standards.</p>
            </div>
          ) : (
            violations.map((v) => (
              <div
                key={v.id || v.clause_id}
                className={`bg-white border rounded-xl p-5 shadow-sm transition-all ${
                  selected.has(v.id) ? 'ring-2 ring-brand-500' : ''
                } ${
                  v.severity === 'critical' ? 'border-red-200 border-l-4 border-l-red-500' :
                  v.severity === 'moderate' ? 'border-amber-200 border-l-4 border-l-amber-400' :
                  'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(v.id)}
                      onChange={() => toggleSelect(v.id)}
                      className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 cursor-pointer"
                    />
                    <SeverityBadge severity={v.severity} />
                  </div>
                  {v.classification && (
                    <span className="text-[10px] text-slate-400 font-mono">{v.classification.replace(/_/g, ' ')}</span>
                  )}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-2">{v.explanation}</p>
                {v.clause_text && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-2">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Problematic Clause</p>
                    <p className="text-xs text-slate-600 italic leading-relaxed">&ldquo;{v.clause_text}&rdquo;</p>
                  </div>
                )}
                {v.legal_reference && (
                  <p className="text-xs text-slate-400 mt-2">📖 {v.legal_reference}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Clauses Tab matching Landlord accordion style */}
      {activeTab === 'clauses' && (
        <div className="space-y-3">
          {clauses.map((c, i) => {
            const clauseViolations = violations.filter((v) => v.clause_id === c.clause_id);
            return (
              <div
                key={c.clause_id || i}
                className={`bg-white border rounded-xl overflow-hidden shadow-sm ${
                  clauseViolations.length > 0 ? 'border-red-200' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={() => setExpandedSection(expandedSection === c.clause_id ? null : c.clause_id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-800 line-clamp-1">{c.text?.slice(0, 80)}…</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {clauseViolations.map((v, vi) => <SeverityBadge key={vi} severity={v.severity} />)}
                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedSection === c.clause_id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {expandedSection === c.clause_id && (
                  <div className="px-4 pb-4 border-t border-slate-100">
                    <p className="text-sm text-slate-700 leading-relaxed mt-3">{c.text}</p>
                    {c.plain_explanation && (
                      <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-lg p-2">{c.plain_explanation}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for dispute letter details */}
      {showLetterForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-slate-200">
            <h3 className="font-outfit text-xl font-bold text-slate-900 mb-1">Dispute Letter Details</h3>
            <p className="text-xs text-slate-500 mb-4">Generating formal legal notice for {selected.size} selected clause(s).</p>
            <form onSubmit={handleGenerateLetter} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Landlord / Manager Name</label>
                <input
                  placeholder="e.g. John Doe / Acme Properties"
                  value={landlordName}
                  onChange={(e) => setLandlordName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Landlord Address</label>
                <input
                  placeholder="Landlord office or notice address"
                  value={landlordAddress}
                  onChange={(e) => setLandlordAddress(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Your Full Address</label>
                <input
                  placeholder="Premises address being leased"
                  value={tenantAddress}
                  onChange={(e) => setTenantAddress(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              {error && <p className="text-xs font-medium text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-all shadow-md disabled:opacity-50"
                >
                  {generating ? 'Generating PDF…' : 'Generate Dispute PDF'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLetterForm(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="mt-10 flex justify-between">
        <Link to="/upload" className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1">
          ← Upload Another Lease
        </Link>
        <Link to="/dashboard" className="text-sm text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1">
          View All Scans →
        </Link>
      </div>
    </div>
  );
}
