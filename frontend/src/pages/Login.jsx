import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setToken, setUser } from '../api.js';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      setToken(data.token);
      setUser(data.user);
      navigate('/upload');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">


      {/* Main content grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-12 items-center">
        {/* Left column - AI LegalTech SaaS promo panel */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-white rounded-3xl p-8 lg:p-10 border border-slate-200/80 shadow-sm relative overflow-hidden">
          {/* Blue Graphic Card matching reference */}
          <div className="w-full rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-white relative min-h-[320px] flex flex-col justify-between overflow-hidden shadow-lg shadow-blue-500/20 mb-8">
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold font-outfit tracking-tight">RentRight</h2>
              <p className="text-blue-100 text-sm font-medium mt-1">LegalTech SaaS</p>
            </div>

            {/* Document graphic inside blue card */}
            <div className="absolute right-6 bottom-6 w-56 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 transform rotate-[-4deg] shadow-2xl hidden sm:block">
              <div className="text-[10px] font-bold tracking-widest uppercase text-blue-200 mb-2">LEASE AGREEMENT</div>
              <div className="space-y-1.5 opacity-80">
                <div className="h-1.5 bg-white rounded w-3/4"></div>
                <div className="h-1.5 bg-white rounded w-full"></div>
                <div className="h-1.5 bg-white rounded w-5/6"></div>
              </div>
              <div className="mt-4 pt-2 border-t border-white/20 flex justify-between items-center">
                <div className="w-12 h-3 bg-blue-300/40 rounded"></div>
                <div className="w-4 h-4 rounded-full bg-emerald-400"></div>
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold font-outfit text-slate-900 mb-6">
              Intelligent Lease Management
            </h1>

            {/* 4 Feature Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 font-outfit">AI Lease Analysis</h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Instant risk profile generation for commercial leases.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 font-outfit">Violation Detection</h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Identify hidden clauses and potential legal loopholes.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 font-outfit">Lease Comparison</h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Cross-reference multiple drafts to track changes.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 font-outfit">Legal Letters</h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">Automated notice generation for disputes and renewals.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Login Card matching Screenshot 3 */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold font-outfit text-slate-900">Welcome Back</h2>
              <p className="text-xs font-medium text-slate-500 mt-1">Sign in to access your lease analyzer</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  Remember Me
                </label>
                <a href="#" className="font-bold text-blue-600 hover:underline">Forgot Password?</a>
              </div>

              {error && (
                <p className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all mt-2"
              >
                {loading ? 'Signing in...' : 'Login to Analyzer →'}
              </button>
            </form>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <span className="relative px-3 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-wider">OR</span>
            </div>

            <button
              type="button"
              className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>

            <p className="text-center text-xs text-slate-500 mt-6">
              New to RentRight? <Link to="/register" className="font-bold text-blue-600 hover:underline">Join Now</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
