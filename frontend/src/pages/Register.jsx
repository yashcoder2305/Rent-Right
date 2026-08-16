import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setToken, setUser } from '../api.js';

export default function Register() {
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const data = await api.register({ name, email, password });
      setToken(data.token);
      setUser(data.user);
      navigate('/upload');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
          <a href="#" className="auth-nav-link">Pricing</a>
          <a href="#" className="auth-nav-link">Security</a>
          <Link to="/login" className="auth-signin-link">Sign In</Link>
        </div>
      </header>

      {/* Split Layout */}
      <main className="auth-split-wrapper" style={{ flex: 1 }}>

        {/* Left Column */}
        <section className="auth-features-col">
          <div className="illustration-image-container">
            <img
              src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80"
              alt="Legal technology"
              style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
            />
          </div>

          <h2 className="auth-features-title font-outfit">
            The AI layer for <span style={{ color: '#1e6df9' }}>Rental Legals</span>
          </h2>
          <p className="auth-features-subtitle-left">
            Automate lease reviews, identify risky clauses, and sign with confidence. RentRight combines legal precision with modern AI automation.
          </p>

          <div className="features-bullet-list">
            <div className="bullet-list-item">
              <div className="bullet-icon-circle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e6df9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span className="bullet-text">Real-time clause analysis and risk scoring</span>
            </div>
            <div className="bullet-list-item">
              <div className="bullet-icon-circle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e6df9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <span className="bullet-text">Review 50+ page documents in under 30 seconds</span>
            </div>
            <div className="bullet-list-item">
              <div className="bullet-icon-circle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e6df9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <span className="bullet-text">Enterprise-grade security and compliance</span>
            </div>
          </div>
        </section>

        {/* Right Column */}
        <section className="auth-form-col">
          <div className="auth-card">
            <h1 className="auth-card-title font-outfit">Create Account</h1>
            <p className="auth-card-subtitle">Start your free trial today — no credit card needed.</p>

            <form onSubmit={handleSubmit} noValidate>
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-icon-wrapper">
                  <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    type="text"
                    className="rr-input"
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

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
                    placeholder="john@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Passwords side-by-side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-icon-wrapper">
                    <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      type="password"
                      className="rr-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm</label>
                  <div className="input-icon-wrapper">
                    <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      type="password"
                      className="rr-input"
                      placeholder="••••••••"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>
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
                    <span>Get Started</span>
                    <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* OR Divider */}
            <div className="rr-divider">OR CONTINUE WITH</div>

            {/* Google */}
            <button type="button" className="btn-google-rr">
              <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Sign up with Google
            </button>

            <p className="redirect-prompt">
              Already have an account? <Link to="/login">Log In</Link>
            </p>
          </div>

          {/* Social proof */}
          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
            <div style={{ display: 'flex' }}>
              {['#cbd5e1','#94a3b8','#64748b'].map((c, i) => (
                <div key={i} style={{ width: '26px', height: '26px', borderRadius: '50%', background: c, border: '2px solid #fff', marginLeft: i > 0 ? '-8px' : 0, zIndex: 3 - i, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
              ))}
            </div>
            Joined by 10,000+ Legal Teams & Tenants
          </div>
        </section>
      </main>
    </div>
  );
}
