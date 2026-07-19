// Handle Form Switching
function switchPanel(panelId) {
    document.querySelectorAll('.form-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(panelId).classList.add('active');
    
    // Clear global messages when switching
    const globalMessage = document.getElementById('globalMessage');
    if (globalMessage) globalMessage.style.display = 'none';
}

function showGlobalMessage(msg, type) {
    const globalMessage = document.getElementById('globalMessage');
    if (!globalMessage) return;
    
    globalMessage.textContent = msg;
    globalMessage.style.display = 'block';
    if (type === 'error') {
        globalMessage.style.background = 'rgba(239, 68, 68, 0.1)';
        globalMessage.style.color = 'var(--danger-color)';
    } else {
        globalMessage.style.background = 'rgba(16, 185, 129, 0.1)';
        globalMessage.style.color = 'var(--success-color)';
    }
}

// Handle Role Tab Switching
function selectRole(role) {
    document.querySelectorAll('.login-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTab = document.querySelector(`.login-tab[data-role="${role}"]`);
    if(activeTab) {
        activeTab.classList.add('active');
    }
    document.getElementById('loginRole').value = role;
}

(() => {
    // Check if already logged in
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    if (token) {
        if (storedRole === 'admin') {
            window.location.href = '/admin/dashboard/index.html';
        } else {
            window.location.href = '/dashboard.html';
        }
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const forgotForm = document.getElementById('forgotForm');

    // Login Handling
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const role = document.getElementById('loginRole').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
                showGlobalMessage('', 'success'); // Clear
                document.getElementById('globalMessage').style.display = 'none';

                const data = await authAPI.login(email, password, role);
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('role', role);
                if (role === 'admin') {
                    window.location.href = '/admin/dashboard/index.html';
                } else {
                    window.location.href = '/dashboard.html';
                }
            } catch (error) {
                showGlobalMessage(error.message, 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Sign In';
            }
        });
    }

    // Forgot Password Handling
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgotEmail').value;
            const role = document.getElementById('forgotRole').value;
            const submitBtn = forgotForm.querySelector('button[type="submit"]');

            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                document.getElementById('globalMessage').style.display = 'none';

                const res = await authAPI.forgotPassword(email, role);
                showGlobalMessage(res.msg, 'success');
                forgotForm.reset();
            } catch (error) {
                showGlobalMessage(error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Send Reset Link';
            }
        });
    }
})();
