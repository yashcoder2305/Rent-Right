import { Link } from 'react-router-dom';
import { getUser } from '../api.js';

export default function Landing() {
  const user = getUser();
  const targetRoute = user ? '/upload' : '/register';

  return (
    <div className="landing-page-bg">

      {/* ── Header ── */}
      <header className="landing-header">
        <div className="header-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1a35cc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--primary-color)', letterSpacing: '-0.5px' }}>RentRight</span>
        </div>

        <nav className="landing-nav">
          <a href="#how-it-works" className="nav-link-landing">How It Works</a>
          <a href="#features" className="nav-link-landing">Features</a>
          <Link to="/upload" className="nav-link-landing">Upload</Link>
          <Link to="/compare" className="nav-link-landing">Compare</Link>
        </nav>

        <div className="landing-cta-group">
          <Link to="/login" className="btn-login-outline">Sign In</Link>
          <Link to={targetRoute} className="btn-get-started">Get Started</Link>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="hero-landing-section">
        <div className="hero-container">
          <div className="privacy-badge-pill">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>Bank-Grade Privacy Guaranteed</span>
          </div>

          <h1 className="hero-main-title font-outfit">Scan your lease.<br />Spot the risks.</h1>
          <p className="hero-main-subtitle">
            Our AI identifies hidden clauses, illegal fees, and predatory terms in seconds.
            99.2% accuracy in clause detection for total peace of mind.
          </p>

          {/* Drag-drop card */}
          <div className="drag-drop-card" onClick={() => { if (!user) window.location.href='/register'; else window.location.href='/upload'; }}>
            <div className="cloud-icon-circle" style={{ backgroundColor: '#eefaf4' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/>
              </svg>
            </div>
            <h3 className="drag-drop-title font-outfit">Drop your lease agreement here</h3>
            <p className="drag-drop-subtitle">Supports PDF, JPG, and PNG files up to 25MB</p>
            <div className="drag-drop-actions">
              <Link to={targetRoute} className="btn-browse" onClick={e => e.stopPropagation()}>Browse Files</Link>
              <span className="divider-or-text">or</span>
              <Link to={targetRoute} style={{ fontSize: '13px', color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                Paste Link
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="stats-icon-grid">
            <div className="stat-icon-item">
              <div className="icon-outer-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div className="stat-text-box">
                <span className="stat-number font-outfit">99.2%</span>
                <span className="stat-label">ACCURACY RATE</span>
              </div>
            </div>
            <div className="stat-divider" />
            <div className="stat-icon-item">
              <div className="icon-outer-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div className="stat-text-box">
                <span className="stat-number font-outfit">AES-256</span>
                <span className="stat-label">ENCRYPTION</span>
              </div>
            </div>
            <div className="stat-divider" />
            <div className="stat-icon-item">
              <div className="icon-outer-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div className="stat-text-box">
                <span className="stat-number font-outfit">&lt; 15s</span>
                <span className="stat-label">PROCESSING TIME</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 Steps Section ── */}
      <section id="how-it-works" className="section-steps-explain">
        <div className="container-centered">
          <h2 className="steps-main-title font-outfit">Analyze in 3 simple steps</h2>
          <p className="steps-main-subtitle">Professional real estate technology, simplified for you.</p>

          <div className="steps-cards-grid">
            <div className="step-card-premium">
              <span className="watermark-number font-outfit">1</span>
              <div className="step-card-header">
                <div className="step-icon-bg-square">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <h3 className="step-title font-outfit">Upload</h3>
              </div>
              <p className="step-desc">Securely upload your document. We strip all PII before processing.</p>
            </div>

            <div className="step-card-premium">
              <span className="watermark-number font-outfit">2</span>
              <div className="step-card-header">
                <div className="step-icon-bg-square">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </div>
                <h3 className="step-title font-outfit">Analyze</h3>
              </div>
              <p className="step-desc">Our legal-trained AI scans for 150+ types of predatory clauses and compares to local tenant laws.</p>
            </div>

            <div className="step-card-premium">
              <span className="watermark-number font-outfit">3</span>
              <div className="step-card-header">
                <div className="step-icon-bg-square">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <h3 className="step-title font-outfit">Protect</h3>
              </div>
              <p className="step-desc">Receive a detailed report with risk scores, suggested edits, and legal context for negotiation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" style={{ padding: '72px 48px', background: '#fff', borderBottom: '1px solid rgba(203,213,225,0.4)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="steps-main-title font-outfit">Powerful Tools for Every Tenant</h2>
            <p className="steps-main-subtitle">Advanced technology meets legal expertise.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '28px' }}>
            {/* Feature card 1 */}
            <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '28px', border: '1px solid rgba(203,213,225,0.5)', transition: 'var(--transition-base)' }}>
              <div style={{ width: '44px', height: '44px', background: '#eef2ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a35cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h3 className="font-outfit" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px' }}>Violation Detection</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.65 }}>Instantly flag prohibited terms like illegal entry clauses, unauthorized security deposit limits, and liability waivers before you sign.</p>
            </div>

            {/* Feature card 2 */}
            <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '28px', border: '1px solid rgba(203,213,225,0.5)', transition: 'var(--transition-base)' }}>
              <div style={{ width: '44px', height: '44px', background: '#eef2ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a35cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <h3 className="font-outfit" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px' }}>Plain English Explainer</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.65 }}>Our AI translates dense legal jargon into easy-to-understand summaries about pets, guests, subleases, and maintenance rules.</p>
            </div>

            {/* Feature card 3 */}
            <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '28px', border: '1px solid rgba(203,213,225,0.5)', transition: 'var(--transition-base)' }}>
              <div style={{ width: '44px', height: '44px', background: '#eef2ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a35cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
                  <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
                </svg>
              </div>
              <h3 className="font-outfit" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px' }}>Lease Comparison</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.65 }}>Cross-reference multiple lease drafts side-by-side to track changes and spot differences between versions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonial ── */}
      <section className="section-testimonial">
        <div className="testimonial-card-container">
          <div className="testimonial-grid">
            <div className="testimonial-image-col">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80"
                alt="Sarah Chen, Senior Real Estate Attorney"
              />
            </div>
            <div className="testimonial-text-col">
              <div className="star-rating-row">
                {[...Array(5)].map((_, i) => <span key={i} className="star-el">★</span>)}
              </div>
              <blockquote className="testimonial-quote font-outfit">
                "As a real estate professional, I've seen countless tenants sign leases with 'silent' clauses that cost them thousands later. RentRight's scanner is the first tool I've seen that actually matches the level of scrutiny a human attorney provides. It's a game-changer for transparency."
              </blockquote>
              <div className="testimonial-author font-outfit">Sarah Chen</div>
              <div className="testimonial-author-title">Senior Real Estate Attorney & Property Advisor</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="section-dark-cta-banner">
        <div className="cta-banner-container">
          <div className="cta-left-content">
            <h2 className="cta-title font-outfit">Ready to sign with confidence?</h2>
            <p className="cta-subtitle">Join 50,000+ renters using RentRight Pro technology.</p>
          </div>
          <div className="cta-right-actions">
            <Link to={targetRoute} className="btn-cta-green font-outfit">Get Started Now</Link>
            <Link to="/upload" className="btn-cta-outline font-outfit">View Sample Report</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer-premium">
        <div className="footer-container-inner">
          <div>
            <div className="footer-brand font-outfit">RentRight <span style={{ color: '#1e6df9' }}>Pro</span></div>
            <p className="footer-copyright-text">© {new Date().getFullYear()} RentRight Pro. All rights reserved.</p>
          </div>
          <div className="footer-right-links">
            <a href="#how-it-works" className="footer-link-item">How It Works</a>
            <a href="#features" className="footer-link-item">Features</a>
            <Link to="/login" className="footer-link-item">Sign In</Link>
            <Link to="/register" className="footer-link-item">Create Account</Link>
            <a href="#" className="footer-link-item">Privacy Policy</a>
            <a href="#" className="footer-link-item">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
