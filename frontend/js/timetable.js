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

    // Elements
    const searchBranch = document.getElementById('searchBranch');
    const searchSemester = document.getElementById('searchSemester');
    const searchType = document.getElementById('searchType');
    const searchBtn = document.getElementById('searchBtn');
    const timetableBody = document.getElementById('timetableBody');
    
    const timetableModal = document.getElementById('timetableModal');
    const timetableForm = document.getElementById('timetableForm');
    
    let allEntries = [];

    const loadEntries = async () => {
        try {
            allEntries = await timetableAPI.getAll(
                searchBranch.value,
                searchSemester.value,
                searchType.value
            );
            renderTable();
        } catch (error) {
            console.error('Failed to load timetable', error);
            timetableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger-color);">Error loading data.</td></tr>';
        }
    };

    const renderTable = () => {
        timetableBody.innerHTML = '';
        
        if (allEntries.length === 0) {
            timetableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 24px;">No schedule entries found.</td></tr>';
            return;
        }

        allEntries.forEach(entry => {
            const tr = document.createElement('tr');
            
            let typeBadge = '';
            let timingStr = '';
            
            const start = entry.start_time.substring(0, 5);
            const end = entry.end_time.substring(0, 5);
            const timeSlot = `${start} - ${end}`;
            
            if (entry.entry_type === 'class') {
                typeBadge = '<span class="type-badge type-class">Class</span>';
                timingStr = `<strong>${entry.day_of_week}</strong><br>${timeSlot}`;
            } else {
                typeBadge = '<span class="type-badge type-exam">Exam</span>';
                timingStr = `<strong>${entry.exam_date}</strong><br>${timeSlot}`;
            }

            tr.innerHTML = `
                <td>${typeBadge}</td>
                <td>
                    <strong>${entry.subject}</strong><br>
                    <span style="font-size: 0.875rem; color: var(--text-secondary);"><i class="fas fa-map-marker-alt"></i> ${entry.room}</span>
                </td>
                <td>${entry.branch}<br><span style="font-size: 0.875rem; color: var(--text-secondary);">${entry.semester}</span></td>
                <td>${timingStr}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-edit" onclick="editEntry(${entry.id})" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" onclick="deleteEntry(${entry.id})" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            timetableBody.appendChild(tr);
        });
    };

    searchBtn.addEventListener('click', loadEntries);

    // Modal Actions
    window.toggleTypeFields = () => {
        const type = document.getElementById('entryType').value;
        const classDayGroup = document.getElementById('classDayGroup');
        const examDateGroup = document.getElementById('examDateGroup');
        const dayInput = document.getElementById('entryDay');
        const dateInput = document.getElementById('entryDate');
        
        if (type === 'class') {
            classDayGroup.style.display = 'block';
            examDateGroup.style.display = 'none';
            dayInput.required = true;
            dateInput.required = false;
        } else {
            classDayGroup.style.display = 'none';
            examDateGroup.style.display = 'block';
            dayInput.required = false;
            dateInput.required = true;
        }
    };

    window.openTimetableModal = () => {
        timetableForm.reset();
        document.getElementById('entryId').value = '';
        document.getElementById('modalTitle').textContent = 'Add Schedule Entry';
        toggleTypeFields();
        timetableModal.style.display = 'flex';
    };

    window.closeTimetableModal = () => {
        timetableModal.style.display = 'none';
    };

    timetableForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('entryId').value;
        const submitBtn = document.getElementById('submitBtn');
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            const type = document.getElementById('entryType').value;
            
            const payload = {
                branch: document.getElementById('entryBranch').value,
                semester: document.getElementById('entrySemester').value,
                subject: document.getElementById('entrySubject').value.trim(),
                room: document.getElementById('entryRoom').value.trim(),
                entry_type: type,
                start_time: document.getElementById('entryStart').value,
                end_time: document.getElementById('entryEnd').value,
                day_of_week: type === 'class' ? document.getElementById('entryDay').value : null,
                exam_date: type === 'exam' ? document.getElementById('entryDate').value : null
            };

            if (id) {
                await timetableAPI.update(id, payload);
            } else {
                await timetableAPI.create(payload);
            }
            
            closeTimetableModal();
            loadEntries();
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Entry';
        }
    });

    window.editEntry = (id) => {
        const entry = allEntries.find(e => e.id === id);
        if (!entry) return;
        
        document.getElementById('entryId').value = entry.id;
        document.getElementById('modalTitle').textContent = 'Edit Schedule Entry';
        
        document.getElementById('entryBranch').value = entry.branch;
        document.getElementById('entrySemester').value = entry.semester;
        document.getElementById('entrySubject').value = entry.subject;
        document.getElementById('entryRoom').value = entry.room;
        document.getElementById('entryType').value = entry.entry_type;
        document.getElementById('entryStart').value = entry.start_time;
        document.getElementById('entryEnd').value = entry.end_time;
        
        toggleTypeFields();
        
        if (entry.entry_type === 'class') {
            document.getElementById('entryDay').value = entry.day_of_week;
        } else {
            document.getElementById('entryDate').value = entry.exam_date;
        }
        
        timetableModal.style.display = 'flex';
    };

    window.deleteEntry = async (id) => {
        if (confirm('Delete this schedule entry?')) {
            try {
                await timetableAPI.delete(id);
                loadEntries();
            } catch (error) {
                alert('Failed to delete: ' + error.message);
            }
        }
    };

    // Initial Load
    loadEntries();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    });
})();
