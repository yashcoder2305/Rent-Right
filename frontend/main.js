// RentRight Main Application Interactions & Premium Animations System
document.addEventListener('DOMContentLoaded', function(){
  
  // --- HEADER AUTH STATE CONTROL ---
  const navCenter = document.querySelector('.site-header .nav-center');
  const navRight = document.querySelector('.site-header .nav-right');

  if (navCenter && navRight) {
    const isLoggedIn = !!localStorage.getItem('username');
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    if (isLoggedIn) {
      // 1. Logged In Nav Center
      navCenter.innerHTML = `
        <a href="dashboard.html" class="${currentPath === 'dashboard.html' ? 'active' : ''}">Dashboard</a>
        <a href="analyze.html" class="${currentPath === 'analyze.html' ? 'active' : ''}">Upload</a>
        <a href="results.html" class="${currentPath === 'results.html' ? 'active' : ''}">Results</a>
        <a href="compare.html" class="${currentPath === 'compare.html' ? 'active' : ''}">Compare</a>
        <a href="#" class="nav-link-landing">History</a>
        <a href="letter.html" class="${currentPath === 'letter.html' ? 'active' : ''}">Generate Letter</a>
      `;

      // 2. Logged In Nav Right
      const initials = localStorage.getItem('initials') || 'JD';
      navRight.innerHTML = `
        <!-- Notification Bell Icon -->
        <a href="#" aria-label="Notifications" style="color: var(--muted); display: flex; align-items: center; justify-content: center; padding: 6px; border-radius: 50%;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </a>
        <!-- Settings Gear Icon -->
        <a href="#" aria-label="Settings" style="color: var(--muted); display: flex; align-items: center; justify-content: center; padding: 6px; border-radius: 50%;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </a>
        <!-- Initials Avatar Badge -->
        <div class="user-profile-avatar" id="avatarInitials" style="cursor: pointer;" title="Profile">${initials}</div>
        <!-- Logout Button -->
        <button id="logoutBtn" class="btn secondary" style="padding: 6px 12px; font-size: 13px; font-weight: 600; border-radius: 6px; border: 1px solid var(--border-color); background: transparent; cursor: pointer; color: var(--navy); margin-left: 10px; transition: all 0.2s;">Log Out</button>
      `;

      // Log out event listener
      const avatarBtn = navRight.querySelector('#avatarInitials');
      if (avatarBtn) {
        avatarBtn.addEventListener('click', function() {
          if (confirm('Are you sure you want to log out?')) {
            localStorage.clear();
            window.location.href = 'landing.html';
          }
        });
      }

      const logoutBtn = navRight.querySelector('#logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
          if (confirm('Are you sure you want to log out?')) {
            localStorage.clear();
            window.location.href = 'landing.html';
          }
        });
      }

    } else {
      // 2. Logged Out Nav Center
      if (currentPath === 'landing.html') {
        navCenter.innerHTML = `
          <a href="#how-it-works">How It Works</a>
          <a href="#features">Features</a>
          <a href="#why-it-matters">Impact</a>
        `;
      } else {
        navCenter.innerHTML = `
          <a href="landing.html">Home</a>
          <a href="#">Legal Aid</a>
          <a href="landing.html#features">Resources</a>
        `;
      }

      // Logged Out Nav Right
      navRight.innerHTML = `
        <a href="index.html" class="btn-signin">Login</a>
        <a href="signup.html" class="btn-join">Sign Up</a>
      `;
    }
  }

  // --- A. DYNAMIC GREETING & PROFILE INITIALS LOAD ---
  const greetingHeading = document.getElementById('greetingHeading');
  const avatarInitials = document.getElementById('avatarInitials');
  
  // Set profile avatar initials and greeting header based on localStorage
  const savedUsername = localStorage.getItem('username') || 'Jane';
  const savedInitials = localStorage.getItem('initials') || 'JD';

  if (avatarInitials) {
    avatarInitials.textContent = savedInitials;
  }

  if (greetingHeading) {
    const hr = new Date().getHours();
    let timeGreeting = 'Good evening';
    if (hr < 12) {
      timeGreeting = 'Good morning';
    } else if (hr < 17) {
      timeGreeting = 'Good afternoon';
    }
    greetingHeading.textContent = `${timeGreeting}, ${savedUsername}`;
  }

  // --- B. DYNAMIC DASHBOARD STATE CONTROL ---
  const isDashboardPage = document.getElementById('stat-leases');
  if (isDashboardPage) {
    const scanned = localStorage.getItem('scanned') === 'true';
    const statLeases = document.getElementById('stat-leases');
    const statIssues = document.getElementById('stat-issues');
    const statLetters = document.getElementById('stat-letters');
    const statCompliance = document.getElementById('stat-compliance');
    const renewalAlert = document.getElementById('renewalAlert');
    const scanList = document.getElementById('scanList');
    const savedLettersList = document.getElementById('savedLettersList');

    if (scanned) {
      // Set stats to show increased scan values
      if (statLeases) statLeases.setAttribute('data-target', '1');
      if (statIssues) statIssues.setAttribute('data-target', '3');
      if (statLetters) statLetters.setAttribute('data-target', '1');
      if (statCompliance) statCompliance.setAttribute('data-target', '92');
      
      if (renewalAlert) renewalAlert.style.display = 'flex';
      
      if (scanList) {
        scanList.innerHTML = `
          <!-- Scan 1: 42 Maple St -->
          <div class="scan-item-row" style="cursor: pointer;" onclick="window.location.href='results.html'">
            <div class="scan-item-left">
              <div class="scan-item-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </div>
              <div class="scan-item-details">
                <h4>42 Maple St — Unit 3B</h4>
                <p>Scanned Jun 18, 2026 · 42 clauses</p>
              </div>
            </div>
            <div class="scan-item-right">
              <span class="risk-badge low">Low risk</span>
              <span class="scan-item-score">92%</span>
            </div>
          </div>
        `;
      }
      
      if (savedLettersList) {
        savedLettersList.innerHTML = `
          <!-- Letter Item 1 -->
          <div class="letter-item-row">
            <div class="letter-item-left">
              <div class="letter-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div class="letter-item-details">
                <h4>Security deposit dispute</h4>
                <p>Generated Jun 10, 2026</p>
              </div>
            </div>
            <button class="letter-download-btn" aria-label="Download Letter" onclick="alert('Downloading security_deposit_dispute.pdf...')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          </div>
        `;
      }
    } else {
      // Set all stats to zero (initial empty state)
      if (statLeases) statLeases.setAttribute('data-target', '0');
      if (statIssues) statIssues.setAttribute('data-target', '0');
      if (statLetters) statLetters.setAttribute('data-target', '0');
      if (statCompliance) statCompliance.setAttribute('data-target', '0');
      
      if (renewalAlert) renewalAlert.style.display = 'none';
      
      if (scanList) {
        scanList.innerHTML = `
          <div class="empty-state" style="text-align: center; padding: 40px 20px; color: var(--muted); border: 1px dashed var(--border-color); border-radius: 12px; background: #fff; width: 100%;">
            <div style="font-size: 36px; margin-bottom: 10px;">📄</div>
            <h4 style="font-weight: 700; margin-bottom: 4px; color: var(--navy); font-size: 15px;">No leases scanned yet</h4>
            <p style="font-size: 13px; max-width: 320px; margin: 0 auto; line-height: 1.5;">Upload and scan your first lease agreement to check for legal risks and compliance scores.</p>
          </div>
        `;
      }
      
      if (savedLettersList) {
        savedLettersList.innerHTML = `
          <div class="empty-state" style="text-align: center; padding: 30px 10px; color: var(--muted); border: 1px dashed var(--border-color); border-radius: 12px; background: #fff; font-size: 13px; width: 100%;">
            No dispute letters generated yet.
          </div>
        `;
      }
    }
  }

  // --- C. SCROLL REVEAL OBSERVER SYSTEM ---
  const reveals = document.querySelectorAll('.reveal');
  if(reveals.length) {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px"
    };
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if(entry.isIntersecting) {
          entry.target.classList.add('active');
          const countupEl = entry.target.querySelector('.countup');
          if (countupEl) {
            triggerCountUp(countupEl);
          }
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    reveals.forEach(el => revealObserver.observe(el));
  }

  // --- D. COUNT-UP ANIMATION SYSTEM ---
  function triggerCountUp(el) {
    const targetVal = parseInt(el.getAttribute('data-target'), 10);
    const duration = parseInt(el.getAttribute('data-duration') || '1000', 10);
    const suffix = el.getAttribute('data-suffix') || '';
    
    if (isNaN(targetVal) || targetVal === 0) {
      el.textContent = '0' + suffix;
      return;
    }

    let start = 0;
    const stepTime = Math.abs(Math.floor(duration / targetVal));
    const stepVal = Math.ceil(targetVal / (duration / 25)); // Make speed scale nicely
    
    const timer = setInterval(() => {
      start += stepVal;
      if (start >= targetVal) {
        el.textContent = targetVal + suffix;
        clearInterval(timer);
      } else {
        el.textContent = start + suffix;
      }
    }, 25);
  }

  // Trigger any immediately visible count-up elements (e.g. at the top of dashboard/report)
  document.querySelectorAll('.countup-immediate').forEach(el => {
    triggerCountUp(el);
  });

  // --- E. PASSWORD VISIBILITY TOGGLE ---
  const pwd = document.getElementById('password');
  const toggle = document.getElementById('togglePwd');

  if(toggle && pwd){
    toggle.addEventListener('click', function(){
      const isPwd = pwd.type === 'password';
      pwd.type = isPwd ? 'text' : 'password';
      
      if(isPwd) {
        toggle.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        `;
        toggle.setAttribute('aria-label', 'Hide password');
        toggle.title = 'Hide password';
      } else {
        toggle.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        `;
        toggle.setAttribute('aria-label', 'Show password');
        toggle.title = 'Show password';
      }
    });
  }

  // Helper: Extract name/initials from email input
  function extractUserFromEmail(email) {
    let namePart = email.split('@')[0];
    let parts = namePart.split(/[._-]/);
    let username = 'Jane';
    let fullname = 'Jane Doe';
    let initials = 'JD';
    
    if (parts.length > 0) {
      let firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
      username = firstName;
      if (parts.length > 1) {
        let lastName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
        fullname = firstName + ' ' + lastName;
        initials = firstName.charAt(0) + lastName.charAt(0);
      } else {
        fullname = firstName;
        initials = firstName.charAt(0);
      }
    }
    return { username, fullname, initials };
  }

  // --- F. LOGIN FORM ACTIONS ---
  const loginForm = document.getElementById('loginForm');
  if(loginForm){
    loginForm.addEventListener('submit', function(e){
      e.preventDefault();
      
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const errorDiv = document.getElementById('loginError');
      const loginBtn = document.getElementById('loginBtn');
      
      if(errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
      }

      if(!emailInput.value || !passwordInput.value) {
        if(errorDiv) {
          errorDiv.textContent = 'Please fill out all fields.';
          errorDiv.style.display = 'block';
        }
        return;
      }

      if(loginBtn){
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
      }

      // Extract details and save to local storage
      const userData = extractUserFromEmail(emailInput.value);
      localStorage.setItem('username', userData.username);
      localStorage.setItem('fullname', userData.fullname);
      localStorage.setItem('initials', userData.initials);
      
      // Initialize scan status as false upon clean log-in
      localStorage.setItem('scanned', 'false');

      // Redirect to dynamic activity dashboard
      setTimeout(function(){
        window.location.href = 'dashboard.html';
      }, 800);
    });
  }

  // --- G. SIGNUP FORM ACTIONS ---
  const signupForm = document.getElementById('signupForm');
  if(signupForm){
    signupForm.addEventListener('submit', function(e){
      e.preventDefault();
      
      const fullnameInput = document.getElementById('fullname');
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const confirmInput = document.getElementById('confirm');
      const errorDiv = document.getElementById('signupError');
      const createBtn = document.getElementById('createBtn');
      
      if(errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
      }

      if(!fullnameInput.value || !emailInput.value || !passwordInput.value || !confirmInput.value) {
        if(errorDiv) {
          errorDiv.textContent = 'Please fill out all fields.';
          errorDiv.style.display = 'block';
        }
        return;
      }

      if(passwordInput.value !== confirmInput.value) {
        if(errorDiv) {
          errorDiv.textContent = 'Passwords do not match.';
          errorDiv.style.display = 'block';
        }
        return;
      }

      if(createBtn){
        createBtn.disabled = true;
        createBtn.textContent = 'Creating Account...';
      }

      // Extract details and save to local storage
      let rawFullname = fullnameInput.value.trim();
      let parts = rawFullname.split(/\s+/);
      let username = 'Jane';
      let initials = 'JD';
      if (parts.length > 0) {
        username = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
        if (parts.length > 1) {
          initials = parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
        } else {
          initials = parts[0].charAt(0).toUpperCase();
        }
      }
      localStorage.setItem('username', username);
      localStorage.setItem('fullname', rawFullname);
      localStorage.setItem('initials', initials);
      
      // Initialize scan status as false upon clean signup
      localStorage.setItem('scanned', 'false');

      // Redirect to dynamic activity dashboard
      setTimeout(function(){
        window.location.href = 'dashboard.html';
      }, 1000);
    });
  }

  // --- H. INTERACTIVE LASER SCANNING TO REPORT ---
  const scanBtn = document.getElementById('scanBtn');
  const leaseCard = document.querySelector('.card-wide');
  
  if(scanBtn && leaseCard){
    scanBtn.addEventListener('click', function(){
      scanBtn.disabled = true;
      
      // Inject scan visual container overlay
      const scanOverlay = document.createElement('div');
      scanOverlay.className = 'scan-container';
      scanOverlay.innerHTML = `
        <div class="scan-laser-line"></div>
        <div class="scan-progress-percent">0%</div>
        <p style="font-weight: 600; margin-top: 10px; color: var(--navy); font-size: 15px;" id="scan-status-text">Uploading lease agreement... ⏳</p>
        <div class="scan-progress-bar-wrap">
          <div class="scan-progress-bar-fill" id="scan-fill"></div>
        </div>
      `;
      leaseCard.appendChild(scanOverlay);
      
      // Force repaint then show the scanning screen
      setTimeout(() => {
        scanOverlay.classList.add('active');
        document.getElementById('scan-fill').style.width = '100%';
      }, 50);

      const percentEl = scanOverlay.querySelector('.scan-progress-percent');
      const statusEl = document.getElementById('scan-status-text');
      
      let progress = 0;
      const progressTimer = setInterval(() => {
        progress += 2;
        if(progress > 100) progress = 100;
        
        percentEl.textContent = progress + '%';
        
        if(progress >= 25 && progress < 55) {
          statusEl.textContent = 'Scanning document contents... 🔍';
        } else if (progress >= 55 && progress < 85) {
          statusEl.textContent = 'Analyzing clauses with AI... 🤖';
        } else if (progress >= 85) {
          statusEl.textContent = 'Generating compliance report... 📋';
        }

        if(progress >= 100) {
          clearInterval(progressTimer);
          
          // Mark lease as scanned
          localStorage.setItem('scanned', 'true');
          
          setTimeout(() => {
            // Redirect to report detailed view
            window.location.href = 'results.html';
          }, 300);
        }
      }, 48); // ~2.4 seconds scan time
    });
  }

  // --- I. REPORT LOAD TRANSITIONS ---
  const isReportPage = document.querySelector('.compliance-gauge-wrapper');
  if(isReportPage) {
    setTimeout(() => {
      document.body.classList.add('dashboard-loaded');
    }, 200);
  }

  // --- J. DYNAMIC LETTER GENERATOR SYSTEM ---
  const letterPaper = document.getElementById('letterPaper');
  if (letterPaper) {
    // 1. Template Definitions
    const LETTER_TEMPLATES = {
      deposit: {
        polite: `<p><strong>Date:</strong> {{date}}</p>
<p><strong>To:</strong> {{landlord_name}}</p>
<p><strong>Property Address:</strong> {{property_address}}</p>
<br>
<p>Dear {{landlord_name}},</p>
<p>I hope this letter finds you well. I am writing to kindly inquire about the status of my security deposit for the apartment at {{property_address}}.</p>
<p>My tenancy ended on the last day of last month, and I moved out leaving the apartment clean and in good order. I have not yet received my refund or an itemized deduction list.</p>
<p><strong>Regarding the dispute:</strong> {{issue_description}}</p>
<p>I would be very grateful if we could resolve this amicably. Please send the security deposit refund to my new forwarding address at your earliest convenience.</p>
<p>Thank you for your time and help.</p>
<br>
<p>Warm regards,</p>
<p><br><strong>{{tenant_name}}</strong></p>`,
        formal: `<p><strong>Date:</strong> {{date}}</p>
<p><strong>To:</strong> {{landlord_name}}</p>
<p><strong>RE: Request for Return of Security Deposit — {{property_address}}</strong></p>
<br>
<p>Dear {{landlord_name}},</p>
<p>This letter serves as a formal request for the return of my security deposit for the tenancy at {{property_address}}, which was terminated on the last day of last month.</p>
<p>Pursuant to local landlord-tenant regulations, a landlord must return the security deposit or provide an itemized list of deductions within the statutory period of vacating the premises. As of today's date, I have not received these funds or an accounting statement.</p>
<p><strong>Statement of Dispute:</strong> {{issue_description}}</p>
<p>Please mail the full security deposit amount to my forwarding address. If you believe any deductions are warranted, please send a detailed, itemized receipt explaining those charges.</p>
<p>Thank you for your prompt attention to this matter.</p>
<br>
<p>Sincerely,</p>
<p><br><strong>{{tenant_name}}</strong></p>`,
        firm: `<p><strong>Date:</strong> {{date}}</p>
<p><strong>To:</strong> {{landlord_name}}</p>
<p><strong>RE: FORMAL DEMAND FOR RETURN OF SECURITY DEPOSIT — {{property_address}}</strong></p>
<br>
<p>Dear {{landlord_name}},</p>
<p>Please accept this letter as a formal legal demand for the immediate return of my security deposit in the amount of my original deposit for the property at {{property_address}}.</p>
<p>My tenancy terminated on the last day of last month, and the unit was vacated in clean condition. Under state law, your failure to return the deposit or provide an itemized list of deductions within the required timeframe constitutes a violation of housing codes.</p>
<p><strong>Details of Violation:</strong> {{issue_description}}</p>
<p>If the funds are not returned to my forwarding address within ten (10) business days of your receipt of this letter, I intend to pursue legal action in Small Claims Court without further notice. Please be advised that I will seek the full deposit amount plus statutory double damages, court costs, and interest.</p>
<p>Govern yourself accordingly.</p>
<br>
<p>Sincerely,</p>
<p><br><strong>{{tenant_name}}</strong></p>`
      },
      maintenance: {
        polite: `<p><strong>Date:</strong> {{date}}</p>
<p><strong>To:</strong> {{landlord_name}}</p>
<p><strong>Property Address:</strong> {{property_address}}</p>
<br>
<p>Dear {{landlord_name}},</p>
<p>I hope you are having a nice week. I am writing to let you know about a repair concern at {{property_address}} that needs some attention.</p>
<p>Specifically: {{issue_description}}</p>
<p>Could you please let me know when a maintenance technician might be available to come by and resolve this? I want to make sure it doesn't cause any further problems.</p>
<p>Thank you so much for your quick help and understanding.</p>
<br>
<p>Best regards,</p>
<p><br><strong>{{tenant_name}}</strong></p>`,
        formal: `<p><strong>Date:</strong> {{date}}</p>
<p><strong>To:</strong> {{landlord_name}}</p>
<p><strong>RE: Written Notice of Defect & Request for Maintenance — {{property_address}}</strong></p>
<br>
<p>Dear {{landlord_name}},</p>
<p>This letter constitutes formal written notification regarding a maintenance issue at {{property_address}} that requires prompt attention under the terms of our lease agreement and local housing regulations.</p>
<p><strong>Description of Issue:</strong> {{issue_description}}</p>
<p>Please contact me at your earliest convenience to arrange a time for maintenance personnel or a licensed contractor to inspect the premises and perform the necessary repairs. Under local housing guidelines, these repairs should be completed within a reasonable timeframe.</p>
<p>Thank you for your cooperation in maintaining the property in safe and habitable condition.</p>
<br>
<p>Sincerely,</p>
<p><br><strong>{{tenant_name}}</strong></p>`,
        firm: `<p><strong>Date:</strong> {{date}}</p>
<p><strong>To:</strong> {{landlord_name}}</p>
<p><strong>RE: URGENT DEMAND FOR IMMEDIATE PROPERTY REPAIRS — {{property_address}}</strong></p>
<br>
<p>Dear {{landlord_name}},</p>
<p>This letter serves as formal warning that you are in breach of your statutory duty to maintain the property at {{property_address}} in a habitable condition, in violation of state and local housing codes.</p>
<p><strong>Outstanding Maintenance Issues:</strong> {{issue_description}}</p>
<p>Despite previous notifications, this issue remains completely unresolved. If repairs are not initiated within forty-eight (48) hours of receipt of this notice, I will exercise all legal remedies available to tenants in this jurisdiction. This may include filing a complaint with the local housing inspector, withholding rent, or repairing the defect and deducting the cost from my rent.</p>
<p>Your prompt action is required to avoid legal escalation.</p>
<br>
<p>Sincerely,</p>
<p><br><strong>{{tenant_name}}</strong></p>`
      },
      termination: {
        polite: `<p><strong>Date:</strong> {{date}}</p>
<p><strong>To:</strong> {{landlord_name}}</p>
<p><strong>Property Address:</strong> {{property_address}}</p>
<br>
<p>Dear {{landlord_name}},</p>
<p>I am writing to let you know that I will need to end my tenancy at {{property_address}} earlier than expected.</p>
<p>I would like to propose ending the lease on the last day of next month. Here are the details: {{issue_description}}</p>
<p>I have really enjoyed living here and want to make the transition as smooth as possible for both of us. Please let me know when we can conduct a final walkthrough inspection.</p>
<p>Thank you so much for your kindness and support.</p>
<br>
<p>Warmly,</p>
<p><br><strong>{{tenant_name}}</strong></p>`,
        formal: `<p><strong>Date:</strong> {{date}}</p>
<p><strong>To:</strong> {{landlord_name}}</p>
<p><strong>RE: Notice of Intent to Vacate and Terminate Lease Agreement — {{property_address}}</strong></p>
<br>
<p>Dear {{landlord_name}},</p>
<p>Please accept this letter as formal notice of my intention to vacate the premises and terminate my lease agreement for the property located at {{property_address}} early, effective on the last day of next month.</p>
<p><strong>Explanation/Mitigating Factors:</strong> {{issue_description}}</p>
<p>I intend to return the keys and leave the property in clean, undamaged condition. Please contact me to schedule a pre-move-out inspection so we can verify the condition of the apartment and ensure the return of my security deposit.</p>
<p>Sincerely,</p>
<p><br><strong>{{tenant_name}}</strong></p>`,
        firm: `<p><strong>Date:</strong> {{date}}</p>
<p><strong>To:</strong> {{landlord_name}}</p>
<p><strong>RE: FORMAL NOTICE OF LEASE TERMINATION FOR MATERIAL BREACH — {{property_address}}</strong></p>
<br>
<p>Dear {{landlord_name}},</p>
<p>This is formal notice that I am terminating the lease agreement for the property at {{property_address}} effective on the last day of next month, for cause.</p>
<p><strong>Basis for Termination:</strong> {{issue_description}}</p>
<p>Under local tenant protection codes, a landlord's failure to remedy material breaches of the lease agreement or statutory habitability requirements relieves the tenant of further rent obligations. I demand a full accounting and refund of my security deposit and any prepaid rent within the statutory period.</p>
<p>If you dispute this termination or withhold my security deposit, I am prepared to defend my position in court.</p>
<br>
<p>Sincerely,</p>
<p><br><strong>{{tenant_name}}</strong></p>`
      },
      illegal: {
        polite: `<p><strong>Date:</strong> {{date}}</p>
<p><strong>To:</strong> {{landlord_name}}</p>
<p><strong>Property Address:</strong> {{property_address}}</p>
<br>
<p>Dear {{landlord_name}},</p>
<p>I hope you are doing well. While looking over our lease agreement for {{property_address}}, I noticed a clause that I wanted to chat about.</p>
<p>The clause relates to: {{issue_description}}</p>
<p>According to tenant resource guides, this type of clause might not align with current local housing regulations. I was hoping we could discuss removing or revising this provision to keep things simple for both of us.</p>
<p>Thanks for your help with this!</p>
<p>Best regards,</p>
<p><br><strong>{{tenant_name}}</strong></p>`,
        formal: `<p><strong>Date:</strong> {{date}}</p>
<p><strong>To:</strong> {{landlord_name}}</p>
<p><strong>RE: Notice of Unenforceable Lease Provision — {{property_address}}</strong></p>
<br>
<p>Dear {{landlord_name}},</p>
<p>I am writing to formally raise a concern regarding a clause in our lease agreement for the property at {{property_address}}.</p>
<p><strong>Provision in Question:</strong> {{issue_description}}</p>
<p>Under local landlord-tenant statutes, terms that attempt to waive a tenant's basic rights or shift landlord obligations to the tenant are null, void, and unenforceable as a matter of law. I request that we execute a lease amendment or addendum acknowledging that this specific provision is voided.</p>
<p>Thank you for your attention to this compliance matter.</p>
<br>
<p>Sincerely,</p>
<p><br><strong>{{tenant_name}}</strong></p>`,
        firm: `<p><strong>Date:</strong> {{date}}</p>
<p><strong>To:</strong> {{landlord_name}}</p>
<p><strong>RE: DEMAND TO RECTIFY ILLEGAL AND VOID LEASE TERMS — {{property_address}}</strong></p>
<br>
<p>Dear {{landlord_name}},</p>
<p>This letter is to put you on formal notice that the lease agreement for {{property_address}} contains one or more unlawful and unenforceable terms that violate state public policy.</p>
<p><strong>Illegal Provisions identified:</strong> {{issue_description}}</p>
<p>Please note that local housing laws prohibit landlords from including clauses that violate tenant rights. Any attempt to enforce these provisions will be met with immediate legal contest, and may expose you to statutory penalties. I demand that you send me written confirmation within seven (7) business days confirming that you will not seek to enforce this unlawful provision.</p>
<p>I expect your immediate written compliance.</p>
<br>
<p>Sincerely,</p>
<p><br><strong>{{tenant_name}}</strong></p>`
      }
    };

    const DEFAULT_ISSUES = {
      deposit: "The landlord has withheld $1,200 of my security deposit, claiming cleaning fees and painting costs. However, the apartment was left in immaculate condition, and normal wear and tear cannot be deducted under local tenant regulations. No itemized receipt was provided within the statutory 14-day limit.",
      maintenance: "There is a severe water leak in the bathroom ceiling coming from the apartment upstairs (Unit 4B). This leak has caused water accumulation on the floor and is creating a mold hazard. Despite three phone calls over the last five days, no repair technician has been sent.",
      termination: "Due to a sudden job relocation to Chicago, I must terminate my lease agreement early. I am providing 30 days' notice as discussed, and I will cooperate fully in showing the unit to prospective tenants.",
      illegal: "Section 12 of the lease agreement states that the tenant is responsible for all plumbing repairs under $200. Under local housing laws, the landlord is legally obligated to maintain all plumbing fixtures in good working order, and this obligation cannot be waived by the tenant."
    };

    // 2. State variables
    let activeType = 'deposit';
    let activeTone = 'formal';

    // 3. Elements
    const tenantNameInput = document.getElementById('tenantNameInput');
    const landlordNameInput = document.getElementById('landlordNameInput');
    const propertyAddressInput = document.getElementById('propertyAddressInput');
    const issueDescInput = document.getElementById('issueDescInput');

    // 4. Prepopulate inputs
    const savedFullname = localStorage.getItem('fullname') || 'Jane Doe';
    if (tenantNameInput) {
      tenantNameInput.value = savedFullname;
    }
    if (landlordNameInput) {
      landlordNameInput.value = 'Skyline Properties LLC';
    }
    if (issueDescInput) {
      issueDescInput.value = DEFAULT_ISSUES[activeType];
    }

    // 5. Update render helper
    function updateLetterText() {
      const tenantName = (tenantNameInput && tenantNameInput.value) ? tenantNameInput.value.trim() : '[Tenant Name]';
      const landlordName = (landlordNameInput && landlordNameInput.value) ? landlordNameInput.value.trim() : '[Landlord / Management Name]';
      const propertyAddress = (propertyAddressInput && propertyAddressInput.value) ? propertyAddressInput.value.trim() : '[Property Address]';
      const issueDesc = (issueDescInput && issueDescInput.value) ? issueDescInput.value.trim() : '[Description of the issue]';
      
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      let template = LETTER_TEMPLATES[activeType][activeTone];
      
      // Replace tokens
      let rendered = template
        .replace(/\{\{tenant_name\}\}/g, tenantName)
        .replace(/\{\{landlord_name\}\}/g, landlordName)
        .replace(/\{\{property_address\}\}/g, propertyAddress)
        .replace(/\{\{issue_description\}\}/g, issueDesc)
        .replace(/\{\{date\}\}/g, currentDate);

      letterPaper.innerHTML = rendered;
    }

    // 6. Bind inputs
    [tenantNameInput, landlordNameInput, propertyAddressInput, issueDescInput].forEach(inputEl => {
      if (inputEl) {
        inputEl.addEventListener('input', updateLetterText);
      }
    });

    // 7. Expose Type / Tone Swappers to global window object
    window.setLetterType = function(type) {
      activeType = type;
      
      // Update sidebar button active classes
      const buttons = {
        deposit: document.getElementById('btn-type-deposit'),
        maintenance: document.getElementById('btn-type-maintenance'),
        termination: document.getElementById('btn-type-termination'),
        illegal: document.getElementById('btn-type-illegal')
      };
      
      Object.keys(buttons).forEach(key => {
        if (buttons[key]) {
          if (key === type) {
            buttons[key].classList.add('active');
          } else {
            buttons[key].classList.remove('active');
          }
        }
      });

      // Update issue description value to type default
      if (issueDescInput) {
        const currentVal = issueDescInput.value.trim();
        const isADefault = Object.values(DEFAULT_ISSUES).some(defVal => defVal.trim() === currentVal) || currentVal === '';
        if (isADefault) {
          issueDescInput.value = DEFAULT_ISSUES[type];
        }
      }

      updateLetterText();
    };

    window.setTone = function(tone) {
      activeTone = tone;

      // Update segmented button active classes
      const toneButtons = {
        polite: document.getElementById('tone-polite'),
        formal: document.getElementById('tone-formal'),
        firm: document.getElementById('tone-firm')
      };

      Object.keys(toneButtons).forEach(key => {
        if (toneButtons[key]) {
          if (key === tone) {
            toneButtons[key].classList.add('active');
          } else {
            toneButtons[key].classList.remove('active');
          }
        }
      });

      updateLetterText();
    };

    // Helper to add letter to dashboard stats
    function addLetterToDashboard(letterTitle) {
      let stats = JSON.parse(localStorage.getItem('rentright_dashboard_stats'));
      if (!stats) {
        stats = {
          docs_uploaded: 0,
          violations_found: 0,
          avg_risk_score: 0.0,
          letters_generated: 0,
          audits: [],
          activities: [],
          compliance_velocity: [0, 0, 0, 0, 0, 0],
          risk_distribution: { compliant: 0, warning: 0, critical: 0 }
        };
      }
      
      stats.letters_generated += 1;
      
      stats.activities.unshift({
        type: 'Letter Sent',
        text: `Letter generated: "${letterTitle}"`,
        time: 'Just now'
      });
      
      localStorage.setItem('rentright_dashboard_stats', JSON.stringify(stats));
    }

    // 8. Expose Toolbar Actions to global window object
    window.copyDraft = function() {
      const copyBtn = document.getElementById('copyBtn');
      const textToCopy = letterPaper.innerText;
      
      navigator.clipboard.writeText(textToCopy).then(() => {
        // Success feedback
        if (copyBtn) {
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = `<span style="display:flex;align-items:center;gap:6px;color:var(--success)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Copied!
          </span>`;
          setTimeout(() => {
            copyBtn.innerHTML = originalText;
          }, 2000);
        }
        
        // Record action
        const title = activeType === 'deposit' ? 'Security deposit dispute' : activeType === 'maintenance' ? 'Maintenance request' : activeType === 'termination' ? 'Early termination notice' : 'Illegal clause notice';
        addLetterToDashboard(title);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    };

    window.emailDraft = function() {
      const landlordName = (landlordNameInput && landlordNameInput.value) ? landlordNameInput.value.trim() : 'Landlord';
      const propertyAddress = (propertyAddressInput && propertyAddressInput.value) ? propertyAddressInput.value.trim() : 'Property';
      
      // Open Mail Client
      const emailSubject = `Notice regarding ${propertyAddress}`;
      const emailBody = letterPaper.innerText;
      window.location.href = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      // Record action
      const title = activeType === 'deposit' ? 'Security deposit dispute' : activeType === 'maintenance' ? 'Maintenance request' : activeType === 'termination' ? 'Early termination notice' : 'Illegal clause notice';
      addLetterToDashboard(title + ' (Email)');

      // Toast feedback
      showNotificationToast('Opening mail client...', 'info');
    };

    window.downloadPdf = function() {
      showNotificationToast('Preparing PDF preview...', 'info');
      
      // Record action
      const title = activeType === 'deposit' ? 'Security deposit dispute' : activeType === 'maintenance' ? 'Maintenance request' : activeType === 'termination' ? 'Early termination notice' : 'Illegal clause notice';
      addLetterToDashboard(title + ' (PDF)');

      setTimeout(() => {
        // Use browser print dialog, which is clean and professional for printing/saving PDFs of the A4 page
        window.print();
      }, 500);
    };

    // Helper to render notification toast (since it looks premium!)
    function showNotificationToast(message, type = 'info') {
      let toast = document.getElementById('app-notification-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'app-notification-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '24px';
        toast.style.right = '24px';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '8px';
        toast.style.backgroundColor = '#1e293b';
        toast.style.color = '#fff';
        toast.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)';
        toast.style.zIndex = '9999';
        toast.style.fontFamily = 'var(--font-body)';
        toast.style.fontSize = '14px';
        toast.style.fontWeight = '500';
        toast.style.transition = 'all 0.3s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        document.body.appendChild(toast);
      }
      
      if (type === 'success') {
        toast.style.borderLeft = '4px solid var(--success)';
      } else {
        toast.style.borderLeft = '4px solid var(--brand)';
      }
      
      toast.textContent = message;
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
      
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
      }, 3000);
    }

    // Initial load
    updateLetterText();
  }
});
