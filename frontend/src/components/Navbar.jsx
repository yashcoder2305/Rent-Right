import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getUser, setToken, setUser } from '../api.js';

export default function Navbar() {
  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();

  function logout() {
    setToken(null);
    setUser(null);
    navigate('/login');
  }

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  if (isAuthPage) return null;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Upload', path: '/upload' },
    { label: 'Results', path: location.pathname.startsWith('/results') ? location.pathname : '/dashboard' },
    { label: 'Compare', path: '/compare' },
    { label: 'History', path: '/dashboard' },
    { label: 'Generate Letter', path: '/letter' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-decoration-none">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold font-outfit text-lg shadow-sm">
              R
            </div>
            <span className="font-outfit font-extrabold text-xl text-slate-900 tracking-tight">
              Rent<span className="text-blue-600">Right</span>
            </span>
          </Link>

          {/* Navigation links matching screenshot */}
          {user && (
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.label === 'Results' && location.pathname.startsWith('/results'));
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`transition-colors relative py-5 ${
                      isActive
                        ? 'text-blue-600 font-bold border-b-2 border-blue-600'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right side controls matching reference header */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-700 cursor-pointer" onClick={logout} title="Click to logout">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-xs font-bold text-slate-700 hover:text-blue-600 px-3 py-1.5">
                Sign in
              </Link>
              <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg px-4 py-2 shadow-sm">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
