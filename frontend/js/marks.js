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

    // DOM Elements
    const searchSubject = document.getElementById('searchSubject');
    const searchSemester = document.getElementById('searchSemester');
    const searchExamType = document.getElementById('searchExamType');
    const searchBtn = document.getElementById('searchBtn');
    const marksTableBody = document.getElementById('marksTableBody');
    
    const markModal = document.getElementById('markModal');
    const markForm = document.getElementById('markForm');
    const markStudentId = document.getElementById('markStudentId');
    
    // Load Students for Dropdown
    const loadStudentsDropdown = async () => {
        try {
            const students = await studentsAPI.getAll();
            markStudentId.innerHTML = '<option value="">Select Student</option>';
            students.forEach(s => {
                const roll = s.student_profile ? s.student_profile.roll_number : 'N/A';
                markStudentId.innerHTML += `<option value="${s.id}">${s.full_name} (${roll})</option>`;
            });
        } catch (error) {
            console.error('Failed to load students for dropdown', error);
        }
    };
    
    loadStudentsDropdown();

    // Load Marks
    const loadMarks = async () => {
        try {
            const marks = await marksAPI.getAll(
                '', 
                searchSubject.value.trim(), 
                searchSemester.value, 
                searchExamType.value
            );
            
            marksTableBody.innerHTML = '';
            
            if (marks.length === 0) {
                marksTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 24px;">No marks records found.</td></tr>';
                return;
            }

            marks.forEach(mark => {
                const perc = mark.max_marks > 0 ? ((mark.marks_obtained / mark.max_marks) * 100).toFixed(1) : 0;
                let badgeClass = 'bg-blue'; // default info
                if (mark.exam_type === 'Internal') badgeClass = 'bg-orange';
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${mark.student_id}</strong></td>
                    <td>${mark.subject}</td>
                    <td>${mark.semester}</td>
                    <td><span class="badge" style="background: var(--${badgeClass === 'bg-orange' ? 'warning-color' : 'info-color'}); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">${mark.exam_type}</span></td>
                    <td><strong>${mark.marks_obtained}</strong></td>
                    <td>${mark.max_marks}</td>
                    <td>${perc}%</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-edit" onclick="editMark(${mark.id})" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="deleteMark(${mark.id})" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
                marksTableBody.appendChild(tr);
            });
        } catch (error) {
            console.error('Failed to load marks', error);
            marksTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--danger-color);">Error loading data.</td></tr>';
        }
    };

    searchBtn.addEventListener('click', loadMarks);
    loadMarks(); // Initial load

    // Add Modal Open
    document.getElementById('openAddModalBtn').addEventListener('click', () => {
        markForm.reset();
        document.getElementById('markId').value = '';
        document.getElementById('modalTitle').textContent = 'Add Marks';
        document.getElementById('markStudentId').disabled = false;
        document.getElementById('markSubject').disabled = false;
        document.getElementById('markSemester').disabled = false;
        document.getElementById('markExamType').disabled = false;
        markModal.style.display = 'flex';
    });

    // Form Submit
    markForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('markId').value;
        const submitBtn = markForm.querySelector('button[type="submit"]');
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            if (id) {
                // Edit
                await marksAPI.update(id, {
                    marks_obtained: parseFloat(document.getElementById('markObtained').value),
                    max_marks: parseFloat(document.getElementById('markMax').value),
                    remarks: document.getElementById('markRemarks').value || null
                });
                alert('Marks updated successfully!');
            } else {
                // Create
                await marksAPI.create({
                    student_id: parseInt(document.getElementById('markStudentId').value),
                    subject: document.getElementById('markSubject').value.trim(),
                    semester: document.getElementById('markSemester').value,
                    exam_type: document.getElementById('markExamType').value,
                    marks_obtained: parseFloat(document.getElementById('markObtained').value),
                    max_marks: parseFloat(document.getElementById('markMax').value),
                    remarks: document.getElementById('markRemarks').value || null
                });
                alert('Marks added successfully!');
            }

            loadMarks();
            closeModal();
            
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Marks';
        }
    });

    window.closeModal = () => {
        markModal.style.display = 'none';
    };

    // Note: We need a way to get a specific mark by ID to edit it. 
    // Since we don't have a GET /marks/{id}, we'll fetch all and find it, or pass data.
    // For simplicity, we'll fetch all and find.
    window.editMark = async (id) => {
        try {
            // Brute force find
            const marks = await marksAPI.getAll();
            const mark = marks.find(m => m.id === id);
            if (!mark) throw new Error('Mark record not found');
            
            document.getElementById('markId').value = mark.id;
            document.getElementById('modalTitle').textContent = 'Edit Marks';
            
            document.getElementById('markStudentId').value = mark.student_id;
            document.getElementById('markStudentId').disabled = true;
            
            document.getElementById('markSubject').value = mark.subject;
            document.getElementById('markSubject').disabled = true;
            
            document.getElementById('markSemester').value = mark.semester;
            document.getElementById('markSemester').disabled = true;
            
            document.getElementById('markExamType').value = mark.exam_type;
            document.getElementById('markExamType').disabled = true;
            
            document.getElementById('markObtained').value = mark.marks_obtained;
            document.getElementById('markMax').value = mark.max_marks;
            document.getElementById('markRemarks').value = mark.remarks || '';
            
            markModal.style.display = 'flex';
        } catch (error) {
            alert('Failed to edit: ' + error.message);
        }
    };

    window.deleteMark = async (id) => {
        if (confirm('Delete this mark record?')) {
            try {
                await marksAPI.delete(id);
                loadMarks();
            } catch (error) {
                alert('Failed to delete: ' + error.message);
            }
        }
    };

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    });
})();
