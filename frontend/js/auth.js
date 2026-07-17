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

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotForm = document.getElementById('forgotForm');

    // Login Handling
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
                showGlobalMessage('', 'success'); // Clear
                document.getElementById('globalMessage').style.display = 'none';

                const data = await authAPI.login(email, password);
                localStorage.setItem('token', data.access_token);
                window.location.href = 'dashboard.html';
            } catch (error) {
                showGlobalMessage(error.message, 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Sign In';
            }
        });
    }

    // Register Handling
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const submitBtn = registerForm.querySelector('button[type="submit"]');

            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
                document.getElementById('globalMessage').style.display = 'none';

                await authAPI.register(name, email, password);
                showGlobalMessage('Registration successful! You can now login.', 'success');
                registerForm.reset();
                switchPanel('loginPanel');
            } catch (error) {
                showGlobalMessage(error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Register';
            }
        });
    }

    // Forgot Password Handling
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgotEmail').value;
            const submitBtn = forgotForm.querySelector('button[type="submit"]');

            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                document.getElementById('globalMessage').style.display = 'none';

                const res = await authAPI.forgotPassword(email);
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
});
