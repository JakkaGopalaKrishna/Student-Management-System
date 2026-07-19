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
            // Only admins should access this page for now
            window.location.href = '/dashboard.html';
            return;
        }
    } catch (error) {
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    }

    // DOM Elements
    const searchInput = document.getElementById('searchInput');
    const branchFilter = document.getElementById('branchFilter');
    const semesterFilter = document.getElementById('semesterFilter');
    const studentsTableBody = document.getElementById('studentsTableBody');
    
    const studentModal = document.getElementById('studentModal');
    const studentForm = document.getElementById('studentForm');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    
    const viewModal = document.getElementById('viewModal');
    const credentialsModal = document.getElementById('credentialsModal');
    
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
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${student.roll_number || 'N/A'}</strong></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-light); color: white; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                                ${student.profile_photo ? `<img src="http://localhost:8000${student.profile_photo}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-user" style="font-size: 14px;"></i>`}
                            </div>
                            <span>${student.name}</span>
                        </div>
                    </td>
                    <td>${student.department_branch || 'N/A'}</td>
                    <td>${student.semester || 'N/A'}</td>
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
        
        document.getElementById('studentEmail').disabled = false;
        document.getElementById('studentPassword').parentElement.style.display = 'block';
        document.getElementById('studentPassword').required = true;
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
        
        const payload = {
            name: document.getElementById('stuName').value,
            email: document.getElementById('studentEmail').value,
            password: document.getElementById('studentPassword').value,
            roll_number: document.getElementById('stuRoll').value,
            department_branch: document.getElementById('stuBranch').value,
            semester: document.getElementById('stuSemester').value,
            gender: document.getElementById('stuGender').value,
            dob: document.getElementById('stuDob').value,
            section: document.getElementById('stuSection').value,
            phone: document.getElementById('stuPhone').value,
            parent_name: document.getElementById('stuParentName').value,
            parent_phone: document.getElementById('stuParentPhone').value,
            address: document.getElementById('stuAddress').value
        };

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            let savedStudent;
            
            if (id) {
                // Edit
                const updateData = {
                    department_branch: payload.department_branch,
                    semester: payload.semester,
                    gender: payload.gender,
                    dob: payload.dob,
                    section: payload.section,
                    phone: payload.phone,
                    parent_name: payload.parent_name,
                    parent_phone: payload.parent_phone,
                    address: payload.address
                };
                savedStudent = await studentsAPI.update(id, updateData);
                showModalMessage('Student updated successfully!', 'success');
                
                // Handle Photo Upload
                if (selectedPhotoFile && savedStudent) {
                    await studentsAPI.uploadPhoto(savedStudent.id, selectedPhotoFile);
                }

                loadStudents();
                setTimeout(() => {
                    closeStudentModal();
                }, 1000);
            } else {
                // Create
                const student = await studentsAPI.create(payload);
                
                // Handle Photo Upload
                if (selectedPhotoFile && student) {
                    await studentsAPI.uploadPhoto(student.id, selectedPhotoFile);
                }

                showModalMessage('Student created successfully.', 'success');
                await loadStudents();
                setTimeout(() => {
                    closeStudentModal();
                }, 1500);
            }
            
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
        window.location.href = '/index.html';
    });

    // Global Modal Functions
    window.closeStudentModal = () => {
        studentModal.style.display = 'none';
    };

    window.closeCredentialsModal = () => {
        credentialsModal.style.display = 'none';
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
            
            document.getElementById('studentId').value = student.id;
            modalTitle.textContent = 'Edit Student';
            
            document.getElementById('stuName').value = student.name;
            document.getElementById('stuName').disabled = true; // Not in update schema
            document.getElementById('studentEmail').value = student.email;
            document.getElementById('studentEmail').disabled = true;
            document.getElementById('studentPassword').parentElement.style.display = 'none';
            document.getElementById('studentPassword').required = false;
            document.getElementById('stuRoll').value = student.roll_number || '';
            document.getElementById('stuRoll').disabled = true;
            
            document.getElementById('stuBranch').value = student.department_branch || '';
            document.getElementById('stuSemester').value = student.semester || '';
            document.getElementById('stuGender').value = student.gender || '';
            document.getElementById('stuDob').value = student.dob || '';
            document.getElementById('stuSection').value = student.section || '';
            document.getElementById('stuPhone').value = student.phone || '';
            document.getElementById('stuParentName').value = student.parent_name || '';
            document.getElementById('stuParentPhone').value = student.parent_phone || '';
            document.getElementById('stuAddress').value = student.address || '';
            
            // Photo handling
            selectedPhotoFile = null;
            photoInput.value = '';
            if (student.profile_photo) {
                photoPreview.innerHTML = `<img src="http://localhost:8000${student.profile_photo}" style="width: 100%; height: 100%; object-fit: cover;">`;
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
            
            document.getElementById('viewName').textContent = student.name;
            document.getElementById('viewEmail').textContent = student.email;
            document.getElementById('viewRoll').textContent = student.roll_number || 'N/A';
            document.getElementById('viewBranch').textContent = student.department_branch || 'N/A';
            document.getElementById('viewSem').textContent = student.semester || 'N/A';
            
            document.getElementById('viewPhone').textContent = student.phone || 'No phone provided';
            document.getElementById('viewAddress').textContent = student.address || 'No address provided';
            document.getElementById('viewParent').textContent = (student.parent_name ? `${student.parent_name} (${student.parent_phone || ''})` : 'No details provided');
            
            const viewPhoto = document.getElementById('viewPhoto');
            if (student.profile_photo) {
                viewPhoto.innerHTML = `<img src="http://localhost:8000${student.profile_photo}" style="width: 100%; height: 100%; object-fit: cover;">`;
            } else {
                viewPhoto.innerHTML = '<i class="fas fa-user"></i>';
            }
            
            viewModal.style.display = 'flex';
        } catch (error) {
            alert('Failed to load student details');
        }
    };
})();
