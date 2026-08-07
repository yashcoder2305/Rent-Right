import { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';

// Severity badge helper
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

export default function LandlordResults({ result: initialResult, onToggleView }) {
  const { id: leaseId } = useParams();
  const [_, setSearchParams] = useSearchParams();
  const result = initialResult || JSON.parse(sessionStorage.getItem('rentright_last_result') || '{}');

  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [draftError, setDraftError] = useState('');
  const [activeTab, setActiveTab] = useState('issues'); // 'issues' | 'draft'
  const [expandedSection, setExpandedSection] = useState(null);

  const violations = result.violations || [];
  const clauses = result.clauses || [];
  const summary = result.lease_summary || [];
  const criticalCount = violations.filter((v) => v.severity === 'critical').length;
  const moderateCount = violations.filter((v) => v.severity === 'moderate').length;

  async function handleGenerateDraft() {
    setGeneratingDraft(true);
    setDraftError('');
    try {
      // The generateDraft endpoint returns both a PDF (raw blob) and we store JSON separately
      const blob = await api.generateDraft(leaseId || result.lease_id);
      
      // Trigger PDF download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compliant-draft-lease-${leaseId || result.lease_id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Fetch JSON draft for on-screen display
      const jsonDraft = await api.getDraft(leaseId || result.lease_id);
      setDraftData(jsonDraft);
      setActiveTab('draft');
    } catch (err) {
      setDraftError(err.message || 'Failed to generate compliant draft. Please try again.');
    } finally {
      setGeneratingDraft(false);
    }
  }

  if (!result.lease_id && !leaseId) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-3">No analysis found</h2>
        <p className="text-slate-500 mb-6">Please upload a lease first.</p>
        <Link to="/upload" className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-600 transition-colors">
          Upload Lease
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              🏠 LANDLORD LEASE REVIEW
            </span>
          </div>
          <h1 className="font-outfit text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
            Lease Analysis Complete
          </h1>
          <p className="text-slate-500 text-sm">
            {violations.length === 0
              ? 'Great news — no issues were found in your draft lease.'
              : `Found ${violations.length} issue${violations.length !== 1 ? 's' : ''} to address before this lease is legally compliant.`}
          </p>
        </div>
        <button
          onClick={() => onToggleView ? onToggleView() : setSearchParams({ mode: 'tenant' })}
          className="text-xs font-semibold text-amber-700 hover:text-amber-805 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 mt-2"
        >
          🔍 Switch to Tenant View
        </button>
      </div>

      {/* Score Cards */}
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

      {/* Generate Draft CTA */}
      {violations.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 mb-8 text-white shadow-xl shadow-amber-500/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-outfit text-lg font-bold mb-1">Generate a Legally Compliant Draft</h3>
              <p className="text-amber-100 text-sm">
                Our AI will rewrite every non-compliant clause with legally sound, jurisdiction-specific language — and produce a ready-to-use PDF.
              </p>
            </div>
            <button
              onClick={handleGenerateDraft}
              disabled={generatingDraft}
              className="shrink-0 bg-white text-amber-700 hover:bg-amber-50 font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
            >
              {generatingDraft ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>✨ Generate Compliant Draft &rarr;</>
              )}
            </button>
          </div>
          {draftError && (
            <p className="mt-3 text-xs bg-red-100 text-red-700 px-3 py-2 rounded-lg">{draftError}</p>
          )}
        </div>
      )}

      {/* Tabs */}
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
        {draftData && (
          <button
            onClick={() => setActiveTab('draft')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'draft' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ✅ Compliant Draft ({draftData.changes_count} changes)
          </button>
        )}
      </div>

      {/* Issues Tab */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          {violations.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-bold text-green-800 text-lg mb-1">No Issues Found!</h3>
              <p className="text-green-600 text-sm">Your draft lease appears to be legally compliant in all checked areas.</p>
            </div>
          ) : (
            violations.map((v) => (
              <div
                key={v.id || v.clause_id}
                className={`bg-white border rounded-xl p-5 shadow-sm ${
                  v.severity === 'critical' ? 'border-red-200 border-l-4 border-l-red-500' :
                  v.severity === 'moderate' ? 'border-amber-200 border-l-4 border-l-amber-400' :
                  'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <SeverityBadge severity={v.severity} />
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

      {/* Clauses Tab */}
      {activeTab === 'clauses' && (
        <div className="space-y-3">
          {clauses.map((c, i) => {
            const clauseViolations = violations.filter((v) => v.clause_id === c.clause_id);
            return (
              <div
                key={c.clause_id}
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

      {/* Compliant Draft Tab */}
      {activeTab === 'draft' && draftData && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-green-800 mb-1">✅ Draft Generated</p>
            <p className="text-xs text-green-700">{draftData.summary}</p>
            <button
              onClick={handleGenerateDraft}
              className="mt-3 text-xs font-bold text-green-700 underline hover:no-underline"
            >
              ↓ Download PDF Again
            </button>
          </div>
          {draftData.sections?.map((section, i) => (
            <div
              key={section.clause_id || i}
              className={`bg-white border rounded-xl p-5 shadow-sm ${
                section.was_changed ? 'border-green-200 border-l-4 border-l-green-500' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-slate-800">{i + 1}. {section.title}</span>
                {section.was_changed && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                    REVISED
                  </span>
                )}
              </div>
              {section.was_changed && (
                <>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
                    <p className="text-[10px] font-bold uppercase text-red-500 mb-1">Original (Non-compliant)</p>
                    <p className="text-xs text-slate-600 italic leading-relaxed">{section.original_text}</p>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase text-green-600 mb-1">Redrafted (Compliant)</p>
                    <p className="text-xs text-slate-700 leading-relaxed">{section.redrafted_text}</p>
                  </div>
                  {section.legal_basis && (
                    <p className="text-xs text-slate-400 mt-2">📖 {section.legal_basis}</p>
                  )}
                  {section.change_reason && (
                    <p className="text-xs text-amber-600 mt-1">ℹ️ {section.change_reason}</p>
                  )}
                </>
              )}
              {!section.was_changed && (
                <p className="text-sm text-slate-600 leading-relaxed">{section.redrafted_text}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Back button */}
      <div className="mt-10 flex justify-between">
        <Link to="/upload" className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1">
          ← Upload Another Lease
        </Link>
        <Link to="/dashboard" className="text-sm text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1">
          View All Analyses →
        </Link>
      </div>
    </div>
  );
}
