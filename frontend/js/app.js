document.addEventListener('DOMContentLoaded', async () => {
    // Only run this script on dashboard pages
    if (!window.location.pathname.includes('dashboard.html')) return;

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const user = await authAPI.getMe();
        document.getElementById('userName').textContent = user.full_name;
        document.getElementById('userRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
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
});
