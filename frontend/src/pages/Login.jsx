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
    <div className="auth-page-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="auth-header">
        <Link to="/" className="header-logo" style={{ textDecoration: 'none' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1a35cc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span className="brand-text">RentRight</span>
        </Link>
        <div className="auth-nav">
          <a href="#" className="auth-nav-link">Features</a>
          <a href="#" className="auth-nav-link">Pricing</a>
          <a href="#" className="auth-nav-link">Security</a>
          <Link to="/register" className="auth-signin-link">Create Account</Link>
        </div>
      </header>

      {/* Split Layout */}
      <main className="auth-split-wrapper" style={{ flex: 1 }}>

        {/* Left Column */}
        <section className="auth-features-col">
          <div className="illustration-image-container">
            <img
              src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80"
              alt="Legal technology"
              style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
            />
          </div>

          <h2 className="auth-features-title font-outfit">Intelligent Lease Management</h2>

          <div className="features-split-grid">
            {/* Feature 1 */}
            <div className="grid-feature-item">
              <div className="feature-small-icon-bg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e6df9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
                  <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
                </svg>
              </div>
              <div>
                <h4 className="feature-grid-title font-outfit">AI Lease Analysis</h4>
                <p className="feature-grid-desc">Instant risk profile generation for your lease.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid-feature-item">
              <div className="feature-small-icon-bg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e6df9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <h4 className="feature-grid-title font-outfit">Violation Detection</h4>
                <p className="feature-grid-desc">Identify hidden clauses and legal loopholes.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="grid-feature-item">
              <div className="feature-small-icon-bg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e6df9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
                  <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
                  <line x1="4" y1="4" x2="9" y2="9"/>
                </svg>
              </div>
              <div>
                <h4 className="feature-grid-title font-outfit">Lease Comparison</h4>
                <p className="feature-grid-desc">Cross-reference multiple drafts instantly.</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="grid-feature-item">
              <div className="feature-small-icon-bg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e6df9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <div>
                <h4 className="feature-grid-title font-outfit">Legal Letters</h4>
                <p className="feature-grid-desc">Automated notice generation for disputes.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column */}
        <section className="auth-form-col">
          <div className="auth-card">
            <h1 className="auth-card-title font-outfit">Welcome Back</h1>
            <p className="auth-card-subtitle">Sign in to access your lease analyzer</p>

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-icon-wrapper">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    type="email"
                    className="rr-input"
                    placeholder="name@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-icon-wrapper password-wrapper" style={{ position: 'relative' }}>
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="rr-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" className="toggle-password-btn" onClick={() => setShowPass(p => !p)} aria-label="Toggle password">
                    {showPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Meta row */}
              <div className="auth-meta-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', fontWeight: 500, color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ accentColor: 'var(--primary-color)' }} />
                  Remember me
                </label>
                <a href="#" className="forgot-password-link">Forgot Password?</a>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
                  <p style={{ fontSize: '12.5px', color: '#dc2626', fontWeight: 600, margin: 0 }}>{error}</p>
                </div>
              )}

              <button type="submit" className="btn-primary-rr" disabled={loading}>
                {loading ? (
                  <span className="rr-spinner" />
                ) : (
                  <>
                    <span>Login to Analyzer</span>
                    <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* OR Divider */}
            <div className="rr-divider">OR</div>

            {/* Google */}
            <button type="button" className="btn-google-rr">
              <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <p className="redirect-prompt">
              New to RentRight? <Link to="/register">Join Now</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
