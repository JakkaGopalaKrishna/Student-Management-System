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
        if (currentUser.role !== 'student') {
            window.location.href = 'dashboard.html';
            return;
        }
    } catch (error) {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }

    const profileStatus = document.getElementById('profileStatus');
    let allEntries = [];

    const loadTimetable = async () => {
        if (!currentUser.student_profile) {
            profileStatus.innerHTML = '<span style="color: var(--warning-color);">Please complete your student profile to view your timetable automatically.</span>';
            return;
        }

        const { branch, semester } = currentUser.student_profile;
        profileStatus.innerHTML = `Showing timetable for <strong>${branch} - ${semester}</strong>`;

        try {
            allEntries = await timetableAPI.getAll(branch, semester);
            renderDaily();
            renderWeekly();
            renderExams();
        } catch (error) {
            console.error('Failed to load timetable', error);
            profileStatus.innerHTML = '<span style="color: var(--danger-color);">Error loading timetable data.</span>';
        }
    };

    const formatTime = (timeStr) => {
        const [h, m] = timeStr.split(':');
        let hours = parseInt(h);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${m} ${ampm}`;
    };

    const renderDaily = () => {
        const container = document.getElementById('dailyContainer');
        const dayTitle = document.getElementById('dailyDayTitle');
        
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayDay = days[new Date().getDay()];
        dayTitle.textContent = `${todayDay}'s Classes`;
        
        const todaysClasses = allEntries.filter(e => e.entry_type === 'class' && e.day_of_week === todayDay);
        
        if (todaysClasses.length === 0) {
            container.innerHTML = '<div style="color: var(--text-secondary); padding: 20px;">No classes scheduled for today! 🎉</div>';
            return;
        }

        let html = '';
        todaysClasses.forEach(c => {
            html += `
                <div class="schedule-card">
                    <div class="time-block">
                        <div class="time-start">${formatTime(c.start_time)}</div>
                        <div class="time-end">to ${formatTime(c.end_time)}</div>
                    </div>
                    <div class="subject-block">
                        <h4 class="subject-name">${c.subject}</h4>
                        <div class="subject-meta">
                            <span><i class="fas fa-map-marker-alt"></i> Room ${c.room}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    };

    const renderWeekly = () => {
        const grid = document.getElementById('weeklyGrid');
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        // Define standard time slots for the grid header
        const timeSlots = [
            { start: '09:00', end: '10:00', label: '9 AM - 10 AM' },
            { start: '10:00', end: '11:00', label: '10 AM - 11 AM' },
            { start: '11:00', end: '12:00', label: '11 AM - 12 PM' },
            { start: '13:00', end: '14:00', label: '1 PM - 2 PM' },
            { start: '14:00', end: '15:00', label: '2 PM - 3 PM' },
            { start: '15:00', end: '16:00', label: '3 PM - 4 PM' }
        ];

        let html = '<div class="grid-header">Day / Time</div>';
        timeSlots.forEach(slot => {
            html += `<div class="grid-header">${slot.label}</div>`;
        });

        days.forEach(day => {
            html += `<div class="grid-cell time-label">${day}</div>`;
            
            const dayClasses = allEntries.filter(e => e.entry_type === 'class' && e.day_of_week === day);
            
            timeSlots.forEach(slot => {
                // Find class matching this slot roughly
                const matchingClass = dayClasses.find(c => c.start_time.startsWith(slot.start));
                
                if (matchingClass) {
                    html += `
                        <div class="grid-cell">
                            <div class="class-slot">
                                <div class="class-slot-title">${matchingClass.subject}</div>
                                <div><i class="fas fa-map-marker-alt"></i> ${matchingClass.room}</div>
                            </div>
                        </div>
                    `;
                } else {
                    html += `<div class="grid-cell"></div>`;
                }
            });
        });

        grid.innerHTML = html;
    };

    const renderExams = () => {
        const container = document.getElementById('examsContainer');
        const exams = allEntries.filter(e => e.entry_type === 'exam');
        
        if (exams.length === 0) {
            container.innerHTML = '<div style="color: var(--text-secondary); padding: 20px;">No upcoming exams scheduled.</div>';
            return;
        }

        // Sort by date
        exams.sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));

        let html = '';
        exams.forEach(e => {
            const dateObj = new Date(e.exam_date);
            const dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
            
            html += `
                <div class="schedule-card exam-card">
                    <div class="time-block">
                        <div class="time-start" style="color: var(--danger-color);">${dateStr}</div>
                        <div class="time-end">${formatTime(e.start_time)} to ${formatTime(e.end_time)}</div>
                    </div>
                    <div class="subject-block">
                        <h4 class="subject-name">${e.subject}</h4>
                        <div class="subject-meta">
                            <span><i class="fas fa-map-marker-alt"></i> Venue: ${e.room}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    };

    // Tab Switching Logic
    window.switchTab = (tabId) => {
        document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        
        document.getElementById(`tab-${tabId}`).classList.add('active');
        event.currentTarget.classList.add('active');
    };

    // Top Nav Notification Badge Fetch Logic (shared component logic)
    const loadNotificationBadge = async () => {
        try {
            const notifications = await notificationsAPI.getAll();
            const unreadCount = notifications.filter(n => !n.is_read).length;
            const badge = document.getElementById('navUnreadBadge');
            if (badge && unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'flex';
            }
        } catch (e) {
            console.error('Failed to load notifications for badge');
        }
    };
    loadNotificationBadge();

    // Initial Load
    loadTimetable();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
});
