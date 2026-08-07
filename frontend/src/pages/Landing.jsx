import { Link } from 'react-router-dom';
import { getUser } from '../api.js';

export default function Landing() {
  const user = getUser();
  const targetRoute = user ? '/upload' : '/register';

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* HERO SECTION WITH BACKGROUND IMAGE */}
      <section
        className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/hero_bg.png')` }}
      >
        {/* Soft White Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/60 backdrop-blur-[2px]" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Content */}
          <div className="lg:col-span-6 space-y-6">
            <h1 className="font-outfit text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Know Your Rights. <br />
              <span className="text-blue-600">Protect Your Home.</span>
            </h1>

            <p className="text-slate-700 text-lg sm:text-xl leading-relaxed font-normal max-w-xl">
              Upload your lease to instantly identify illegal clauses, understand your obligations in plain English, and generate professional dispute letters.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to={targetRoute}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-7 py-3.5 text-base flex items-center gap-2.5 transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-white font-bold">Scan My Lease</span>
              </Link>

              <a
                href="#how-it-works"
                className="bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl px-6 py-3.5 text-base border border-slate-300 transition-all shadow-sm"
              >
                How it Works
              </a>
            </div>

            <div className="flex items-center gap-6 pt-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><span className="text-emerald-600 text-base">✓</span> MODEL TENANCY ACT 2021</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-600 text-base">✓</span> CONSTITUTION OF INDIA</span>
            </div>
          </div>

          {/* Right Hero Visual Card */}
          <div className="lg:col-span-6 relative">
            {/* Background Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-blue-400/10 rounded-3xl blur-2xl -z-10" />

            <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-slate-300/60 relative">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-blue-600">
                    LEASE AGREEMENT — ANALYSIS
                  </span>
                </div>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                  AI ACTIVE
                </span>
              </div>

              {/* Gauge & Metrics Row */}
              <div className="grid grid-cols-12 gap-4 items-center mb-6">
                {/* Score Gauge */}
                <div className="col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-200"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-blue-600"
                        strokeDasharray="92, 100"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute font-bold text-slate-800 text-lg">92%</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 mt-2">Legal Health Score</span>
                </div>

                {/* Counter Badges */}
                <div className="col-span-7 space-y-2.5">
                  <div className="bg-red-50 border border-red-200/80 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-700">1 Illegal Clause</span>
                    <span className="font-mono font-bold text-red-900 text-base">🚨</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800">1 Unfair Term</span>
                    <span className="font-mono font-bold text-amber-900 text-base">⚠️</span>
                  </div>
                </div>
              </div>

              {/* Annotated Clause Floating Cards */}
              <div className="space-y-3">
                <div className="border border-red-300 bg-red-50/90 rounded-xl p-3.5 shadow-sm transform transition hover:-translate-y-0.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-800">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    Illegal waiver of landlord liability found.
                  </div>
                </div>

                <div className="border border-amber-300 bg-amber-50/90 rounded-xl p-3.5 shadow-sm transform transition hover:-translate-y-0.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                    Excessive late fee (15% of rent).
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THREE SIMPLE STEPS SECTION */}
      <section id="how-it-works" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-outfit text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Empowering You in Three Simple Steps
          </h2>
          <div className="w-12 h-1 bg-blue-600 rounded-full mx-auto mt-4 mb-16" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 text-2xl mb-6 shadow-inner">
                📤
              </div>
              <h3 className="font-outfit text-xl font-bold text-slate-900 mb-3">Upload</h3>
              <p className="text-slate-600 text-sm leading-relaxed max-w-xs font-medium">
                Securely upload your lease agreement in PDF or image format.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 text-2xl mb-6 shadow-inner">
                🔍
              </div>
              <h3 className="font-outfit text-xl font-bold text-slate-900 mb-3">Analyze</h3>
              <p className="text-slate-600 text-sm leading-relaxed max-w-xs font-medium">
                Our AI scans for legal violations and unfair terms specific to your local laws.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 text-2xl mb-6 shadow-inner">
                👍
              </div>
              <h3 className="font-outfit text-xl font-bold text-slate-900 mb-3">Act</h3>
              <p className="text-slate-600 text-sm leading-relaxed max-w-xs font-medium">
                Get a plain-English breakdown and generate a formal letter to your landlord.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* POWERFUL TOOLS SECTION */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-14 text-center max-w-2xl mx-auto">
            <h2 className="font-outfit text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Powerful Tools for Every Tenant
            </h2>
            <p className="text-slate-600 text-base mt-3 font-medium">
              Advanced technology meets legal expertise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1 rounded-full inline-block mb-4">
                LEGAL COMPLIANCE
              </span>
              <h3 className="font-outfit text-2xl font-bold text-slate-900 mb-3">Violation Detection</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                Instantly check if your lease violates state or local regulations. We flag prohibited terms like illegal entry clauses, unauthorized security deposit limits, and liability waivers before you sign.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-center gap-3">
                <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded">🚩 Illegal Term</span>
                <span className="text-xs text-red-900 font-bold">Landlord entry without 24hr written notice</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xl mb-4">
                📝
              </div>
              <h3 className="font-outfit text-2xl font-bold text-slate-900 mb-3">Plain English Explainer</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                Legal contracts are intentionally confusing. Our AI translates dense jargon into easy-to-understand summaries, letting you know exactly what rules you are agreeing to regarding pets, guests, subleases, and maintenance.
              </p>
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 italic font-medium">
                &ldquo;Translates legal jargon like &apos;indemnify and hold harmless&apos; into straightforward warnings.&rdquo;
              </div>
            </div>
          </div>

          {/* Feature 3: Big Royal Blue Banner */}
          <div className="bg-blue-600 text-white rounded-3xl p-8 sm:p-12 shadow-xl shadow-blue-600/30 relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <h3 className="font-outfit text-3xl font-extrabold text-white mb-4">Dispute Letter Generator</h3>
              <p className="text-blue-100 text-base leading-relaxed mb-8 font-medium">
                Landlord ignoring repairs or refusing to return your security deposit? Instantly generate a formal, legally structured dispute letter. Our templates cite relevant tenant-landlord laws for your zip code, ready to download, sign, and mail.
              </p>
              <Link
                to={targetRoute}
                className="bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl px-6 py-3 border border-white/40 transition-all inline-flex items-center gap-2 text-sm backdrop-blur-sm shadow-sm"
              >
                Generate Dispute Letter →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} RentRight. Empowering tenants with AI legal analysis.</p>
          <div className="flex gap-6 font-medium">
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <Link to="/login" className="hover:text-white transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
