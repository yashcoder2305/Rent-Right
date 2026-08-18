import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function GenerateLetter() {
  const [searchParams] = useSearchParams();
  const leaseId = searchParams.get('lease_id');
  const navigate = useNavigate();

  const [leaseData, setLeaseData] = useState(null);
  const [letterBody, setLetterBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  // Form fields for PDF generation
  const [landlordName, setLandlordName] = useState('');
  const [landlordAddress, setLandlordAddress] = useState('');
  const [tenantAddress, setTenantAddress] = useState('');

  useEffect(() => {
    async function loadLease() {
      setFetching(true);
      setError('');
      try {
        let data = null;

        // Try getting from session storage first if leaseId matches
        const cached = sessionStorage.getItem('rentright_last_result');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (!leaseId || String(parsed.lease_id) === String(leaseId)) {
            data = parsed;
          }
        }

        // If not cached or leaseId specified, fetch from API
        if (!data && leaseId) {
          data = await api.lease(leaseId);
        }

        if (data) {
          setLeaseData(data);
          
          // Pre-populate fields from meta if available
          if (data.meta) {
            setTenantAddress(data.meta.property || '');
            setLandlordName(data.meta.landlord || 'Landlord / Property Manager');
          }

          // Build dynamic formal notice letter based on REAL extracted lease violations
          const violations = data.violations || [];
          const filename = data.filename || 'Lease Agreement';

          let pointsText = '';
          if (violations.length === 0) {
            pointsText = '\nUpon thorough review, no statutory violations were flagged in the agreement. However, we request formal confirmation of standard habitability guidelines.';
          } else {
            pointsText = violations.map((v, i) => {
              const clauseRef = v.clause_text ? ` ("${v.clause_text.slice(0, 70)}...")` : '';
              return `\n${i + 1}. ${v.classification ? v.classification.replace(/_/g, ' ').toUpperCase() : 'Non-Compliant Clause'}${clauseRef}:\n   ${v.explanation}${v.legal_reference ? ` (Pursuant to ${v.legal_reference})` : ''}`;
            }).join('\n');
          }

          const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

          const dynamicText = `${currentDate}

To: ${data.meta?.landlord || 'Landlord / Management Office'}

RE: Formal Notice of Lease Non-Compliance - ${data.meta?.property || filename}

Dear Management Team,

I am writing this formal letter to address several concerns identified during a professional review of the residential lease agreement for ${data.meta?.property || 'the rented property'}.

Specifically, we identify the following points of contention:
${pointsText}

I kindly request a written response acknowledging these statutory discrepancies and a revised lease addendum correcting these points within 14 business days. I value our tenancy relationship and aim to resolve these technical inaccuracies promptly and amicably.

Sincerely,

${data.meta?.tenant || 'Tenant'}`;

          setLetterBody(dynamicText);
        } else {
          setError('No lease analysis found. Please select or upload a lease first.');
        }
      } catch (err) {
        setError(err.message || 'Failed to load lease details for letter generation.');
      } finally {
        setFetching(false);
      }
    }

    loadLease();
  }, [leaseId]);

  async function handleDownloadPDF() {
    if (!leaseData) return;
    setLoading(true);
    setError('');
    try {
      const activeLeaseId = leaseData.lease_id || leaseId;
      const violationIds = (leaseData.violations || []).map(v => v.id);

      const blob = await api.generateLetter({
        lease_id: isNaN(activeLeaseId) ? activeLeaseId : Number(activeLeaseId),
        violation_ids: violationIds,
        landlord_name: landlordName || 'Landlord',
        landlord_address: landlordAddress || 'Landlord Address',
        tenant_address: tenantAddress || 'Tenant Address',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dispute-notice-lease-${activeLeaseId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to generate dispute letter PDF.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(letterBody);
    alert('Notice letter copied to clipboard!');
  }

  if (fetching) {
    return <div className="max-w-7xl mx-auto px-6 py-12 text-slate-500 font-medium animate-pulse">Loading lease information...</div>;
  }

  if (error && !leaseData) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-3">No Lease Selected</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button onClick={() => navigate('/upload')} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md">
          Upload & Analyze Lease First
        </button>
      </div>
    );
  }

  const violations = leaseData?.violations || [];
  const meta = leaseData?.meta || {};

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
          <span className="cursor-pointer hover:text-slate-600" onClick={() => navigate('/dashboard')}>Dashboard</span>
          <span>&gt;</span>
          <span className="cursor-pointer hover:text-slate-600" onClick={() => navigate(`/results/${leaseData?.lease_id}`)}>Lease Analysis</span>
          <span>&gt;</span>
          <span className="text-blue-600">Generate Letter</span>
        </div>

        <h1 className="font-outfit text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mb-8">
          Generate Legal Letter
        </h1>

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column - Summary & Real Violations */}
          <div className="lg:col-span-4 space-y-6">

            {/* Lease Summary Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
              <h3 className="font-outfit text-base font-bold text-slate-900 mb-4">Lease Summary</h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PROPERTY / FILE</div>
                  <div className="font-bold text-slate-900 mt-0.5">{meta.property || leaseData?.filename || 'Uploaded Lease'}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TENANT</div>
                    <div className="font-bold text-slate-900 mt-0.5">{meta.tenant || 'Tenant'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LANDLORD</div>
                    <div className="font-bold text-slate-900 mt-0.5">{meta.landlord || 'Landlord'}</div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STATUS</div>
                  <div className="font-bold text-emerald-600 mt-0.5">Analysis Verified</div>
                </div>
              </div>
            </div>

            {/* Real Detected Violations List Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-outfit text-base font-bold text-slate-900">Detected Violations</h3>
                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-red-100 text-red-600 uppercase">
                  {violations.length} Issues
                </span>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {violations.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No non-compliant terms flagged for this lease.</p>
                ) : (
                  violations.map((v, i) => (
                    <div key={v.id || i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div className="pr-2">
                        <div className="text-xs font-bold text-slate-900">
                          {v.classification ? v.classification.replace(/_/g, ' ') : 'Violation'}
                        </div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{v.explanation}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase shrink-0 ${
                        v.severity === 'critical' ? 'bg-red-600 text-white' :
                        v.severity === 'moderate' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        {v.severity || 'ISSUE'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI Pro-Tip Box */}
            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-blue-600 uppercase tracking-wider text-[10px] mb-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI PRO-TIP
              </div>
              <p className="text-slate-600 italic">
                &ldquo;Sending statutory backed notice letters via registered mail creates binding evidence for housing tribunals.&rdquo;
              </p>
            </div>

          </div>

          {/* Right Column - Editor & Dynamic Letter Preview */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Toolbar Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-xl p-1 shadow-sm">
                <button className="px-3 py-1 text-xs font-bold hover:bg-slate-100 rounded">B</button>
                <button className="px-3 py-1 text-xs italic hover:bg-slate-100 rounded">I</button>
                <button className="px-3 py-1 text-xs hover:bg-slate-100 rounded">☰</button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={loading}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {loading ? 'Generating PDF...' : 'Download Legal PDF'}
                </button>
                <button
                  onClick={handleCopy}
                  className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Text
                </button>
              </div>
            </div>

            {error && <p className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">{error}</p>}

            {/* Editable Letter Canvas containing the REAL generated letter text */}
            <div className="bg-white rounded-2xl p-8 lg:p-12 border border-slate-200/80 shadow-sm min-h-[550px]">
              <textarea
                value={letterBody}
                onChange={(e) => setLetterBody(e.target.value)}
                className="w-full h-[500px] border-none font-serif text-xs leading-relaxed text-slate-800 focus:outline-none resize-none bg-transparent"
              />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
