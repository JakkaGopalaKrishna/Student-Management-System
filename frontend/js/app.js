document.addEventListener('DOMContentLoaded', async () => {
    // Only run this script on dashboard pages
    if (!window.location.pathname.includes('dashboard.html')) return;

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    let currentUser = null;

    try {
        currentUser = await authAPI.getMe();
        document.getElementById('userName').textContent = currentUser.full_name;
        document.getElementById('userRole').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
        
        // Role based UI logic
        if (currentUser.role === 'admin') {
            document.getElementById('navSettings').style.display = 'flex';
            document.getElementById('adminActivityCard').style.display = 'block';
        } else {
            document.getElementById('studentWelcomeCard').style.display = 'block';
        }
    } catch (error) {
        console.error('Failed to load user session');
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }

    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });

    // Sidebar Toggle for Mobile
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Change Password Modal Logic
    const changePasswordModal = document.getElementById('changePasswordModal');
    const navChangePassword = document.getElementById('navChangePassword');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const modalMessage = document.getElementById('modalMessage');

    navChangePassword.addEventListener('click', () => {
        changePasswordModal.style.display = 'flex';
        changePasswordForm.reset();
        modalMessage.style.display = 'none';
    });

    closeModalBtn.addEventListener('click', () => {
        changePasswordModal.style.display = 'none';
    });

    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPasswordChange').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        const submitBtn = changePasswordForm.querySelector('button[type="submit"]');

        if (newPassword !== confirmNewPassword) {
            showModalMessage('New passwords do not match.', 'error');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            
            await authAPI.changePassword(currentPassword, newPassword);
            showModalMessage('Password updated successfully.', 'success');
            changePasswordForm.reset();
            
            setTimeout(() => {
                changePasswordModal.style.display = 'none';
            }, 2000);
        } catch (error) {
            showModalMessage(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Update Password';
        }
    });

    function showModalMessage(msg, type) {
        modalMessage.textContent = msg;
        modalMessage.style.display = 'block';
        if (type === 'error') {
            modalMessage.style.background = 'rgba(239, 68, 68, 0.1)';
            modalMessage.style.color = 'var(--danger-color)';
        } else {
            modalMessage.style.background = 'rgba(16, 185, 129, 0.1)';
            modalMessage.style.color = 'var(--success-color)';
        }
    }
});
