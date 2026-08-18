import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function GenerateLetter() {
  const [searchParams] = useSearchParams();
  const leaseId = searchParams.get('lease_id') || '1';
  const navigate = useNavigate();

  const [letterBody, setLetterBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields for PDF generation
  const [landlordName, setLandlordName] = useState('Apex Realty Group');
  const [landlordAddress, setLandlordAddress] = useState('900 Urban Ave, Suite 100, Seattle, WA 98101');
  const [tenantAddress, setTenantAddress] = useState('1242 Redwood Terrace, Apt 4B');

  useEffect(() => {
    // Generate default letter preview body
    const defaultText = `October 24, 2023

To: Apex Realty Group
Compliance Department
900 Urban Ave, Suite 100
Seattle, WA 98101

RE: Formal Notice of Lease Non-Compliance - 1242 Redwood Terrace, Apt 4B

Dear Management Team,

I am writing this formal letter to address several concerns identified during a professional review of the residential lease agreement for the above-referenced property. It has come to my attention that certain provisions within the current lease structure do not align with jurisdictional housing regulations.

Specifically, we identify the following points of contention:

1. Unlawful Late Fees: Section 4.2 of the lease stipulates a late fee of $150.00 for payments received after the 3rd. Pursuant to local ordinance, late fees may not exceed 5% of the total monthly rent ($2,200), which caps the legal limit at $110.00.

2. Security Deposit Cap: The collected deposit of $4,500 exceeds the legal maximum of two months' rent as mandated by RCW § 59.18.260.

3. Maintenance Responsibility: Clause 9.0 vaguely assigns "all general repairs" to the tenant. Under the Implied Warranty of Habitability, essential structural and utility maintenance remains the non-delegable duty of the landlord.

I kindly request a written response acknowledging these discrepancies and a revised lease addendum correcting these points by November 1, 2023. I value our tenancy relationship and aim to resolve these technical inaccuracies promptly and amicably.

Sincerely,

Sarah J. Miller`;

    setLetterBody(defaultText);
  }, [leaseId]);

  async function handleDownloadPDF() {
    setLoading(true);
    setError('');
    try {
      const blob = await api.generateLetter({
        lease_id: isNaN(leaseId) ? leaseId : Number(leaseId),
        violation_ids: [1, 2, 3],
        landlord_name: landlordName,
        landlord_address: landlordAddress,
        tenant_address: tenantAddress,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dispute-letter-lease-${leaseId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to download PDF.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(letterBody);
    alert('Letter copied to clipboard!');
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Breadcrumb matching Screenshot 2 */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
          <span>History</span>
          <span>&gt;</span>
          <span>Lease Analysis</span>
          <span>&gt;</span>
          <span className="text-blue-600">Generate Letter</span>
        </div>

        <h1 className="font-outfit text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mb-8">
          Generate Legal Letter
        </h1>

        {/* 2-Column Split Layout matching Screenshot 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column - Summary & Violations */}
          <div className="lg:col-span-4 space-y-6">

            {/* Lease Summary Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
              <h3 className="font-outfit text-base font-bold text-slate-900 mb-4">Lease Summary</h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PROPERTY</div>
                  <div className="font-bold text-slate-900 mt-0.5">{tenantAddress}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TENANT</div>
                    <div className="font-bold text-slate-900 mt-0.5">Sarah J. Miller</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LANDLORD</div>
                    <div className="font-bold text-slate-900 mt-0.5">{landlordName}</div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ANALYZED DATE</div>
                  <div className="font-bold text-slate-900 mt-0.5">October 14, 2023</div>
                </div>
              </div>
            </div>

            {/* Detected Violations List Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-outfit text-base font-bold text-slate-900">Detected Violations</h3>
                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-red-100 text-red-600 uppercase">
                  3 Issues
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Unlawful Late Fee</div>
                    <div className="text-[10px] text-slate-500">Section 4.2: Exceeds 5% cap.</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[8px] font-black bg-red-600 text-white uppercase">
                    CRITICAL
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Security Deposit Cap</div>
                    <div className="text-[10px] text-slate-500">Section 2.1: Non-compliance.</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[8px] font-black bg-amber-500 text-white uppercase">
                    WARNING
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Maintenance Clause</div>
                    <div className="text-[10px] text-slate-500">Section 9.0: Vague language.</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[8px] font-black bg-blue-500 text-white uppercase">
                    MINOR
                  </span>
                </div>
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
                &ldquo;Including specific RCW or Civil Code citations in your letter increases resolution probability by 34%.&rdquo;
              </p>
            </div>

          </div>

          {/* Right Column - Editor & Letter Preview matching Screenshot 2 */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Toolbar Header matching reference */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-xl p-1 shadow-sm">
                <button className="px-3 py-1 text-xs font-bold hover:bg-slate-100 rounded">B</button>
                <button className="px-3 py-1 text-xs italic hover:bg-slate-100 rounded">I</button>
                <button className="px-3 py-1 text-xs hover:bg-slate-100 rounded">☰</button>
                <div className="h-4 w-px bg-slate-200 mx-1"></div>
                <button className="px-2 py-1 text-xs hover:bg-slate-100 rounded">↩</button>
                <button className="px-2 py-1 text-xs hover:bg-slate-100 rounded">↪</button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={loading}
                  className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {loading ? 'Generating...' : 'Download PDF'}
                </button>
                <button
                  onClick={handleCopy}
                  className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
                <button className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">{error}</p>}

            {/* Editable Letter Canvas matching Screenshot 2 */}
            <div className="bg-white rounded-2xl p-8 lg:p-12 border border-slate-200/80 shadow-sm min-h-[550px]">
              <textarea
                value={letterBody}
                onChange={(e) => setLetterBody(e.target.value)}
                className="w-full h-[500px] border-none font-serif text-sm text-slate-800 leading-relaxed focus:outline-none resize-none bg-transparent"
              />
            </div>

            {/* Regenerate CTA button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => alert('AI Letter regenerated with updated statutory clauses.')}
                className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Regenerate with AI
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
