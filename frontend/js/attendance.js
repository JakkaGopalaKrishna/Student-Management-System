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
        if (currentUser.role !== 'admin') {
            window.location.href = 'dashboard.html';
            return;
        }
    } catch (error) {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }

    // Default Date to Today
    document.getElementById('dateSelect').valueAsDate = new Date();
    document.getElementById('searchDate').valueAsDate = new Date();

    const attendanceContainer = document.getElementById('attendanceContainer');
    const attendanceTableBody = document.getElementById('attendanceTableBody');
    const recordsTableBody = document.getElementById('recordsTableBody');
    
    let currentStudents = [];

    // Load Class for Marking Attendance
    document.getElementById('loadStudentsBtn').addEventListener('click', async () => {
        const date = document.getElementById('dateSelect').value;
        const subject = document.getElementById('subjectSelect').value.trim();
        const branch = document.getElementById('branchFilter').value;
        const semester = document.getElementById('semesterFilter').value;

        if (!date || !subject) {
            alert('Please select a Date and Subject.');
            return;
        }

        try {
            const students = await studentsAPI.getAll('', branch, semester);
            
            if (students.length === 0) {
                alert('No students found for this filter.');
                attendanceContainer.style.display = 'none';
                return;
            }

            // Also fetch existing attendance for this date/subject to pre-fill
            const existingRecords = await attendanceAPI.getAll('', subject, date);
            const recordMap = {};
            existingRecords.forEach(r => recordMap[r.student_id] = r);

            currentStudents = students;
            attendanceTableBody.innerHTML = '';
            
            students.forEach(student => {
                const profile = student.student_profile || {};
                const tr = document.createElement('tr');
                tr.dataset.studentId = student.id;
                
                const existing = recordMap[student.id];
                const status = existing ? existing.status : 'Present'; // Default to Present
                const remarks = existing ? existing.remarks : '';

                tr.innerHTML = `
                    <td><strong>${profile.roll_number || 'N/A'}</strong></td>
                    <td>${student.full_name}</td>
                    <td>
                        <div class="radio-group">
                            <label class="radio-btn">
                                <input type="radio" name="status_${student.id}" value="Present" ${status === 'Present' ? 'checked' : ''}>
                                <span>Present</span>
                            </label>
                            <label class="radio-btn">
                                <input type="radio" name="status_${student.id}" value="Absent" ${status === 'Absent' ? 'checked' : ''}>
                                <span>Absent</span>
                            </label>
                            <label class="radio-btn">
                                <input type="radio" name="status_${student.id}" value="Late" ${status === 'Late' ? 'checked' : ''}>
                                <span>Late</span>
                            </label>
                        </div>
                    </td>
                    <td>
                        <input type="text" class="form-control" name="remarks_${student.id}" value="${remarks || ''}" placeholder="Remarks (optional)">
                    </td>
                `;
                attendanceTableBody.appendChild(tr);
            });

            attendanceContainer.style.display = 'block';

        } catch (error) {
            alert('Failed to load class: ' + error.message);
        }
    });

    // Save Bulk Attendance
    document.getElementById('submitAttendanceBtn').addEventListener('click', async () => {
        const date = document.getElementById('dateSelect').value;
        const subject = document.getElementById('subjectSelect').value.trim();
        
        const records = [];
        currentStudents.forEach(student => {
            const statusNode = document.querySelector(`input[name="status_${student.id}"]:checked`);
            const remarksNode = document.querySelector(`input[name="remarks_${student.id}"]`);
            
            if (statusNode) {
                records.push({
                    student_id: student.id,
                    status: statusNode.value,
                    remarks: remarksNode.value
                });
            }
        });

        try {
            const btn = document.getElementById('submitAttendanceBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            await attendanceAPI.createBulk({
                date,
                subject,
                records
            });
            
            alert('Attendance saved successfully!');
            loadRecentRecords();
        } catch (error) {
            alert('Failed to save attendance: ' + error.message);
        } finally {
            const btn = document.getElementById('submitAttendanceBtn');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Save Attendance';
        }
    });

    // Search and Load Recent Records
    const loadRecentRecords = async () => {
        const date = document.getElementById('searchDate').value;
        const subject = document.getElementById('searchSubject').value.trim();
        
        try {
            const records = await attendanceAPI.getAll('', subject, date);
            recordsTableBody.innerHTML = '';
            
            if (records.length === 0) {
                recordsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 24px;">No records found.</td></tr>';
                return;
            }

            // Since attendance response doesn't embed student full_name right now, we could fetch it, 
            // but for simplicity, we'll just show the Student ID and rely on the UI for quick deletes.
            // A more robust backend would return student details in the AttendanceResponse.
            
            records.forEach(record => {
                let badgeClass = '';
                if (record.status === 'Present') badgeClass = 'status-present';
                if (record.status === 'Absent') badgeClass = 'status-absent';
                if (record.status === 'Late') badgeClass = 'status-late';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${record.date}</td>
                    <td>${record.subject}</td>
                    <td>Student ID: ${record.student_id}</td>
                    <td><span class="status-badge ${badgeClass}">${record.status}</span></td>
                    <td>
                        <button class="btn btn-primary" onclick="deleteRecord(${record.id})" style="padding: 6px 12px; background: var(--danger-color); border: none;"><i class="fas fa-trash"></i> Delete</button>
                    </td>
                `;
                recordsTableBody.appendChild(tr);
            });
        } catch (error) {
            console.error('Failed to load records', error);
        }
    };

    document.getElementById('searchRecordsBtn').addEventListener('click', loadRecentRecords);
    
    // Initial Load
    loadRecentRecords();

    // Global Delete
    window.deleteRecord = async (id) => {
        if (confirm('Delete this attendance record?')) {
            try {
                await attendanceAPI.delete(id);
                loadRecentRecords();
            } catch (error) {
                alert('Failed to delete: ' + error.message);
            }
        }
    };

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
});
