(async () => {
    // Auth Check
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }

    let currentUser = null;
    try {
        currentUser = await authAPI.getMe();
        if (currentUser.role !== 'admin') {
            window.location.href = '/dashboard.html';
            return;
        }
    } catch (error) {
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    }

    // Modal Elements
    const holidayModal = document.getElementById('holidayModal');
    const holidayForm = document.getElementById('holidayForm');
    const holidaysListEl = document.getElementById('holidaysList');
    
    let calendar;
    let allHolidays = [];

    const loadHolidays = async () => {
        try {
            allHolidays = await holidaysAPI.getAll();
            renderHolidaysList();
            renderCalendar();
        } catch (error) {
            console.error('Failed to load holidays', error);
            alert('Failed to load holidays: ' + error.message);
        }
    };

    const renderHolidaysList = () => {
        holidaysListEl.innerHTML = '';
        
        if (allHolidays.length === 0) {
            holidaysListEl.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">No holidays found.</div>';
            return;
        }

        // Sort by date upcoming first (from today)
        const today = new Date().setHours(0,0,0,0);
        
        // Show all in admin panel, sorted by date
        const sortedHolidays = [...allHolidays].sort((a, b) => new Date(a.date) - new Date(b.date));

        sortedHolidays.forEach(h => {
            const dateStr = new Date(h.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
            
            const item = document.createElement('div');
            item.className = 'holiday-item';
            item.innerHTML = `
                <div class="holiday-item-header">
                    <span class="holiday-date">${dateStr}</span>
                </div>
                <h4 class="holiday-title">${h.title}</h4>
                ${h.description ? `<p class="holiday-desc">${h.description}</p>` : ''}
                <div class="action-btns">
                    <button class="btn-edit" onclick="editHoliday(${h.id})"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn-delete" onclick="deleteHoliday(${h.id})"><i class="fas fa-trash"></i> Delete</button>
                </div>
            `;
            holidaysListEl.appendChild(item);
        });
    };

    const renderCalendar = () => {
        const calendarEl = document.getElementById('calendar');
        
        // Map data to FullCalendar events
        const events = allHolidays.map(h => ({
            id: h.id,
            title: h.title,
            start: h.date, // YYYY-MM-DD
            allDay: true,
            backgroundColor: 'var(--success-color)',
            borderColor: 'var(--success-color)'
        }));

        if (calendar) {
            // Destroy existing calendar instance before re-initializing
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
                editHoliday(parseInt(info.event.id));
            },
            dateClick: function(info) {
                // Pre-fill date when clicking an empty day
                document.getElementById('holidayDate').value = info.dateStr;
                openHolidayModal();
            },
            height: 'auto'
        });
        
        calendar.render();
    };

    // Modal Actions
    window.openHolidayModal = () => {
        if (!document.getElementById('holidayId').value) {
            // Only reset if it's not an edit (which pre-fills the id)
            holidayForm.reset();
            document.getElementById('holidayModalTitle').textContent = 'Add Holiday';
        }
        holidayModal.style.display = 'flex';
    };

    window.closeHolidayModal = () => {
        holidayModal.style.display = 'none';
        document.getElementById('holidayId').value = '';
        holidayForm.reset();
    };

    holidayForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('holidayId').value;
        const submitBtn = document.getElementById('submitBtn');
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            const payload = {
                title: document.getElementById('holidayTitle').value.trim(),
                date: document.getElementById('holidayDate').value, // YYYY-MM-DD format from input
                description: document.getElementById('holidayDesc').value.trim()
            };

            if (id) {
                await holidaysAPI.update(id, payload);
                alert('Holiday updated!');
            } else {
                await holidaysAPI.create(payload);
                alert('Holiday created!');
            }
            
            closeHolidayModal();
            loadHolidays(); // Reload data and re-render
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Holiday';
        }
    });

    window.editHoliday = (id) => {
        const holiday = allHolidays.find(h => h.id === id);
        if (!holiday) return;
        
        document.getElementById('holidayId').value = holiday.id;
        document.getElementById('holidayModalTitle').textContent = 'Edit Holiday';
        document.getElementById('holidayTitle').value = holiday.title;
        document.getElementById('holidayDate').value = holiday.date;
        document.getElementById('holidayDesc').value = holiday.description || '';
        
        openHolidayModal();
    };

    window.deleteHoliday = async (id) => {
        if (confirm('Are you sure you want to delete this holiday?')) {
            try {
                await holidaysAPI.delete(id);
                loadHolidays();
            } catch (error) {
                alert('Failed to delete: ' + error.message);
            }
        }
    };

    // Initial Load
    loadHolidays();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    });
})();
