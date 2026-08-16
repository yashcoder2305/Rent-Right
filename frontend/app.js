/**
 * RentRight Login & Signup Interactive Logic
 * Premium, interactive states, custom inline validations, and toast notifications.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Auto-redirect if already logged in (for login and signup pages)
    const isLoggedIn = !!localStorage.getItem('username');
    if (isLoggedIn) {
        if (document.getElementById('loginForm') || document.getElementById('signupForm')) {
            window.location.href = 'dashboard.html';
            return;
        }
    }

    // 1. Toast Notification Manager (Global helper)
    window.showToast = function(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
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
            <button class="toast-close-btn" aria-label="Close message">&times;</button>
        `;

        container.appendChild(toast);

        const removeTimer = setTimeout(() => {
            dismissToast(toast);
        }, 4500);

        const closeBtn = toast.querySelector('.toast-close-btn');
        closeBtn.addEventListener('click', () => {
            clearTimeout(removeTimer);
            dismissToast(toast);
        });
    };

    function dismissToast(toast) {
        toast.style.animation = 'none';
        void toast.offsetWidth;
        toast.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        toast.style.transform = 'translateX(120%)';
        toast.style.opacity = '0';
        
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }

    // Help Action Support
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            showToast('Need help? Contact Tenant Support at support@rentright.org', 'success');
        });
    }

    // Validation Helpers
    function isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Reset error visuals
    function clearError(inputElement, errorElement) {
        if (!inputElement || !errorElement) return;
        inputElement.classList.remove('shake-animation');
        errorElement.textContent = '';
        errorElement.classList.remove('visible');
    }

    // Show errors with shaking transition
    function triggerError(inputElement, errorElement, message) {
        if (!inputElement || !errorElement) return;
        errorElement.textContent = message;
        errorElement.classList.add('visible');
        inputElement.classList.remove('shake-animation');
        
        // Force reflow to restart css animation
        void inputElement.offsetWidth;
        inputElement.classList.add('shake-animation');
    }

    // ==========================================
    // A. LOGIN PAGE FUNCTIONALITY
    // ==========================================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const emailInput = document.getElementById('emailInput');
        const passwordInput = document.getElementById('passwordInput');
        const rememberCheckbox = document.getElementById('rememberCheckbox');
        const togglePasswordBtn = document.getElementById('togglePassword');
        const eyeOpenSvg = togglePasswordBtn?.querySelector('.eye-open');
        const eyeClosedSvg = togglePasswordBtn?.querySelector('.eye-closed');
        const loginBtn = document.getElementById('loginBtn');
        const btnText = loginBtn?.querySelector('.btn-text');
        const btnArrow = loginBtn?.querySelector('.btn-arrow-svg');
        const btnSpinner = document.getElementById('btnSpinner');

        const emailError = document.getElementById('emailError');
        const passwordError = document.getElementById('passwordError');

        // Load remembered email
        const storedEmail = localStorage.getItem('rentright_remembered_email');
        if (storedEmail && emailInput && rememberCheckbox) {
            emailInput.value = storedEmail;
            rememberCheckbox.checked = true;
        }

        // Password View Toggle
        if (togglePasswordBtn && passwordInput && eyeOpenSvg && eyeClosedSvg) {
            togglePasswordBtn.addEventListener('click', () => {
                const isPassword = passwordInput.getAttribute('type') === 'password';
                if (isPassword) {
                    passwordInput.setAttribute('type', 'text');
                    eyeOpenSvg.style.display = 'none';
                    eyeClosedSvg.style.display = 'block';
                    togglePasswordBtn.setAttribute('aria-label', 'Hide password');
                } else {
                    passwordInput.setAttribute('type', 'password');
                    eyeOpenSvg.style.display = 'block';
                    eyeClosedSvg.style.display = 'none';
                    togglePasswordBtn.setAttribute('aria-label', 'Show password');
                }
            });
        }

        // Dynamic checks on input
        emailInput?.addEventListener('input', () => {
            if (emailInput.value.trim() !== '') clearError(emailInput, emailError);
        });

        passwordInput?.addEventListener('input', () => {
            if (passwordInput.value.trim() !== '') clearError(passwordInput, passwordError);
        });

        // Blur checks
        emailInput?.addEventListener('blur', () => {
            const val = emailInput.value.trim();
            if (val === '') {
                triggerError(emailInput, emailError, 'Email address is required.');
            } else if (!isValidEmail(val)) {
                triggerError(emailInput, emailError, 'Please enter a valid email address.');
            } else {
                clearError(emailInput, emailError);
            }
        });

        passwordInput?.addEventListener('blur', () => {
            const val = passwordInput.value.trim();
            if (val === '') {
                triggerError(passwordInput, passwordError, 'Password is required.');
            } else if (val.length < 6) {
                triggerError(passwordInput, passwordError, 'Password must be at least 6 characters.');
            } else {
                clearError(passwordInput, passwordError);
            }
        });

        // Submit Action
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const emailVal = emailInput.value.trim();
            const passwordVal = passwordInput.value.trim();
            let hasError = false;

            if (emailVal === '') {
                triggerError(emailInput, emailError, 'Email address is required.');
                hasError = true;
            } else if (!isValidEmail(emailVal)) {
                triggerError(emailInput, emailError, 'Please enter a valid email address.');
                hasError = true;
            }

            if (passwordVal === '') {
                triggerError(passwordInput, passwordError, 'Password is required.');
                hasError = true;
            } else if (passwordVal.length < 6) {
                triggerError(passwordInput, passwordError, 'Password must be at least 6 characters.');
                hasError = true;
            }

            if (hasError) {
                if (emailVal === '' || !isValidEmail(emailVal)) {
                    emailInput.focus();
                } else {
                    passwordInput.focus();
                }
                return;
            }

            // Spinner animation
            if (loginBtn && btnText && btnSpinner) {
                loginBtn.disabled = true;
                btnText.textContent = '';
                if (btnArrow) btnArrow.style.display = 'none';
                btnSpinner.style.display = 'block';
            }

            if (rememberCheckbox) {
                if (rememberCheckbox.checked) {
                    localStorage.setItem('rentright_remembered_email', emailVal);
                } else {
                    localStorage.removeItem('rentright_remembered_email');
                }
            }

            setTimeout(() => {
                if (loginBtn && btnText && btnSpinner) {
                    loginBtn.disabled = false;
                    btnText.textContent = 'Login';
                    if (btnArrow) btnArrow.style.display = 'inline-block';
                    btnSpinner.style.display = 'none';
                }

                if (emailVal === 'fail@example.com') {
                    showToast('Incorrect email or password. Please try again.', 'error');
                    triggerError(passwordInput, passwordError, 'Verification failed.');
                    passwordInput.focus();
                } else {
                    // Extract name/initials from email input
                    let namePart = emailVal.split('@')[0];
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
                    localStorage.setItem('username', username);
                    localStorage.setItem('fullname', fullname);
                    localStorage.setItem('initials', initials);
                    localStorage.setItem('scanned', 'false'); // Initialize scan status

                    showToast('Welcome back! Redirecting to your dashboard...', 'success');
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1200);
                }
            }, 1500);
        });
    }

    // ==========================================
    // B. SIGNUP PAGE FUNCTIONALITY
    // ==========================================
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        const nameInput = document.getElementById('nameInput');
        const emailInput = document.getElementById('emailInput');
        const passwordInput = document.getElementById('passwordInput');
        const confirmInput = document.getElementById('confirmInput');
        const signupBtn = document.getElementById('signupBtn');
        const btnText = signupBtn?.querySelector('.btn-text');
        const btnArrow = signupBtn?.querySelector('.btn-arrow-svg');
        const btnSpinner = document.getElementById('btnSpinner');

        const nameError = document.getElementById('nameError');
        const emailError = document.getElementById('emailError');
        const passwordError = document.getElementById('passwordError');
        const confirmError = document.getElementById('confirmError');

        // Dynamic typing clearing
        nameInput?.addEventListener('input', () => {
            if (nameInput.value.trim() !== '') clearError(nameInput, nameError);
        });
        emailInput?.addEventListener('input', () => {
            if (emailInput.value.trim() !== '') clearError(emailInput, emailError);
        });
        passwordInput?.addEventListener('input', () => {
            if (passwordInput.value.trim() !== '') clearError(passwordInput, passwordError);
        });
        confirmInput?.addEventListener('input', () => {
            if (confirmInput.value.trim() !== '') clearError(confirmInput, confirmError);
        });

        // Blur validations
        nameInput?.addEventListener('blur', () => {
            if (nameInput.value.trim() === '') {
                triggerError(nameInput, nameError, 'Full Name is required.');
            } else {
                clearError(nameInput, nameError);
            }
        });

        emailInput?.addEventListener('blur', () => {
            const val = emailInput.value.trim();
            if (val === '') {
                triggerError(emailInput, emailError, 'Email address is required.');
            } else if (!isValidEmail(val)) {
                triggerError(emailInput, emailError, 'Please enter a valid email address.');
            } else {
                clearError(emailInput, emailError);
            }
        });

        passwordInput?.addEventListener('blur', () => {
            const val = passwordInput.value.trim();
            if (val === '') {
                triggerError(passwordInput, passwordError, 'Password is required.');
            } else if (val.length < 6) {
                triggerError(passwordInput, passwordError, 'Password must be at least 6 characters.');
            } else {
                clearError(passwordInput, passwordError);
            }
        });

        confirmInput?.addEventListener('blur', () => {
            const confirmVal = confirmInput.value.trim();
            const passwordVal = passwordInput.value.trim();
            if (confirmVal === '') {
                triggerError(confirmInput, confirmError, 'Please confirm your password.');
            } else if (confirmVal !== passwordVal) {
                triggerError(confirmInput, confirmError, 'Passwords do not match.');
            } else {
                clearError(confirmInput, confirmError);
            }
        });

        // Submit signup form
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const nameVal = nameInput.value.trim();
            const emailVal = emailInput.value.trim();
            const passwordVal = passwordInput.value.trim();
            const confirmVal = confirmInput.value.trim();
            let hasError = false;

            if (nameVal === '') {
                triggerError(nameInput, nameError, 'Full Name is required.');
                hasError = true;
            }

            if (emailVal === '') {
                triggerError(emailInput, emailError, 'Email address is required.');
                hasError = true;
            } else if (!isValidEmail(emailVal)) {
                triggerError(emailInput, emailError, 'Please enter a valid email address.');
                hasError = true;
            }

            if (passwordVal === '') {
                triggerError(passwordInput, passwordError, 'Password is required.');
                hasError = true;
            } else if (passwordVal.length < 6) {
                triggerError(passwordInput, passwordError, 'Password must be at least 6 characters.');
                hasError = true;
            }

            if (confirmVal === '') {
                triggerError(confirmInput, confirmError, 'Please confirm your password.');
                hasError = true;
            } else if (confirmVal !== passwordVal) {
                triggerError(confirmInput, confirmError, 'Passwords do not match.');
                hasError = true;
            }

            if (hasError) {
                // Focus first error field
                if (nameVal === '') nameInput.focus();
                else if (emailVal === '' || !isValidEmail(emailVal)) emailInput.focus();
                else if (passwordVal === '' || passwordVal.length < 6) passwordInput.focus();
                else confirmInput.focus();
                return;
            }

            // Spinner state
            if (signupBtn && btnText && btnSpinner) {
                signupBtn.disabled = true;
                btnText.textContent = '';
                if (btnArrow) btnArrow.style.display = 'none';
                btnSpinner.style.display = 'block';
            }

            // Mock database API check (1.5 seconds)
            setTimeout(() => {
                if (signupBtn && btnText && btnSpinner) {
                    signupBtn.disabled = false;
                    btnText.textContent = 'Create account';
                    if (btnArrow) btnArrow.style.display = 'inline-block';
                    btnSpinner.style.display = 'none';
                }

                if (emailVal === 'exist@example.com') {
                    showToast('An account with this email already exists.', 'error');
                    triggerError(emailInput, emailError, 'Email already registered.');
                    emailInput.focus();
                } else {
                    // Extract name/initials from name input
                    let parts = nameVal.split(/\s+/);
                    let username = 'Jane';
                    let fullname = nameVal;
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
                    localStorage.setItem('fullname', fullname);
                    localStorage.setItem('initials', initials);
                    localStorage.setItem('scanned', 'false'); // Initialize scan status

                    showToast('Account created successfully! Redirecting to your dashboard...', 'success');
                    
                    // Auto redirect to dashboard page after delay
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                }
            }, 1500);
        });
    }
});
