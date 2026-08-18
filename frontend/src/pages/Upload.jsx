import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getUser } from '../api.js';

const FILE_ICONS = {
  pdf: '📄',
  docx: '📝',
  image: '🖼️',
  default: '📤',
};

function getFileIcon(file) {
  if (!file) return FILE_ICONS.default;
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return FILE_ICONS.pdf;
  if (name.endsWith('.docx') || name.endsWith('.doc')) return FILE_ICONS.docx;
  if (name.match(/\.(jpg|jpeg|png|webp)$/)) return FILE_ICONS.image;
  return FILE_ICONS.default;
}

export default function Upload() {
  const [jurisdictions, setJurisdictions] = useState([]);
  const [jurisdictionId, setJurisdictionId] = useState('IN');
  const [mode, setMode] = useState('file');
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisFocus, setAnalysisFocus] = useState('tenant'); // 'tenant' | 'landlord'

  // Additional lease details as requested
  const [propertyAddress, setPropertyAddress] = useState('120 Wall St, New York, NY');
  const [tenantName, setTenantName] = useState('Aria Kensington');
  const [monthlyRent, setMonthlyRent] = useState('$4,250 / mo');
  const [duration, setDuration] = useState('12 Months');
  const [deposit, setDeposit] = useState('$8,500 (Alert)');

  const navigate = useNavigate();
  const isLandlord = analysisFocus === 'landlord';

  useEffect(() => {
    api.jurisdictions().then((d) => {
      setJurisdictions(d.jurisdictions);
      const hasIndia = d.jurisdictions.find((j) => j.id === 'IN');
      setJurisdictionId(hasIndia ? 'IN' : d.jurisdictions[0]?.id);
    }).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (mode === 'file' && !file) return setError('Please select a lease file first.');
    if (mode === 'text' && text.trim().length < 30) return setError('Paste more of the lease text — that looks too short to analyze.');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('jurisdiction_id', jurisdictionId);
      if (mode === 'file') formData.append('file', file);
      else formData.append('text', text);

      const result = await api.analyze(formData);
      
      // Store user entered metadata for Results page presentation
      result.meta = {
        property: propertyAddress,
        tenant: tenantName,
        rent: monthlyRent,
        duration: duration,
        deposit: deposit
      };

      sessionStorage.setItem('rentright_last_result', JSON.stringify(result));
      navigate(`/results/${result.lease_id}?mode=${analysisFocus}`);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 font-sans">
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className={`font-mono text-xs font-bold uppercase tracking-widest border px-3 py-1 rounded-full inline-block mb-3 ${
          isLandlord
            ? 'text-amber-700 bg-amber-50 border-amber-200'
            : 'text-blue-600 bg-blue-50 border-blue-200'
        }`}>
          {isLandlord ? '🏠 LANDLORD LEASE CHECKER' : '🔍 AI LEASE SCANNER'}
        </span>
        <h1 className="font-outfit text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {isLandlord ? 'Review Your Draft Lease' : 'Scan Your Lease Agreement'}
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
          {isLandlord
            ? 'Upload your draft lease (PDF, Word, or image). Our AI will flag legally non-compliant clauses and help you generate a compliant version.'
            : 'Upload a PDF, Word doc, or image — or paste text. Our AI checks against statutory laws and flags illegal or predatory terms.'}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Goal Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Select Your Goal / Perspective
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAnalysisFocus('tenant')}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200 ${
                  analysisFocus === 'tenant'
                    ? 'border-blue-500 bg-blue-50/45 ring-2 ring-blue-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm ${
                  analysisFocus === 'tenant' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  🔍
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-900">I'm a Tenant / Renter</span>
                  <span className="block text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Check for illegal terms and draft a dispute notice letter.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAnalysisFocus('landlord')}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200 ${
                  analysisFocus === 'landlord'
                    ? 'border-amber-500 bg-amber-50/35 ring-2 ring-amber-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm ${
                  analysisFocus === 'landlord' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  🏠
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-900">I'm a Landlord / Owner</span>
                  <span className="block text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Verify legal compliance and redraft a compliant lease.
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Lease Property Details Form Inputs */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Lease & Tenant Information
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Property Address</span>
                <input
                  type="text"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Tenant Name</span>
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Monthly Rent</span>
                <input
                  type="text"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Security Deposit</span>
                <input
                  type="text"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Jurisdiction Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Legal Jurisdiction
            </label>
            <div className="relative">
              <select
                value={jurisdictionId}
                onChange={(e) => setJurisdictionId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-slate-50/50 text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none cursor-pointer"
              >
                {jurisdictions.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.id === 'IN' ? '🇮🇳 India (Model Tenancy Act 2021, Constitution & TPA)' : j.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">▼</div>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('file')}
              className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
                mode === 'file' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📁 Upload File
            </button>
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
                mode === 'text' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ✏️ Paste Lease Text
            </button>
          </div>

          {/* Input Area */}
          {mode === 'file' ? (
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                file
                  ? isLandlord ? 'border-amber-500 bg-amber-50/30' : 'border-blue-500 bg-blue-50/30'
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-full border flex items-center justify-center mx-auto mb-3 text-xl ${
                isLandlord ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-blue-50 border-blue-200 text-blue-600'
              }`}>
                {file ? getFileIcon(file) : '📤'}
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {file ? file.name : 'Choose a lease document'}
              </p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Supported: PDF, Word (.docx), Images (JPG, PNG) — up to 20 MB
              </p>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
                id="lease-file-input"
              />
              <label
                htmlFor="lease-file-input"
                className="inline-block bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs rounded-lg px-4 py-2 cursor-pointer shadow-sm transition-all"
              >
                {file ? 'Change File' : 'Browse Computer'}
              </label>

              {/* File format info chips */}
              <div className="flex justify-center gap-2 mt-4">
                {[
                  { ext: 'PDF', color: 'red' },
                  { ext: 'DOCX', color: 'blue' },
                  { ext: 'JPG/PNG', color: 'green' },
                ].map(({ ext, color }) => (
                  <span
                    key={ext}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border bg-${color}-50 border-${color}-200 text-${color}-700`}
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={9}
                placeholder={
                  isLandlord
                    ? 'Paste the full text of your draft lease agreement here…'
                    : 'Paste the full text of the lease agreement here (clauses, rules, deposit terms...)'
                }
                className="w-full border border-slate-300 rounded-xl p-4 bg-white text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all leading-relaxed"
              />
            </div>
          )}

          {error && (
            <p className="text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-bold rounded-xl py-3.5 text-xs flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 ${
              isLandlord
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {isLandlord ? 'Reviewing Draft Lease…' : 'Scanning & Analyzing Lease…'}
              </>
            ) : isLandlord ? (
              'Review Draft Lease →'
            ) : (
              'Scan & Analyze Lease Now →'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
