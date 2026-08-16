/**
 * RentRight Lease Analysis Tool Logic
 * Minimal upload page logic with drag-and-drop file upload,
 * file validation, loading animations, and results redirection.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Session Verification ---
    const isLoggedIn = !!localStorage.getItem('username');
    if (!isLoggedIn) {
        window.location.href = 'index.html';
        return;
    }

    // --- Initials & Profile Setup ---
    const avatarInitials = document.getElementById('avatarInitials');
    const savedInitials = localStorage.getItem('initials') || 'JD';
    if (avatarInitials) {
        avatarInitials.textContent = savedInitials;
        avatarInitials.addEventListener('click', () => {
            if (confirm('Are you sure you want to log out?')) {
                localStorage.clear();
                window.location.href = 'landing.html';
            }
        });
    }

    // --- Header Actions ---
    const btnNotif = document.getElementById('btnNotif');
    if (btnNotif) {
        btnNotif.addEventListener('click', () => {
            showToast('You have no new notifications.', 'success');
        });
    }

    const btnSettings = document.getElementById('btnSettings');
    if (btnSettings) {
        btnSettings.addEventListener('click', () => {
            showToast('Settings window coming soon.', 'success');
        });
    }

    // --- State management ---
    let selectedFile = null;

    // --- DOM Elements ---
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    
    const fileDetails = document.getElementById('fileDetails');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const fileSizeDisplay = document.getElementById('fileSizeDisplay');
    const removeFileBtn = document.getElementById('removeFileBtn');
    
    const scanBtn = document.getElementById('scanBtn');
    const toastContainer = document.getElementById('toastContainer');

    // --- Toast Notification Manager ---
    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer') || toastContainer;
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
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

        container.appendChild(toast);

        const removeTimer = setTimeout(() => {
            dismissToast(toast);
        }, 4000);

        toast.querySelector('.toast-close-btn').addEventListener('click', () => {
            clearTimeout(removeTimer);
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

    // --- File Import from Landing page ---
    const pendingName = sessionStorage.getItem('pending_file_name');
    const pendingSize = sessionStorage.getItem('pending_file_size');

    if (pendingName && pendingSize) {
        selectedFile = {
            name: pendingName,
            size: parseInt(pendingSize)
        };
        if (fileNameDisplay) fileNameDisplay.textContent = pendingName;
        if (fileSizeDisplay) fileSizeDisplay.textContent = formatBytes(selectedFile.size);
        
        if (dropzone) dropzone.style.display = 'none';
        if (fileDetails) {
            fileDetails.classList.remove('hidden');
            fileDetails.style.display = 'block';
        }
        
        sessionStorage.removeItem('pending_file_name');
        sessionStorage.removeItem('pending_file_size');
        
        setTimeout(() => {
            showToast('Lease file loaded from home page!', 'success');
        }, 200);
    }

    // --- File Drag & Drop Handlers ---
    if (dropzone) {
        // Trigger file input click when clicking anywhere on dropzone EXCEPT the browse button
        dropzone.addEventListener('click', (e) => {
            if (e.target !== browseBtn) {
                fileInput.click();
            }
        });

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = '#2563eb';
            dropzone.style.backgroundColor = '#eff6ff';
        });

        dropzone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = '#2563eb';
            dropzone.style.backgroundColor = '#eff6ff';
        });

        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = '#cbd5e1';
            dropzone.style.backgroundColor = '#fafbfe';
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = '#cbd5e1';
            dropzone.style.backgroundColor = '#fafbfe';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                processFile(files[0]);
            }
        });
    }

    if (browseBtn && fileInput) {
        browseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                processFile(e.target.files[0]);
            }
        });
    }

    // --- File Validation and Processing ---
    function processFile(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext !== 'pdf' && ext !== 'docx') {
            showToast('Invalid file format. Please upload PDF or DOCX.', 'error');
            return;
        }

        const maxSize = 20 * 1024 * 1024; // 20 MB
        if (file.size > maxSize) {
            showToast('File size exceeds 20MB limit.', 'error');
            return;
        }

        selectedFile = file;
        
        // Show file details UI
        if (fileNameDisplay) fileNameDisplay.textContent = file.name;
        if (fileSizeDisplay) fileSizeDisplay.textContent = formatBytes(file.size);
        
        if (dropzone) dropzone.style.display = 'none';
        if (fileDetails) {
            fileDetails.classList.remove('hidden');
            fileDetails.style.display = 'block';
        }
        
        showToast('File loaded successfully!', 'success');
    }

    // Helper: format file bytes
    function formatBytes(bytes, decimals = 1) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Remove file button
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedFile = null;
            if (fileInput) fileInput.value = ''; // Reset file input
            if (fileDetails) fileDetails.style.display = 'none';
            if (dropzone) dropzone.style.display = 'block';
            showToast('File removed.', 'info');
        });
    }

    // --- Form Submission & Scanning Loading Effect ---
    if (scanBtn) {
        scanBtn.addEventListener('click', (e) => {
            e.preventDefault();

            if (!selectedFile) {
                showToast('Please upload a lease document before scanning.', 'error');
                return;
            }

            // Animate Scan Button to Loading State
            scanBtn.disabled = true;
            scanBtn.innerHTML = `
                <span class="spinner" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;"></span>
                <span>Preparing Lease Analysis...</span>
            `;
            
            // Save scan metadata in session storage for the results page to pick up
            sessionStorage.setItem('scan_pending_addition', 'true');
            sessionStorage.setItem('lease_source_type', 'upload');
            sessionStorage.setItem('lease_country', 'US');
            sessionStorage.setItem('lease_region', 'California');
            sessionStorage.setItem('lease_doc_name', selectedFile.name);
            sessionStorage.setItem('lease_doc_size', formatBytes(selectedFile.size));
            localStorage.setItem('scanned', 'true');

            // Add a smooth transition effect
            const card = document.getElementById('analyzeCard');
            if (card) {
                card.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                card.style.opacity = '0.5';
                card.style.transform = 'scale(0.98)';
            }

            showToast('Uploading lease agreement to secure AI analyzer...', 'success');

            // Redirect to results page after 1.2s delay
            setTimeout(() => {
                window.location.href = 'results.html';
            }, 1200);
        });
    }
});
