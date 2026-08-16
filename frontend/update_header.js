const fs = require('fs');
const path = require('path');

const files = ['dashboard.html', 'analyze.html', 'results.html', 'compare.html', 'history.html', 'letter.html', 'landing.html'];

const headerTemplate = `    <header class="landing-header">
        <div class="header-logo" style="cursor: pointer;" onclick="window.location.href='landing.html'">
            <!-- Modern Building SVG Icon -->
            <svg class="header-logo-svg" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
                <line x1="15" y1="3" x2="15" y2="21"></line>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="3" y1="15" x2="21" y2="15"></line>
            </svg>
            <span class="header-brand-text-dark font-outfit">RentRight</span>
        </div>
        <nav class="landing-nav">
            <a href="dashboard.html" class="nav-link-landing{DASHBOARD_ACTIVE}">Dashboard</a>
            <a href="analyze.html" class="nav-link-landing{UPLOAD_ACTIVE}">Upload</a>
            <a href="results.html" class="nav-link-landing{RESULTS_ACTIVE}">Results</a>
            <a href="compare.html" class="nav-link-landing{COMPARE_ACTIVE}">Compare</a>
            <a href="history.html" class="nav-link-landing{HISTORY_ACTIVE}">History</a>
            <a href="letter.html" class="nav-link-landing{LETTER_ACTIVE}">Generate Letter</a>
        </nav>
        <div class="landing-actions">
            <!-- Notification Bell Icon -->
            <button class="nav-icon-btn" aria-label="Notifications" id="btnNotif">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
            </button>
            <!-- Settings Gear Icon -->
            <button class="nav-icon-btn" aria-label="Settings" id="btnSettings">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
            </button>
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User Profile" class="user-profile-avatar" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid #e2e8f0; cursor: pointer;">
        </div>
    </header>`;

files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) return;
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace the entire <header class="landing-header"> block
    // We use a regular expression to match from <header class="landing-header"> to </header>
    const headerRegex = /<header class="landing-header">[\s\S]*?<\/header>/g;
    
    // Determine which link is active based on filename
    let headerStr = headerTemplate;
    headerStr = headerStr.replace('{DASHBOARD_ACTIVE}', file === 'dashboard.html' ? ' active' : '');
    headerStr = headerStr.replace('{UPLOAD_ACTIVE}', file === 'analyze.html' ? ' active' : '');
    headerStr = headerStr.replace('{RESULTS_ACTIVE}', file === 'results.html' ? ' active' : '');
    headerStr = headerStr.replace('{COMPARE_ACTIVE}', file === 'compare.html' ? ' active' : '');
    headerStr = headerStr.replace('{HISTORY_ACTIVE}', file === 'history.html' ? ' active' : '');
    headerStr = headerStr.replace('{LETTER_ACTIVE}', file === 'letter.html' ? ' active' : '');
    
    content = content.replace(headerRegex, headerStr);
    
    fs.writeFileSync(fullPath, content);
    console.log('Updated', file);
});
