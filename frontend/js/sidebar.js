document.addEventListener('DOMContentLoaded', () => {
    const sidebarContainer = document.getElementById('sidebar');
    if (!sidebarContainer) return;

    // Get current path to determine active item
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'dashboard.html';

    const menuItems = [
        { name: 'Dashboard', icon: 'fa-chart-pie', link: 'dashboard.html' },
        { name: 'Student Management', icon: 'fa-users', link: 'students.html' },
        { name: 'Attendance', icon: 'fa-calendar-check', link: 'attendance.html' },
        { name: 'Marks', icon: 'fa-graduation-cap', link: 'marks.html' },
        { name: 'Fee Management', icon: 'fa-file-invoice-dollar', link: 'fees.html' },
        { name: 'Notes Repository', icon: 'fa-book', link: 'notes.html' },
        { name: 'Previous Question Papers', icon: 'fa-file-pdf', link: 'papers.html' },
        { name: 'Syllabus', icon: 'fa-list-alt', link: 'syllabus.html' },
        { name: 'Timetable', icon: 'fa-clock', link: 'timetable.html' },
        { name: 'Holiday Calendar', icon: 'fa-umbrella-beach', link: 'holidays.html' },
        { name: 'Notifications', icon: 'fa-bell', link: 'notifications.html' },
        { name: 'Reports', icon: 'fa-file-alt', link: 'reports.html' },
        { name: 'Profile', icon: 'fa-user', link: 'student-profile.html' },
        { name: 'Settings', icon: 'fa-cog', link: 'settings.html' },
        { name: 'Logout', icon: 'fa-sign-out-alt', link: '#', isLogout: true }
    ];

    let html = `
        <div class="sidebar-header">
            <div class="logo">
                <i class="fas fa-graduation-cap logo-icon"></i>
                <span>CampusConnect</span>
            </div>
        </div>
        <nav class="nav-menu">
    `;

    menuItems.forEach(item => {
        // We do a soft match for active states, e.g., student-notes.html and notes.html both activate "Notes"
        let isActive = false;
        if (page === item.link) isActive = true;
        // Handle student vs admin paths
        if (page === 'student-notes.html' && item.link === 'notes.html') isActive = true;
        if (page === 'student-papers.html' && item.link === 'papers.html') isActive = true;
        if (page === 'student-syllabus.html' && item.link === 'syllabus.html') isActive = true;
        if (page === 'student-timetable.html' && item.link === 'timetable.html') isActive = true;
        if (page === 'student-notifications.html' && item.link === 'notifications.html') isActive = true;
        if (page === 'student-fees.html' && item.link === 'fees.html') isActive = true;
        if (page === 'student-marks.html' && item.link === 'marks.html') isActive = true;
        if (page === 'student-attendance.html' && item.link === 'attendance.html') isActive = true;

        if (item.isLogout) {
            html += `
                <a class="nav-item text-danger" onclick="handleLogout()" style="text-decoration: none;">
                    <i class="fas ${item.icon}"></i>
                    <span>${item.name}</span>
                </a>
            `;
        } else {
            html += `
                <a href="${item.link}" class="nav-item ${isActive ? 'active' : ''}" data-link style="text-decoration: none;">
                    <i class="fas ${item.icon}"></i>
                    <span>${item.name}</span>
                </a>
            `;
        }
    });

    html += `</nav>`;

    sidebarContainer.innerHTML = html;

    // Provide the global logout function if it doesn't exist
    if (!window.handleLogout) {
        window.handleLogout = () => {
            if (confirm('Are you sure you want to log out?')) {
                localStorage.removeItem('token');
                window.location.href = 'index.html';
            }
        };
    }
});
