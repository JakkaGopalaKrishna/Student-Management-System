(() => {
    const sidebarContainer = document.getElementById('sidebar');
    if (!sidebarContainer) return;

    // Get current path to determine active item
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'dashboard.html';

    // Get current role
    const role = localStorage.getItem('role') || 'student'; // fallback

    const adminMenuItems = [
        { name: 'Dashboard', icon: 'fa-chart-pie', link: '/admin/dashboard' },
        { name: 'Student Management', icon: 'fa-users', link: '/admin/students' },
        { name: 'Teacher Management', icon: 'fa-chalkboard-teacher', link: '/admin/teachers' },
        { name: 'Attendance Management', icon: 'fa-calendar-check', link: '/admin/attendance' },
        { name: 'Marks Management', icon: 'fa-graduation-cap', link: '/admin/marks' },
        { name: 'Fee Management', icon: 'fa-file-invoice-dollar', link: '/admin/fees' },
        { name: 'Notes Repository', icon: 'fa-book', link: '/admin/notes' },
        { name: 'Previous Question Papers', icon: 'fa-file-pdf', link: '/admin/papers' },
        { name: 'Syllabus', icon: 'fa-list-alt', link: '/admin/syllabus' },
        { name: 'Timetable', icon: 'fa-clock', link: '/admin/timetable' },
        { name: 'Holiday Calendar', icon: 'fa-umbrella-beach', link: '/admin/holidays' },
        { name: 'Notifications', icon: 'fa-bell', link: '/admin/notifications' },
        { name: 'Reports', icon: 'fa-file-alt', link: '/admin/reports' },
        { name: 'Settings', icon: 'fa-cog', link: '/admin/settings' },
        { name: 'Logout', icon: 'fa-sign-out-alt', link: '#', isLogout: true }
    ];

    const teacherMenuItems = [
        { name: 'Dashboard', icon: 'fa-chart-pie', link: '/dashboard.html' },
        { name: 'Attendance', icon: 'fa-calendar-check', link: '/attendance.html' },
        { name: 'Marks', icon: 'fa-graduation-cap', link: '/marks.html' },
        { name: 'Fee Management', icon: 'fa-file-invoice-dollar', link: '/fees.html' },
        { name: 'Notes Repository', icon: 'fa-book', link: '/notes.html' },
        { name: 'Previous Question Papers', icon: 'fa-file-pdf', link: '/papers.html' },
        { name: 'Syllabus', icon: 'fa-list-alt', link: '/syllabus.html' },
        { name: 'Timetable', icon: 'fa-clock', link: '/timetable.html' },
        { name: 'Holiday Calendar', icon: 'fa-umbrella-beach', link: '/holidays.html' },
        { name: 'Notifications', icon: 'fa-bell', link: '/notifications.html' },
        { name: 'Profile', icon: 'fa-user', link: '/student-profile.html' },
        { name: 'Settings', icon: 'fa-cog', link: '/settings.html' },
        { name: 'Logout', icon: 'fa-sign-out-alt', link: '#', isLogout: true }
    ];

    const studentMenuItems = [
        { name: 'Dashboard', icon: 'fa-chart-pie', link: '/dashboard.html' },
        { name: 'Attendance', icon: 'fa-calendar-check', link: '/student-attendance.html' },
        { name: 'Marks', icon: 'fa-graduation-cap', link: '/student-marks.html' },
        { name: 'Fee Management', icon: 'fa-file-invoice-dollar', link: '/student-fees.html' },
        { name: 'Notes Repository', icon: 'fa-book', link: '/student-notes.html' },
        { name: 'Previous Question Papers', icon: 'fa-file-pdf', link: '/student-papers.html' },
        { name: 'Syllabus', icon: 'fa-list-alt', link: '/student-syllabus.html' },
        { name: 'Timetable', icon: 'fa-clock', link: '/student-timetable.html' },
        { name: 'Holiday Calendar', icon: 'fa-umbrella-beach', link: '/student-holidays.html' },
        { name: 'Notifications', icon: 'fa-bell', link: '/student-notifications.html' },
        { name: 'Profile', icon: 'fa-user', link: '/student-profile.html' },
        { name: 'Settings', icon: 'fa-cog', link: '/settings.html' },
        { name: 'Logout', icon: 'fa-sign-out-alt', link: '#', isLogout: true }
    ];

    let menuItems = adminMenuItems;
    if (role === 'teacher') menuItems = teacherMenuItems;
    else if (role === 'student') menuItems = studentMenuItems;

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
        let isActive = false;
        
        // Active logic for user routes
        if (role !== 'admin') {
            const pageName = '/' + page;
            if (pageName === item.link) isActive = true;
        } else {
            // Admin exact path matching
            // Normalize path to exclude trailing slashes or index.html
            const normalizedPath = path.replace(/\/index\.html$/, '').replace(/\/$/, '');
            if (normalizedPath === item.link) isActive = true;
        }

        if (item.isLogout) {
            html += `
                <a class="nav-item text-danger" onclick="handleLogout()" style="text-decoration: none;">
                    <i class="fas ${item.icon}"></i>
                    <span>${item.name}</span>
                </a>
            `;
        } else {
            // Because we are at `/admin/dashboard/`, the link `/admin/dashboard` will go to the root. We need to prefix with origin if needed.
            // Since links are absolute paths like `/admin/dashboard`, it should work relative to the root URL (e.g. `http://localhost:8080/admin/dashboard`)
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
                window.location.href = '/index.html';
            }
        };
    }
})();
