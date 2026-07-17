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
            // Only admins should access this page for now
            window.location.href = 'dashboard.html';
            return;
        }
    } catch (error) {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    }

    // DOM Elements
    const searchInput = document.getElementById('searchInput');
    const branchFilter = document.getElementById('branchFilter');
    const semesterFilter = document.getElementById('semesterFilter');
    const studentsTableBody = document.getElementById('studentsTableBody');
    
    const studentModal = document.getElementById('studentModal');
    const studentForm = document.getElementById('studentForm');
    const modalTitle = document.getElementById('modalTitle');
    const passwordGroup = document.getElementById('passwordGroup');
    const modalMessage = document.getElementById('modalMessage');
    
    const viewModal = document.getElementById('viewModal');
    
    // Photo Upload Elements
    const photoInput = document.getElementById('photoInput');
    const photoPreview = document.getElementById('photoPreview');
    let selectedPhotoFile = null;

    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedPhotoFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                photoPreview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // Load Students
    const loadStudents = async () => {
        try {
            const students = await studentsAPI.getAll(
                searchInput.value,
                branchFilter.value,
                semesterFilter.value
            );
            
            studentsTableBody.innerHTML = '';
            
            if (students.length === 0) {
                studentsTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px;">No students found</td></tr>`;
                return;
            }

            students.forEach(student => {
                const profile = student.student_profile || {};
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${profile.roll_number || 'N/A'}</strong></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-light); color: white; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                                ${profile.profile_photo ? `<img src="http://localhost:8000${profile.profile_photo}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-user" style="font-size: 14px;"></i>`}
                            </div>
                            <span>${student.full_name}</span>
                        </div>
                    </td>
                    <td>${profile.branch || 'N/A'}</td>
                    <td>${profile.semester || 'N/A'}</td>
                    <td>${student.email}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-view" onclick="viewStudent(${student.id})" title="View"><i class="fas fa-eye"></i></button>
                            <button class="btn-edit" onclick="editStudent(${student.id})" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="deleteStudent(${student.id})" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
                studentsTableBody.appendChild(tr);
            });
        } catch (error) {
            console.error('Failed to load students:', error);
            studentsTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger-color);">Failed to load students</td></tr>`;
        }
    };

    // Filter Listeners
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadStudents, 500);
    });
    branchFilter.addEventListener('change', loadStudents);
    semesterFilter.addEventListener('change', loadStudents);

    // Initial Load
    loadStudents();

    // Add Student Modal Open
    document.getElementById('openAddModalBtn').addEventListener('click', () => {
        studentForm.reset();
        document.getElementById('studentId').value = '';
        modalTitle.textContent = 'Add New Student';
        passwordGroup.style.display = 'block';
        document.getElementById('stuPassword').required = true;
        document.getElementById('stuEmail').disabled = false;
        document.getElementById('stuRoll').disabled = false;
        
        // Reset Photo
        selectedPhotoFile = null;
        photoInput.value = '';
        photoPreview.innerHTML = '<i class="fas fa-user"></i>';
        
        modalMessage.style.display = 'none';
        studentModal.style.display = 'flex';
    });

    // Form Submit (Add/Edit)
    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('studentId').value;
        const submitBtn = studentForm.querySelector('button[type="submit"]');
        
        const studentData = {
            full_name: document.getElementById('stuName').value,
            email: document.getElementById('stuEmail').value,
            roll_number: document.getElementById('stuRoll').value,
            branch: document.getElementById('stuBranch').value,
            semester: document.getElementById('stuSemester').value,
            phone: document.getElementById('stuPhone').value,
            parent_details: document.getElementById('stuParent').value,
            address: document.getElementById('stuAddress').value
        };

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            let savedStudent;
            
            if (id) {
                // Edit
                // Exclude fields not in StudentProfileUpdate
                const updateData = {
                    branch: studentData.branch,
                    semester: studentData.semester,
                    phone: studentData.phone,
                    parent_details: studentData.parent_details,
                    address: studentData.address
                };
                savedStudent = await studentsAPI.update(id, updateData);
                showModalMessage('Student updated successfully!', 'success');
            } else {
                // Create
                studentData.password = document.getElementById('stuPassword').value;
                savedStudent = await studentsAPI.create(studentData);
                showModalMessage('Student created successfully!', 'success');
            }

            // Handle Photo Upload
            if (selectedPhotoFile && savedStudent) {
                await studentsAPI.uploadPhoto(savedStudent.id, selectedPhotoFile);
            }

            loadStudents();
            setTimeout(() => {
                closeStudentModal();
            }, 1000);
            
        } catch (error) {
            showModalMessage(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Student';
        }
    });

    function showModalMessage(msg, type) {
        modalMessage.textContent = msg;
        modalMessage.style.display = 'block';
        if (type === 'error') {
            modalMessage.style.background = 'rgba(239, 68, 68, 0.1)';
            modalMessage.style.color = 'var(--danger-color)';
        } else {
            modalMessage.style.background = 'rgba(16, 185, 129, 0.1)';
            modalMessage.style.color = 'var(--success-color)';
        }
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });

    // Global Modal Functions
    window.closeStudentModal = () => {
        studentModal.style.display = 'none';
    };

    window.closeViewModal = () => {
        viewModal.style.display = 'none';
    };

    window.deleteStudent = async (id) => {
        if (confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
            try {
                await studentsAPI.delete(id);
                loadStudents();
            } catch (error) {
                alert('Failed to delete student: ' + error.message);
            }
        }
    };

    window.editStudent = async (id) => {
        try {
            const student = await studentsAPI.getById(id);
            const profile = student.student_profile || {};
            
            document.getElementById('studentId').value = student.id;
            modalTitle.textContent = 'Edit Student';
            passwordGroup.style.display = 'none';
            document.getElementById('stuPassword').required = false;
            
            document.getElementById('stuName').value = student.full_name;
            document.getElementById('stuName').disabled = true; // Not in update schema
            document.getElementById('stuEmail').value = student.email;
            document.getElementById('stuEmail').disabled = true;
            document.getElementById('stuRoll').value = profile.roll_number || '';
            document.getElementById('stuRoll').disabled = true;
            
            document.getElementById('stuBranch').value = profile.branch || '';
            document.getElementById('stuSemester').value = profile.semester || '';
            document.getElementById('stuPhone').value = profile.phone || '';
            document.getElementById('stuParent').value = profile.parent_details || '';
            document.getElementById('stuAddress').value = profile.address || '';
            
            // Photo handling
            selectedPhotoFile = null;
            photoInput.value = '';
            if (profile.profile_photo) {
                photoPreview.innerHTML = `<img src="http://localhost:8000${profile.profile_photo}" style="width: 100%; height: 100%; object-fit: cover;">`;
            } else {
                photoPreview.innerHTML = '<i class="fas fa-user"></i>';
            }

            modalMessage.style.display = 'none';
            studentModal.style.display = 'flex';
        } catch (error) {
            alert('Failed to load student data');
        }
    };

    window.viewStudent = async (id) => {
        try {
            const student = await studentsAPI.getById(id);
            const profile = student.student_profile || {};
            
            document.getElementById('viewName').textContent = student.full_name;
            document.getElementById('viewEmail').textContent = student.email;
            document.getElementById('viewRoll').textContent = profile.roll_number || 'N/A';
            document.getElementById('viewBranch').textContent = profile.branch || 'N/A';
            document.getElementById('viewSem').textContent = profile.semester || 'N/A';
            
            document.getElementById('viewPhone').textContent = profile.phone || 'No phone provided';
            document.getElementById('viewAddress').textContent = profile.address || 'No address provided';
            document.getElementById('viewParent').textContent = profile.parent_details || 'No details provided';
            
            const viewPhoto = document.getElementById('viewPhoto');
            if (profile.profile_photo) {
                viewPhoto.innerHTML = `<img src="http://localhost:8000${profile.profile_photo}" style="width: 100%; height: 100%; object-fit: cover;">`;
            } else {
                viewPhoto.innerHTML = '<i class="fas fa-user"></i>';
            }
            
            viewModal.style.display = 'flex';
        } catch (error) {
            alert('Failed to load student details');
        }
    };
});
