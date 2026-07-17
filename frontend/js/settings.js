document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    let currentUser = null;
    try {
        currentUser = await authAPI.getMe();
    } catch (error) {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
        return;
    }

    // Populate Profile Fields
    const profName = document.getElementById('profName');
    const profEmail = document.getElementById('profEmail');
    
    profName.value = currentUser.full_name;
    profEmail.value = currentUser.email;

    if (currentUser.role === 'student' && currentUser.student_profile) {
        document.getElementById('studentOnlyFields').style.display = 'block';
        document.getElementById('profSubmitBtn').style.display = 'inline-block';
        
        const p = currentUser.student_profile;
        document.getElementById('profPhone').value = p.phone || '';
        document.getElementById('profParent').value = p.parent_details || '';
        document.getElementById('profAddress').value = p.address || '';
    } else {
        document.getElementById('adminNotice').style.display = 'inline-block';
    }

    // Settings Profile Update Logic (Student Only)
    document.getElementById('settingsProfileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (currentUser.role !== 'student') return; // Admins cannot update profile details through this simple UI
        
        const submitBtn = document.getElementById('profSubmitBtn');
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            const payload = {
                phone: document.getElementById('profPhone').value.trim(),
                parent_details: document.getElementById('profParent').value.trim(),
                address: document.getElementById('profAddress').value.trim()
            };
            
            currentUser = await studentsAPI.updateMe(payload);
            alert('Profile settings saved successfully.');
        } catch (error) {
            alert('Failed to save profile: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Changes';
        }
    });

    // Password Update Logic
    document.getElementById('settingsPasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('secCurrent').value;
        const newPassword = document.getElementById('secNew').value;
        const confirmPassword = document.getElementById('secConfirm').value;
        const btn = document.getElementById('secSubmitBtn');

        if (newPassword !== confirmPassword) {
            alert('New passwords do not match!');
            return;
        }

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            
            await authAPI.changePassword(currentPassword, newPassword);
            
            alert('Password updated successfully! Please login again.');
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        } catch (error) {
            alert('Failed to update password: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Update Password';
            document.getElementById('settingsPasswordForm').reset();
        }
    });

    // Navigation and Tab Switching Logic
    window.switchSettingsPanel = (panelId, element) => {
        // Remove active class from all nav items
        document.querySelectorAll('.settings-nav-item').forEach(el => el.classList.remove('active'));
        // Add active class to clicked item
        element.classList.add('active');

        // Hide all panels
        document.querySelectorAll('.settings-panel').forEach(el => el.classList.remove('active'));
        // Show target panel
        document.getElementById(`panel-${panelId}`).classList.add('active');
        
        if (panelId === 'appearance') {
            updateThemeCardsUI();
        }
    };

    // Appearance Theme Cards Logic
    const themeCardLight = document.getElementById('themeCardLight');
    const themeCardDark = document.getElementById('themeCardDark');

    const updateThemeCardsUI = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        themeCardLight.classList.remove('active');
        themeCardDark.classList.remove('active');
        
        if (currentTheme === 'dark') {
            themeCardDark.classList.add('active');
        } else {
            themeCardLight.classList.add('active');
        }
    };

    window.setAppTheme = (theme) => {
        // This utilizes the global logic from theme.js if loaded, else manual
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update top-nav toggle icon globally
        const icon = document.querySelector('#themeToggleBtn i');
        if (icon) {
            if (theme === 'dark') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }
        
        updateThemeCardsUI();
    };

    // Initialize Theme Cards UI
    updateThemeCardsUI();

    // Logout Function
    window.handleLogout = () => {
        if(confirm('Are you sure you want to log out?')) {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        }
    };
});
