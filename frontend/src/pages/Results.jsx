import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

/**
 * Returns true if the text looks like raw PDF metadata/binary garbage.
 * This prevents "CreationDate (D:2026...)", XMP data, etc. from rendering.
 */
function isGarbageText(text) {
  if (!text || typeof text !== 'string' || text.trim().length < 10) return true;
  const t = text.trim();
  const GARBAGE_MARKERS = [
    'CreationDate', 'ModDate', 'XMPMeta', 'xpacket', 'rdf:RDF',
    'pdfmark', 'endobj', 'endstream', '/Type /', 'Helvetica',
    'FlateDecode', '/MediaBox', 'startxref', 'procset',
  ];
  if (GARBAGE_MARKERS.some((m) => t.includes(m))) return true;
  // Too many non-printable characters (binary data)
  const nonPrintable = (t.match(/[\x00-\x08\x0b-\x1f\x7f-\x9f]/g) || []).length;
  if (nonPrintable / t.length > 0.04) return true;
  // Very long tokens that look like hashed/binary content
  const tokens = t.split(/\s+/);
  const longTokenRatio = tokens.filter((tok) => tok.length > 35).length / Math.max(tokens.length, 1);
  if (longTokenRatio > 0.2) return true;
  return false;
}

function formatClassification(classification) {
  if (!classification) return 'Lease Violation';
  return classification
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function SeverityBadge({ severity }) {
  const cfg = {
    critical: 'bg-red-100 text-red-700',
    moderate: 'bg-amber-100 text-amber-700',
    minor: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${cfg[severity] || cfg.minor}`}>
      {severity || 'MODERATE'} SEVERITY
    </span>
  );
}

export default function Results() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [legalTipsOpen, setLegalTipsOpen] = useState(false);
  const [amendmentsOpen, setAmendmentsOpen] = useState(true);
  const [nextStepsOpen, setNextStepsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const cached = sessionStorage.getItem('rentright_last_result');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (String(parsed.lease_id) === id) {
        setData(parsed);
        return;
      }
    }
    api.lease(id).then((res) => setData(res)).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="max-w-7xl mx-auto px-6 py-12 text-red-600 font-medium">{error}</div>;
  if (!data) return <div className="max-w-7xl mx-auto px-6 py-12 text-slate-500 font-medium animate-pulse">Loading analysis report…</div>;

  const violations = data.violations || [];
  const meta = data.meta || {};

  // Deduplicate violations by explanation to avoid showing the same issue twice
  const seen = new Set();
  const uniqueViolations = violations.filter((v) => {
    const key = (v.explanation || '').trim().slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Calculate risk score
  let riskScore = 100;
  uniqueViolations.forEach((v) => {
    if (v.severity === 'critical') riskScore -= 20;
    else if (v.severity === 'moderate') riskScore -= 12;
    else riskScore -= 6;
  });
  riskScore = Math.max(10, Math.min(100, riskScore));

  const getRiskLabel = (score) => {
    if (score < 40) return { title: 'High Risk', color: 'text-red-600', ring: 'text-red-500' };
    if (score < 70) return { title: 'Moderate Risk', color: 'text-amber-600', ring: 'text-amber-500' };
    return { title: 'Low Risk', color: 'text-emerald-600', ring: 'text-emerald-500' };
  };
  const riskInfo = getRiskLabel(riskScore);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="font-outfit text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Analysis Results
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Legal Intelligence Report for{' '}
            <span className="text-blue-600 font-bold">{data.filename || `Lease #${id}`}</span>
          </p>
        </div>

        {/* Lease Meta Strip */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'PROPERTY', value: meta.property || '—' },
            { label: 'TENANT', value: meta.tenant || '—' },
            { label: 'RENT', value: meta.rent || '—' },
            { label: 'DURATION', value: meta.duration || '—' },
            { label: 'DEPOSIT', value: meta.deposit || '—', alert: meta.deposit && meta.deposit.includes('Alert') },
          ].map(({ label, value, alert }) => (
            <div key={label}>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
              <div className={`text-xs font-bold ${alert ? 'text-amber-600' : 'text-slate-900'}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Violations */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center gap-3">
              <h2 className="font-outfit text-lg font-bold text-slate-900">
                {uniqueViolations.length} Potential Issue{uniqueViolations.length !== 1 ? 's' : ''} Detected
              </h2>
              {uniqueViolations.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">
                  Priority Action Required
                </span>
              )}
            </div>

            {uniqueViolations.length === 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="font-bold text-emerald-800 text-base mb-1">No Violations Found</h3>
                <p className="text-emerald-600 text-xs">Lease appears compliant with statutory tenant rights standards.</p>
              </div>
            )}

            {uniqueViolations.map((v, idx) => {
              const clauseText = isGarbageText(v.clause_text) ? null : v.clause_text;

              return (
                <div
                  key={v.id || v.clause_id || idx}
                  className={`bg-white rounded-2xl p-6 border shadow-sm ${
                    v.severity === 'critical' ? 'border-red-200 border-l-4 border-l-red-500' :
                    v.severity === 'moderate' ? 'border-amber-200 border-l-4 border-l-amber-400' :
                    'border-slate-200'
                  }`}
                >
                  {/* Violation Header */}
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-outfit text-sm font-bold text-slate-900 flex items-center gap-2">
                      {v.severity === 'critical' ? '🔴' : v.severity === 'moderate' ? '🟠' : '🔵'}
                      {formatClassification(v.classification)}
                    </h3>
                    <SeverityBadge severity={v.severity} />
                  </div>

                  {/* Legal Reference Pill */}
                  {v.legal_reference && !isGarbageText(v.legal_reference) && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {v.legal_reference.split(';').map((ref, i) => (
                        <span key={i} className="inline-block text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {ref.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Explanation */}
                  <p className="text-xs text-slate-700 leading-relaxed mb-4">
                    {v.explanation}
                  </p>

                  {/* Extracted Clause Text — only show if it's real text */}
                  {clauseText && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        📋 Problematic Clause
                      </div>
                      <p className="text-xs text-slate-700 italic leading-relaxed line-clamp-4">
                        &ldquo;{clauseText}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* AI Fix */}
                  <div className="bg-blue-50/50 rounded-xl p-3.5 border border-blue-100 mb-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 mb-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI Suggested Fix
                    </div>
                    <p className="text-xs text-slate-600 italic">
                      Request amendment to this clause to comply with{' '}
                      {v.legal_reference
                        ? v.legal_reference.split(';')[0].trim()
                        : 'the applicable tenancy statute'}.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                    <span className="text-slate-500 font-semibold flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      {Math.round((v.confidence || 0.85) * 100)}% Confidence
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">

            {/* Overall Risk Profile */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm text-center">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                OVERALL RISK PROFILE
              </h3>
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5" stroke="currentColor" fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={riskInfo.ring}
                    strokeDasharray={`${riskScore}, 100`}
                    strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-slate-900 font-outfit">{riskScore}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">/ 100</span>
                </div>
              </div>
              <h4 className={`text-base font-extrabold font-outfit mb-1 ${riskInfo.color}`}>{riskInfo.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed px-2">
                {uniqueViolations.length} clause{uniqueViolations.length !== 1 ? 's' : ''} found that may be non-compliant with local residential tenancy law.
              </p>
            </div>

            {/* Accordions */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">

              <div>
                <button onClick={() => setLegalTipsOpen(!legalTipsOpen)} className="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50">
                  <span>⚖️ Legal Tips</span>
                  <span>{legalTipsOpen ? '▲' : '▼'}</span>
                </button>
                {legalTipsOpen && (
                  <div className="p-4 bg-slate-50 text-xs text-slate-600 space-y-2">
                    <p>• Always get your security deposit terms in writing before signing.</p>
                    <p>• Landlord must provide written notice before entering premises.</p>
                    <p>• Rent increases require advance written notice under the Model Tenancy Act 2021.</p>
                  </div>
                )}
              </div>

              <div>
                <button onClick={() => setAmendmentsOpen(!amendmentsOpen)} className="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50">
                  <span>✏️ Suggested Amendments</span>
                  <span>{amendmentsOpen ? '▲' : '▼'}</span>
                </button>
                {amendmentsOpen && (
                  <div className="p-4 bg-slate-50 text-[11px] text-slate-600 space-y-3">
                    {uniqueViolations.slice(0, 3).map((v, i) => (
                      <div key={i}>
                        <div className="font-bold text-slate-800">
                          {formatClassification(v.classification)}
                        </div>
                        <div className="text-slate-500 line-clamp-2">{v.explanation}</div>
                      </div>
                    ))}
                    {uniqueViolations.length === 0 && (
                      <p className="text-slate-400 italic">No specific amendments required.</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <button onClick={() => setNextStepsOpen(!nextStepsOpen)} className="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50">
                  <span>✅ Next Steps</span>
                  <span>{nextStepsOpen ? '▲' : '▼'}</span>
                </button>
                {nextStepsOpen && (
                  <div className="p-4 bg-slate-50 text-xs text-slate-600 space-y-2">
                    <p>1. Review flagged clauses with your landlord.</p>
                    <p>2. Generate a formal legal dispute notice below.</p>
                    <p>3. File with the Rent Authority if the landlord refuses to amend.</p>
                  </div>
                )}
              </div>

            </div>

            {/* CTA */}
            <button
              onClick={() => navigate(`/letter?lease_id=${id}`)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Generate Dispute Notice Letter
            </button>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm text-center">
              <h4 className="text-sm font-extrabold text-slate-900 font-outfit mb-1">Need a Lawyer?</h4>
              <p className="text-[11px] text-slate-500 mb-4">
                Certified tenant-rights attorneys available for 30-minute consultations.
              </p>
              <button className="w-full py-2 bg-white border border-blue-600 text-blue-600 font-bold text-xs rounded-lg hover:bg-blue-50">
                Book Consultation
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
