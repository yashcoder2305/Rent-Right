import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setToken, setUser } from '../api.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/login_bg.png')` }}
    >
      {/* Soft background overlay blur */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm -z-0" />

      {/* Top Bar with Logo & Help */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <Link to="/" className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-sm">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center text-white">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
            </svg>
          </div>
          <span className="font-outfit font-extrabold text-slate-900 text-lg">RentRight</span>
        </Link>

        <button
          onClick={() => alert("Need help? RentRight analyzes lease agreements for tenant rights compliance.")}
          className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-600 font-bold text-sm shadow-sm hover:bg-white transition-colors"
          title="Help"
        >
          ?
        </button>
      </div>

      {/* Main Glass Card */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/80 relative z-10">
        {/* Header Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-brand-50 border border-brand-200 rounded-xl flex items-center justify-center text-brand-600 shadow-inner">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
              <path d="M12 11a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5z" />
              <path d="M9.5 16.5a2.5 2.5 0 0 1 5 0" />
            </svg>
          </div>
        </div>

        <h2 className="font-outfit text-2xl font-bold text-slate-900 text-center mb-1">
          Welcome back
        </h2>
        <p className="text-xs text-slate-500 text-center mb-6">
          Access your saved lease scans and legal analyses.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 bg-slate-50/50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600 transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 bg-slate-50/50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600 transition-all"
              />
            </div>
          </div>

          {error && <p className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-600/30 disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400 font-semibold tracking-wider">OR</span>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-xs text-center text-slate-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-bold text-brand-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
