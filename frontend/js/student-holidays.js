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

    // DOM Elements
    const upcomingHolidaysListEl = document.getElementById('upcomingHolidaysList');
    
    let calendar;
    let allHolidays = [];

    const loadHolidays = async () => {
        try {
            allHolidays = await holidaysAPI.getAll();
            renderUpcomingHolidays();
            renderCalendar();
        } catch (error) {
            console.error('Failed to load holidays', error);
            upcomingHolidaysListEl.innerHTML = '<div style="color: var(--danger-color); text-align: center; padding: 20px;">Failed to load holidays.</div>';
        }
    };

    const renderUpcomingHolidays = () => {
        upcomingHolidaysListEl.innerHTML = '';
        
        // Filter for future holidays
        const todayStr = new Date().toISOString().split('T')[0]; // Current date YYYY-MM-DD in UTC
        
        // Let's do a simple string comparison on dates (since they are YYYY-MM-DD)
        const upcoming = allHolidays
            .filter(h => h.date >= todayStr)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5); // Show top 5 upcoming

        if (upcoming.length === 0) {
            upcomingHolidaysListEl.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">No upcoming holidays.</div>';
            return;
        }

        upcoming.forEach(h => {
            const dateObj = new Date(h.date);
            // using UTC to avoid timezone shift on YYYY-MM-DD strings
            const dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
            
            const item = document.createElement('div');
            item.className = 'holiday-item';
            
            // Highlight if it's within the next 7 days
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const isSoon = dateObj <= nextWeek;
            
            item.innerHTML = `
                <div class="holiday-item-header">
                    <span class="holiday-date" style="${isSoon ? 'background: rgba(245, 158, 11, 0.1); color: var(--warning-color);' : ''}">
                        ${isSoon ? '<i class="fas fa-exclamation-circle" style="margin-right: 4px;"></i> ' : ''}${dateStr}
                    </span>
                </div>
                <h4 class="holiday-title">${h.title}</h4>
                ${h.description ? `<p class="holiday-desc">${h.description}</p>` : ''}
            `;
            upcomingHolidaysListEl.appendChild(item);
        });
    };

    const renderCalendar = () => {
        const calendarEl = document.getElementById('calendar');
        
        const events = allHolidays.map(h => ({
            id: h.id,
            title: h.title,
            start: h.date, // YYYY-MM-DD
            allDay: true,
            backgroundColor: 'var(--success-color)',
            borderColor: 'var(--success-color)',
            description: h.description
        }));

        if (calendar) {
            calendar.destroy();
        }

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,listMonth'
            },
            events: events,
            eventClick: function(info) {
                // For students, maybe just show a simple alert or modal with details
                const desc = info.event.extendedProps.description || 'No additional details.';
                alert(`${info.event.title}\nDate: ${info.event.startStr}\n\n${desc}`);
            },
            height: 'auto'
        });
        
        calendar.render();
    };

    // Initial Load
    loadHolidays();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
});
