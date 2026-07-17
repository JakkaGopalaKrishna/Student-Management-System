document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'dashboard.html';
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('errorMessage');
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        try {
            errorMsg.style.display = 'none';
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

            const data = await authAPI.login(email, password);
            localStorage.setItem('token', data.access_token);
            
            window.location.href = 'dashboard.html';
        } catch (error) {
            errorMsg.textContent = error.message;
            errorMsg.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Sign In';
        }
    });
});
