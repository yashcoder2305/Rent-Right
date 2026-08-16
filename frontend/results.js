/**
 * RentRight Lease Analysis Results Logic
 * Runs high-fidelity simulation of scanning steps,
 * handles interactive accordions, and manages action notifications.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Dynamic Header Auth Check ---
    const isLoggedIn = !!localStorage.getItem('username');
    if (isLoggedIn) {
        const appHeader = document.querySelector('.app-header');
        if (appHeader) {
            const landingNav = appHeader.querySelector('.landing-nav');
            if (landingNav) {
                landingNav.innerHTML = `
                    <a href="dashboard.html" class="nav-link-landing">Dashboard</a>
                    <a href="analyze.html" class="nav-link-landing">Upload</a>
                    <a href="results.html" class="nav-link-landing active">Results</a>
                    <a href="compare.html" class="nav-link-landing">Compare</a>
                    <a href="#" class="nav-link-landing">History</a>
                    <a href="letter.html" class="nav-link-landing">Generate Letter</a>
                `;
            }
            const landingActions = appHeader.querySelector('.landing-actions');
            if (landingActions) {
                const initials = localStorage.getItem('initials') || 'JD';
                landingActions.innerHTML = `
                    <div class="user-profile-avatar" id="avatarInitials" title="Click to Log Out">${initials}</div>
                `;
                
                const avatarBtn = landingActions.querySelector('#avatarInitials');
                if (avatarBtn) {
                    avatarBtn.addEventListener('click', function() {
                        if (confirm('Are you sure you want to log out?')) {
                            localStorage.clear();
                            window.location.href = 'landing.html';
                        }
                    });
                }
            }
        }
    }

    // DOM Elements - Scanner Section
    const scannerScreen = document.getElementById('scannerScreen');
    const progressPercent = document.getElementById('progressPercent');
    const progressBarFill = document.getElementById('progressBarFill');
    const steps = [
        document.getElementById('step1'),
        document.getElementById('step2'),
        document.getElementById('step3'),
        document.getElementById('step4'),
        document.getElementById('step5')
    ];

    // DOM Elements - Report Card Section
    const resultsReportCard = document.getElementById('resultsReportCard');
    const homeLogoBtn = document.getElementById('homeLogoBtn');

    // Action Buttons
    const btnViewFullReport = document.getElementById('btnViewFullReport');
    const btnDownloadPDF = document.getElementById('btnDownloadPDF');
    const navLegalAid = document.getElementById('navLegalAid');
    const footerLegalAid = document.getElementById('footerLegalAid');
    const toastContainer = document.getElementById('toastContainer');

    // 1. Setup Session Data details
    const country = sessionStorage.getItem('lease_country') || 'United States';
    const region = sessionStorage.getItem('lease_region') || 'Select Region';
    const docName = sessionStorage.getItem('lease_doc_name') || 'lease_agreement.pdf';

    // Populate jurisdiction tags dynamically
    document.querySelectorAll('.juri-text').forEach(el => {
        el.textContent = `${region}, ${country === 'US' ? 'United States' : country === 'CA' ? 'Canada' : country === 'IN' ? 'India' : 'United Kingdom'}`;
    });

    // 2. Toast System
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            `;
        } else {
            iconSvg = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--error-color)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            `;
        }

        toast.innerHTML = `
            <div class="toast-content">
                ${iconSvg}
                <span class="toast-msg">${message}</span>
            </div>
            <button class="toast-close-btn" style="border:none; background:transparent; cursor:pointer; color:#888; font-size:16px;" aria-label="Close message">&times;</button>
        `;

        toastContainer.appendChild(toast);

        const timer = setTimeout(() => dismissToast(toast), 4000);

        toast.querySelector('.toast-close-btn').addEventListener('click', () => {
            clearTimeout(timer);
            dismissToast(toast);
        });
    }

    function dismissToast(toast) {
        toast.style.animation = 'none';
        void toast.offsetWidth;
        toast.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        toast.style.transform = 'translateX(120%)';
        toast.style.opacity = '0';
        toast.addEventListener('transitionend', () => toast.remove());
    }

    // 3. Sequential Scanner Animation
    let progress = 0;
    const totalDuration = 2200; // 2.2 seconds
    const intervalTime = 30; // ms
    const increment = 100 / (totalDuration / intervalTime);

    // Helpers to change checkmarks styling
    function markStepActive(index) {
        if (index < 0 || index >= steps.length) return;
        const spinner = steps[index].querySelector('span:first-child');
        spinner.className = 'status-indicator-spinner';
    }

    function markStepComplete(index) {
        if (index < 0 || index >= steps.length) return;
        const check = steps[index].querySelector('span:first-child');
        check.className = 'status-indicator-complete';
        check.innerHTML = '✓';
    }

    // Initialize first step as loading
    markStepActive(0);

    const progressTimer = setInterval(() => {
        progress += increment;
        if (progress >= 100) {
            progress = 100;
            clearInterval(progressTimer);

            // Mark last step complete
            markStepComplete(4);

            // Wait slightly then transition to the report card
            setTimeout(() => {
                revealReportCard();
            }, 400);
        }

        // Update Progress percentages
        progressPercent.textContent = `${Math.floor(progress)}%`;
        progressBarFill.style.width = `${progress}%`;

        // Checkpoint indicators based on percentage
        if (progress >= 20 && progress < 40) {
            markStepComplete(0);
            markStepActive(1);
        } else if (progress >= 40 && progress < 60) {
            markStepComplete(1);
            markStepActive(2);
        } else if (progress >= 60 && progress < 80) {
            markStepComplete(2);
            markStepActive(3);
        } else if (progress >= 80 && progress < 100) {
            markStepComplete(3);
            markStepActive(4);
        }
    }, intervalTime);

    function revealReportCard() {
        // Fade out scanner screen
        scannerScreen.style.transition = 'all 0.5s ease';
        scannerScreen.style.opacity = '0';
        scannerScreen.style.transform = 'translateY(-20px)';

        // Update dashboard stats if pending
        if (sessionStorage.getItem('scan_pending_addition') === 'true') {
            sessionStorage.removeItem('scan_pending_addition');
            
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
            
            const docName = sessionStorage.getItem('lease_doc_name') || 'lease_agreement.pdf';
            const todayStr = new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            stats.docs_uploaded += 1;
            stats.violations_found += 3; // report has 3 issues
            
            const newRiskScore = 8.0; // 92% compliance score = 8 risk score
            stats.avg_risk_score = parseFloat(((stats.avg_risk_score * (stats.docs_uploaded - 1) + newRiskScore) / stats.docs_uploaded).toFixed(1));
            
            stats.audits.unshift({
                name: docName,
                date: todayStr,
                score: '08/100',
                status: 'Completed',
                level: 'low'
            });
            
            stats.risk_distribution.compliant += 1;
            
            stats.activities.unshift({
                type: 'Lease Approved',
                text: `${docName} successfully audited.`,
                time: 'Just now'
            });
            
            // Increment the last month (Jun)
            stats.compliance_velocity[5] += 1;
            
            localStorage.setItem('rentright_dashboard_stats', JSON.stringify(stats));
            localStorage.setItem('scanned', 'true');
        }

        setTimeout(() => {
            scannerScreen.classList.add('hidden');

            // Fade in results card
            resultsReportCard.classList.remove('hidden');
            resultsReportCard.classList.add('fade-in');

            // Trigger checkmark draw animation
            const checkmark = document.querySelector('.success-checkmark-svg');
            if (checkmark) {
                checkmark.classList.add('draw');
            }

            showToast('AI analysis generated successfully!', 'success');
        }, 500);
    }

    // 4. Issue Cards Accordions Logic
    const issueHeaders = document.querySelectorAll('.issue-header');

    issueHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const card = header.closest('.issue-accordion-card');
            const body = card.querySelector('.issue-body-collapse');
            const arrow = card.querySelector('.toggle-icon-arrow');
            const isExpanded = header.getAttribute('aria-expanded') === 'true';

            // Toggle current state
            header.setAttribute('aria-expanded', !isExpanded);

            if (isExpanded) {
                body.style.maxHeight = null;
                arrow.style.transform = 'rotate(0deg)';
                card.classList.remove('expanded');
            } else {
                body.style.maxHeight = `${body.scrollHeight}px`;
                arrow.style.transform = 'rotate(180deg)';
                card.classList.add('expanded');
            }
        });
    });

    // 5. Button Actions
    homeLogoBtn.addEventListener('click', () => {
        window.location.href = 'landing.html';
    });

    // Modal Elements
    const fullReportModal = document.getElementById('fullReportModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnModalClose = document.getElementById('btnModalClose');
    const btnModalDownloadPDF = document.getElementById('btnModalDownloadPDF');
    const modalDocName = document.getElementById('modalDocName');
    const modalScanDate = document.getElementById('modalScanDate');
    const modalIssuesList = document.getElementById('modalIssuesList');

    // Populate Modal Metadata
    if (modalDocName) modalDocName.textContent = docName;
    if (modalScanDate) {
        const today = new Date();
        modalScanDate.textContent = today.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Populate Modal Issues by cloning and binding
    function populateModalIssues() {
        if (!modalIssuesList) return;
        modalIssuesList.innerHTML = '';
        const mainIssues = document.querySelectorAll('.issues-list .issue-accordion-card');

        mainIssues.forEach(card => {
            const clone = card.cloneNode(true);
            modalIssuesList.appendChild(clone);

            // Re-bind accordion toggle for the cloned card
            const header = clone.querySelector('.issue-header');
            const body = clone.querySelector('.issue-body-collapse');
            const arrow = clone.querySelector('.toggle-icon-arrow');

            header.addEventListener('click', () => {
                const isExpanded = header.getAttribute('aria-expanded') === 'true';
                header.setAttribute('aria-expanded', !isExpanded);

                if (isExpanded) {
                    body.style.maxHeight = null;
                    arrow.style.transform = 'rotate(0deg)';
                    clone.classList.remove('expanded');
                } else {
                    body.style.maxHeight = `${body.scrollHeight}px`;
                    arrow.style.transform = 'rotate(180deg)';
                    clone.classList.add('expanded');
                }
            });
        });
    }

    // Modal Visibility Functions
    function openModal() {
        populateModalIssues();
        fullReportModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Disable page scrolling
        // Focus close button inside modal
        setTimeout(() => btnCloseModal.focus(), 100);

        // Trap focus
        document.addEventListener('keydown', trapFocus);
        showToast('Full compliance report opened.', 'success');
    }

    function closeModal() {
        fullReportModal.classList.add('hidden');
        document.body.style.overflow = ''; // Restore page scrolling
        btnViewFullReport.focus();
        document.removeEventListener('keydown', trapFocus);
    }

    // Focus Trap function for modal accessibility
    function trapFocus(e) {
        if (e.key === 'Escape') {
            closeModal();
            return;
        }
        if (e.key !== 'Tab') return;

        const focusables = fullReportModal.querySelectorAll('button, [tabindex="0"], a');
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === first) {
                last.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === last) {
                first.focus();
                e.preventDefault();
            }
        }
    }

    // Modal Close Triggers
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnModalClose) btnModalClose.addEventListener('click', closeModal);
    if (fullReportModal) {
        fullReportModal.addEventListener('click', (e) => {
            if (e.target === fullReportModal) {
                closeModal();
            }
        });
    }

    btnViewFullReport.addEventListener('click', openModal);

    // Compliant Accordions Logic inside Modal
    const compliantHeaders = document.querySelectorAll('.compliant-header');
    compliantHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const card = header.closest('.compliant-card');
            const body = card.querySelector('.compliant-body-collapse');
            const arrow = card.querySelector('.toggle-icon-arrow');
            const isExpanded = header.getAttribute('aria-expanded') === 'true';

            header.setAttribute('aria-expanded', !isExpanded);

            if (isExpanded) {
                body.style.maxHeight = null;
                arrow.style.transform = 'rotate(0deg)';
                card.classList.remove('expanded');
            } else {
                body.style.maxHeight = `${body.scrollHeight}px`;
                arrow.style.transform = 'rotate(180deg)';
                card.classList.add('expanded');
            }
        });
    });

    // 6. PDF Generation Compiler
    function generatePDFReport() {
        showToast('Generating PDF Report... Please wait.', 'success');

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');

        const scanDateStr = new Date().toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Styling helpers
        const primaryColor = [26, 53, 204]; // #1a35cc
        const darkText = [15, 23, 42]; // #0f172a
        const mutedText = [71, 85, 105]; // #475569
        const warningColor = [180, 83, 9]; // #b45309 (Medium risk amber)
        const dangerColor = [185, 28, 28]; // #b91c1c (High priority red)
        const successColor = [22, 163, 74]; // #16a34a (Green)

        let y = 20;

        // Page limit check & pagination
        function checkPageBreak(neededHeight) {
            if (y + neededHeight > 275) {
                doc.addPage();
                y = 20;
                // Add header border to secondary pages
                doc.setDrawColor(226, 232, 240);
                doc.line(15, 10, 195, 10);
                return true;
            }
            return false;
        }

        // Draw PDF Title & Logo Header
        doc.setFillColor(...primaryColor);
        doc.rect(15, y, 10, 10, 'F'); // Logo Square

        doc.setTextColor(...darkText);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('RentRight', 28, y + 8);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...mutedText);
        doc.text('Tenant Rights Advocacy & Lease Compliance Assessment', 28, y + 13);

        y += 20;

        // Metadata box
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, 180, 26, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(15, y, 180, 26, 'S');

        doc.setTextColor(...darkText);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Lease Document:', 20, y + 8);
        doc.setFont('Helvetica', 'normal');
        doc.text(docName, 55, y + 8);

        doc.setFont('Helvetica', 'bold');
        doc.text('Jurisdiction:', 20, y + 14);
        doc.setFont('Helvetica', 'normal');
        doc.text(`${region}, ${country === 'US' ? 'United States' : country === 'CA' ? 'Canada' : country === 'IN' ? 'India' : 'United Kingdom'}`, 55, y + 14);

        doc.setFont('Helvetica', 'bold');
        doc.text('Scan Date:', 20, y + 20);
        doc.setFont('Helvetica', 'normal');
        doc.text(scanDateStr, 55, y + 20);

        y += 34;

        // Summary Stats Cards (2 Columns or Grid-like)
        doc.setFillColor(240, 249, 255); // light blue
        doc.rect(15, y, 85, 20, 'F');
        doc.setDrawColor(186, 230, 253);
        doc.rect(15, y, 85, 20, 'S');

        doc.setTextColor(...primaryColor);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('92% Compliance', 20, y + 8);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...mutedText);
        doc.text('Satisfactory lease parameters', 20, y + 14);

        doc.setFillColor(240, 253, 244); // light green
        doc.rect(110, y, 85, 20, 'F');
        doc.setDrawColor(220, 252, 231);
        doc.rect(110, y, 85, 20, 'S');

        doc.setTextColor(...successColor);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Low Risk Level', 115, y + 8);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...mutedText);
        doc.text('Highly standard and protective terms', 115, y + 14);

        y += 28;

        // Executive Summary
        doc.setTextColor(...darkText);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('AI Analysis Executive Summary', 15, y);
        y += 5;
        doc.setFont('Helvetica', 'oblique');
        doc.setFontSize(10.5);
        doc.setTextColor(...mutedText);
        const execSummaryLines = doc.splitTextToSize('"This lease is generally compliant with tenant protection guidelines. However, several clauses should be reviewed carefully before signing."', 170);
        doc.text(execSummaryLines, 15, y);
        y += execSummaryLines.length * 5 + 8;

        // Identified Issues Title
        doc.setTextColor(...darkText);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('Identified Issues Requiring Attention (3)', 15, y);
        doc.setDrawColor(226, 232, 240);
        doc.line(15, y + 2, 195, y + 2);
        y += 10;

        // Issue 1: Maintenance Clause (High Priority)
        checkPageBreak(40);
        doc.setFillColor(254, 242, 242); // light red
        doc.rect(15, y, 180, 36, 'F');
        doc.setDrawColor(254, 226, 226);
        doc.rect(15, y, 180, 36, 'S');

        doc.setTextColor(...dangerColor);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text('[HIGH PRIORITY] Maintenance Responsibility Clause', 20, y + 7);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(...darkText);
        const issue1Desc = doc.splitTextToSize('Clause 9 states that the tenant is responsible for repairs to major utility infrastructure under $250 and waives landlord liability for hot water outages.', 170);
        doc.text(issue1Desc, 20, y + 14);

        doc.setTextColor(...dangerColor);
        doc.setFont('Helvetica', 'bold');
        doc.text('Recommendation:', 20, y + 24);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(...mutedText);
        const issue1Rec = doc.splitTextToSize('This violates the unwaivable Warranty of Habitability. Request removal of this clause.', 170);
        doc.text(issue1Rec, 50, y + 24);

        y += 44;

        // Issue 2: Security Deposit (Medium Risk)
        checkPageBreak(40);
        doc.setFillColor(255, 251, 235); // light amber
        doc.rect(15, y, 180, 36, 'F');
        doc.setDrawColor(254, 243, 199);
        doc.rect(15, y, 180, 36, 'S');

        doc.setTextColor(...warningColor);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text('[MEDIUM RISK] Security Deposit Clause', 20, y + 7);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(...darkText);
        const issue2Desc = doc.splitTextToSize('The lease charges $3,500 security deposit on $1,500 rent, which represents 2.3 months of rent.', 170);
        doc.text(issue2Desc, 20, y + 14);

        doc.setTextColor(...warningColor);
        doc.setFont('Helvetica', 'bold');
        doc.text('Recommendation:', 20, y + 24);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(...mutedText);
        const issue2Rec = doc.splitTextToSize('State laws often cap security deposits at 2 months maximum ($3,000). Request reduction.', 170);
        doc.text(issue2Rec, 50, y + 24);

        y += 44;

        // Issue 3: Early Termination (Medium Risk)
        checkPageBreak(40);
        doc.setFillColor(255, 251, 235); // light amber
        doc.rect(15, y, 180, 36, 'F');
        doc.setDrawColor(254, 243, 199);
        doc.rect(15, y, 180, 36, 'S');

        doc.setTextColor(...warningColor);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text('[MEDIUM RISK] Early Termination Clause', 20, y + 7);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(...darkText);
        const issue3Desc = doc.splitTextToSize('Section 14 requires a 90-day early termination notice and a penalty of 3 months rent.', 170);
        doc.text(issue3Desc, 20, y + 14);

        doc.setTextColor(...warningColor);
        doc.setFont('Helvetica', 'bold');
        doc.text('Recommendation:', 20, y + 24);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(...mutedText);
        const issue3Rec = doc.splitTextToSize('Request reduction of notice to 60 days and cap penalty fees at 2 months maximum.', 170);
        doc.text(issue3Rec, 50, y + 24);

        y += 50;

        // Compliant Section
        checkPageBreak(60);
        doc.setTextColor(...darkText);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('Compliant Parameters (39 Clauses)', 15, y);
        doc.setDrawColor(226, 232, 240);
        doc.line(15, y + 2, 195, y + 2);
        y += 10;

        const compliantCats = [
            { title: 'Landlord Entry & Privacy', desc: 'Lease correctly requires a standard 24-hour advance entry notice.' },
            { title: 'Rent Payment & Grace Period', desc: 'Grace periods and late payment fees match local legal limits.' },
            { title: 'Pet & Guest Occupancy', desc: 'Fair, standard guidelines for guests and domestic animals.' },
            { title: 'Utilities Allocation', desc: 'Trash, sewage, and water duties are allocated fairly.' },
            { title: 'Subleasing Provisions', desc: 'Allows subletting with standard, reasonable landlord consent.' }
        ];

        compliantCats.forEach(cat => {
            checkPageBreak(15);
            doc.setTextColor(...successColor);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(`[OK] ${cat.title}`, 20, y);
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.setTextColor(...mutedText);
            doc.text(cat.desc, 25, y + 5);
            y += 12;
        });

        // Add Footer on all pages
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setDrawColor(226, 232, 240);
            doc.line(15, 280, 195, 280);

            doc.setTextColor(...mutedText);
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8);
            doc.text('RentRight Lease Compliance Assessment. Generated by RentRight AI Agent.', 15, 285);
            doc.text(`Page ${i} of ${pageCount}`, 180, 285);
        }

        doc.save(`RentRight_Report_${docName.replace(/\.[^/.]+$/, "")}.pdf`);
        showToast('PDF downloaded successfully!', 'success');
    }

    btnDownloadPDF.addEventListener('click', generatePDFReport);
    btnModalDownloadPDF.addEventListener('click', generatePDFReport);

    // Share Menu Logic
    const btnShareReport = document.getElementById('btnShareReport');
    const shareMenu = document.getElementById('shareMenu');
    const shareWhatsApp = document.getElementById('shareWhatsApp');
    const shareEmail = document.getElementById('shareEmail');
    const shareCopyLink = document.getElementById('shareCopyLink');

    if (btnShareReport && shareMenu) {
        btnShareReport.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = shareMenu.classList.contains('visible');
            if (isVisible) {
                shareMenu.classList.remove('visible');
                shareMenu.classList.add('hidden');
                btnShareReport.setAttribute('aria-expanded', 'false');
            } else {
                shareMenu.classList.remove('hidden');
                shareMenu.classList.add('visible');
                btnShareReport.setAttribute('aria-expanded', 'true');
            }
        });

        // Hide when clicking outside
        document.addEventListener('click', (e) => {
            if (!shareMenu.contains(e.target) && e.target !== btnShareReport) {
                shareMenu.classList.remove('visible');
                shareMenu.classList.add('hidden');
                btnShareReport.setAttribute('aria-expanded', 'false');
            }
        });

        // Set share link parameters
        const shareText = `Hey! I just scanned my lease document using RentRight's AI lease analyzer. It received a 92% Compliance Score with low risk! Check out RentRight here: ${window.location.origin}/landing.html`;

        if (shareWhatsApp) {
            shareWhatsApp.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        }

        if (shareEmail) {
            const emailSubject = `Lease Compliance Report - RentRight`;
            const emailBody = `Hey,\n\nI used RentRight's AI lease analyzer to review my lease. The compliance score was 92% (Low Risk).\n\nYou can scan your lease at RentRight: ${window.location.origin}/landing.html`;
            shareEmail.href = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        }

        if (shareCopyLink) {
            shareCopyLink.addEventListener('click', (e) => {
                e.preventDefault();
                const dummyUrl = `${window.location.origin}/landing.html`;
                navigator.clipboard.writeText(dummyUrl).then(() => {
                    showToast('Share link copied to clipboard!', 'success');
                    shareMenu.classList.remove('visible');
                    shareMenu.classList.add('hidden');
                    btnShareReport.setAttribute('aria-expanded', 'false');
                }).catch(err => {
                    showToast('Failed to copy link.', 'error');
                });
            });
        }
    }

    // Legal Aid Links
    const handleLegalAid = (e) => {
        e.preventDefault();
        showToast('Connecting to your local Tenant Advocacy & Legal Aid clinic...', 'success');
    };
    if (navLegalAid) navLegalAid.addEventListener('click', handleLegalAid);
    if (footerLegalAid) footerLegalAid.addEventListener('click', handleLegalAid);
});
