import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getUser, setToken, setUser } from '../api.js';
import Logo from './Logo.jsx';

export default function Navbar() {
  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();

  function logout() {
    setToken(null);
    setUser(null);
    navigate('/');
  }

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/';

  if (isAuthPage) return null;

  return (
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Logo linkTo={user ? '/upload' : '/'} />

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700">
          {!user ? (
            <>
              <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it Works</a>
              <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
              <a href="#impact" className="hover:text-blue-600 transition-colors">Impact</a>
            </>
          ) : (
            <>
              <Link
                to="/upload"
                className={`transition-colors ${location.pathname === '/upload' ? 'text-blue-600 font-bold' : 'hover:text-blue-600'}`}
              >
                Scan a Lease
              </Link>
              <Link
                to="/dashboard"
                className={`transition-colors ${location.pathname === '/dashboard' ? 'text-blue-600 font-bold' : 'hover:text-blue-600'}`}
              >
                Dashboard
              </Link>
              <Link
                to="/compare"
                className={`transition-colors ${location.pathname === '/compare' ? 'text-blue-600 font-bold' : 'hover:text-blue-600'}`}
              >
                Compare Leases
              </Link>
            </>
          )}
        </nav>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link
                to="/login"
                className="text-sm font-bold text-slate-700 hover:text-blue-600 px-3 py-1.5 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full px-5 py-2 transition-all shadow-md shadow-blue-600/30"
              >
                Join
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                👤 {user.name || user.email}
              </span>
              <button
                onClick={logout}
                className="text-xs font-bold text-slate-600 hover:text-red-600 px-3 py-1.5 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
