import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

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
    api.lease(id).then((res) => {
      setData(res);
    }).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="max-w-7xl mx-auto px-6 py-12 text-red-600 font-medium">{error}</div>;
  if (!data) return <div className="max-w-7xl mx-auto px-6 py-12 text-slate-500 font-medium animate-pulse">Loading analysis report…</div>;

  const violations = data.violations || [];
  const meta = data.meta || {
    property: '120 Wall St, New York, NY',
    tenant: 'Aria Kensington',
    rent: '$4,250 / mo',
    duration: '12 Months',
    deposit: '$8,500 (Alert)'
  };

  // Calculate risk score based on violations severity
  let riskScore = 100;
  violations.forEach(v => {
    if (v.severity === 'critical') riskScore -= 25;
    else if (v.severity === 'moderate') riskScore -= 15;
    else riskScore -= 10;
  });
  riskScore = Math.max(10, Math.min(100, riskScore));

  const getRiskLabel = (score) => {
    if (score < 50) return { title: 'High Risk', text: 'Multiple critical issues flagged in this lease agreement.' };
    if (score < 80) return { title: 'Moderate Risk', text: 'Several clauses are non-compliant with local residential laws.' };
    return { title: 'Low Risk', text: 'Lease is mostly compliant with minor observations.' };
  };

  const riskInfo = getRiskLabel(riskScore);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Page Header matching Screenshot 1 */}
        <div className="mb-6">
          <h1 className="font-outfit text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Analysis Results
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Legal Intelligence Report for <span className="text-blue-600 font-bold">{data.filename || 'Standard Residential Lease v4'}</span>
          </p>
        </div>

        {/* Lease Meta Header Strip matching Screenshot 1 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">PROPERTY</div>
            <div className="text-xs font-bold text-slate-900">{meta.property}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">TENANT</div>
            <div className="text-xs font-bold text-slate-900">{meta.tenant}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">RENT</div>
            <div className="text-xs font-bold text-slate-900">{meta.rent}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">DURATION</div>
            <div className="text-xs font-bold text-slate-900">{meta.duration}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">DEPOSIT</div>
            <div className="text-xs font-bold text-amber-600">{meta.deposit}</div>
          </div>
        </div>

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Detected Issues List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center gap-3">
              <h2 className="font-outfit text-lg font-bold text-slate-900">
                {violations.length} Potential Issues Detected
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">
                Priority Action Required
              </span>
            </div>

            {/* Violation Cards matching Screenshot 1 */}
            {violations.map((v, idx) => (
              <div key={v.id || idx} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm relative">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 font-bold text-base">⚠️</span>
                    <h3 className="font-outfit text-base font-bold text-slate-900">
                      {v.classification ? v.classification.replace(/_/g, ' ') : 'Non-Compliant Clause'}
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                    v.severity === 'critical' ? 'bg-red-100 text-red-600' :
                    v.severity === 'moderate' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {v.severity || 'HIGH'} SEVERITY
                  </span>
                </div>

                {v.legal_reference && (
                  <span className="inline-block text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mb-3">
                    {v.legal_reference}
                  </span>
                )}

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {v.explanation}
                </p>

                {/* AI Suggested Fix Box matching reference */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 mb-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI Suggested Fix
                  </div>
                  <p className="text-xs text-slate-700 italic">
                    &ldquo;{v.clause_text || 'Standard statutory fallback clause should be substituted here.'}&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500 font-semibold flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    98% Confidence
                  </span>
                  <button className="text-blue-600 font-bold hover:underline">
                    View Details &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right Sidebar matching Screenshot 1 */}
          <div className="lg:col-span-4 space-y-6">

            {/* Overall Risk Profile Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm text-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                OVERALL RISK PROFILE
              </h3>

              {/* Gauge Meter */}
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-amber-500"
                    strokeDasharray={`${riskScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-slate-900 font-outfit">{riskScore}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">/ 100</span>
                </div>
              </div>

              <h4 className="text-base font-extrabold font-outfit text-slate-900 mb-1">
                {riskInfo.title}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed px-2">
                {riskInfo.text}
              </p>
            </div>

            {/* Accordion Panels matching Screenshot 1 */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
              
              {/* Legal Tips */}
              <div>
                <button
                  onClick={() => setLegalTipsOpen(!legalTipsOpen)}
                  className="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    Legal Tips
                  </span>
                  <span>{legalTipsOpen ? '▲' : '▼'}</span>
                </button>
                {legalTipsOpen && (
                  <div className="p-4 bg-slate-50 text-xs text-slate-600 space-y-2">
                    <p>• Never pay cash deposits without a written receipt.</p>
                    <p>• Always demand a joint move-in inspection report.</p>
                  </div>
                )}
              </div>

              {/* Suggested Amendments */}
              <div>
                <button
                  onClick={() => setAmendmentsOpen(!amendmentsOpen)}
                  className="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Suggested Amendments
                  </span>
                  <span>{amendmentsOpen ? '▲' : '▼'}</span>
                </button>
                {amendmentsOpen && (
                  <div className="p-4 bg-slate-50 text-[11px] text-slate-600 space-y-3">
                    <div>
                      <div className="font-bold text-slate-800">Clause 14: Repair Protocol</div>
                      <div>Specify 24-hour notice requirement for non-emergency entry.</div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">Section 8: Renewal</div>
                      <div>Clarify automatic renewal terms and notice periods.</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Next Steps */}
              <div>
                <button
                  onClick={() => setNextStepsOpen(!nextStepsOpen)}
                  className="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Next Steps
                  </span>
                  <span>{nextStepsOpen ? '▲' : '▼'}</span>
                </button>
                {nextStepsOpen && (
                  <div className="p-4 bg-slate-50 text-xs text-slate-600">
                    <p>Generate a formal dispute letter using our automated legal generator below.</p>
                  </div>
                )}
              </div>

            </div>

            {/* Action Buttons matching Screenshot 1 */}
            <button
              onClick={() => navigate(`/letter?lease_id=${id}`)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Analysis PDF / Draft Letter
            </button>

            {/* Need a Lawyer promo box */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm text-center">
              <h4 className="text-sm font-extrabold text-slate-900 font-outfit mb-1">Need a Lawyer?</h4>
              <p className="text-[11px] text-slate-500 mb-4">
                Get a 30-minute consultation with a certified tenant-rights attorney.
              </p>
              <button className="w-full py-2 bg-white border border-blue-600 text-blue-600 font-bold text-xs rounded-lg hover:bg-blue-50 transition-all">
                Book Consultation
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
