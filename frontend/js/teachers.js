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
    const teachersTableBody = document.getElementById('teachersTableBody');
    
    const teacherModal = document.getElementById('teacherModal');
    const teacherForm = document.getElementById('teacherForm');
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

    // Load Teachers
    const loadTeachers = async () => {
        try {
            const teachers = await teachersAPI.getAll(
                searchInput.value,
                branchFilter.value,
                semesterFilter.value
            );
            
            teachersTableBody.innerHTML = '';
            
            if (teachers.length === 0) {
                teachersTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px;">No teachers found</td></tr>`;
                return;
            }

            teachers.forEach(teacher => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${teacher.employee_id || 'N/A'}</strong></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-light); color: white; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                                ${teacher.profile_photo ? `<img src="http://localhost:8000${teacher.profile_photo}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i class="fas fa-user" style="font-size: 14px;"></i>`}
                            </div>
                            <span>${teacher.name}</span>
                        </div>
                    </td>
                    <td>${teacher.department_branch || 'N/A'}</td>
                    <td>${teacher.designation || 'N/A'}</td>
                    <td>${teacher.email}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-view" onclick="viewTeacher(${teacher.id})" title="View"><i class="fas fa-eye"></i></button>
                            <button class="btn-edit" onclick="editTeacher(${teacher.id})" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="deleteTeacher(${teacher.id})" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
                teachersTableBody.appendChild(tr);
            });
        } catch (error) {
            console.error('Failed to load teachers:', error);
            teachersTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger-color);">Failed to load teachers</td></tr>`;
        }
    };

    // Filter Listeners
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadTeachers, 500);
    });
    branchFilter.addEventListener('change', loadTeachers);
    semesterFilter.addEventListener('change', loadTeachers);

    // Initial Load
    loadTeachers();

    // Add Teacher Modal Open
    document.getElementById('openAddModalBtn').addEventListener('click', () => {
        teacherForm.reset();
        document.getElementById('teacherId').value = '';
        modalTitle.textContent = 'Add New Teacher';
        
        document.getElementById('tchEmail').disabled = false;
        document.getElementById('tchPassword').parentElement.style.display = 'block';
        document.getElementById('tchPassword').required = true;
        document.getElementById('tchEmployeeId').disabled = false;
        
        // Reset Photo
        selectedPhotoFile = null;
        photoInput.value = '';
        photoPreview.innerHTML = '<i class="fas fa-user"></i>';
        
        modalMessage.style.display = 'none';
        teacherModal.style.display = 'flex';
    });

    // Form Submit (Add/Edit)
    teacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('teacherId').value;
        const submitBtn = teacherForm.querySelector('button[type="submit"]');
        
        const teacherData = {
            name: document.getElementById('tchName').value,
            email: document.getElementById('tchEmail').value,
            password: document.getElementById('tchPassword').value,
            employee_id: document.getElementById('tchEmployeeId').value,
            department_branch: document.getElementById('tchDepartment').value,
            gender: document.getElementById('tchGender').value,
            designation: document.getElementById('tchDesignation').value,
            qualification: document.getElementById('tchQualification').value,
            experience: document.getElementById('tchExperience').value,
            phone: document.getElementById('tchPhone').value,
            address: document.getElementById('tchAddress').value
        };

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            let savedTeacher;
            
            if (id) {
                // Edit
                const updateData = {
            department_branch: document.getElementById('tchDepartment').value,
            gender: document.getElementById('tchGender').value,
            designation: document.getElementById('tchDesignation').value,
            qualification: document.getElementById('tchQualification').value,
            experience: document.getElementById('tchExperience').value,
            phone: document.getElementById('tchPhone').value,
            address: document.getElementById('tchAddress').value
        };
                savedTeacher = await teachersAPI.update(id, updateData);
                showModalMessage('Teacher updated successfully!', 'success');
                
                // Handle Photo Upload
                if (selectedPhotoFile && savedTeacher) {
                    await teachersAPI.uploadPhoto(savedTeacher.id, selectedPhotoFile);
                }

                loadTeachers();
                setTimeout(() => {
                    closeTeacherModal();
                }, 1000);
            } else {
                // Create
                savedTeacher = await teachersAPI.create(teacherData);
                // Handle Photo Upload
                if (selectedPhotoFile && savedTeacher) {
                    await teachersAPI.uploadPhoto(savedTeacher.id, selectedPhotoFile);
                }

                showModalMessage('Teacher created successfully.', 'success');
                await loadTeachers();
                setTimeout(() => {
                    closeTeacherModal();
                }, 1500);
            }
            
        } catch (error) {
            showModalMessage(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Teacher';
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
    window.closeTeacherModal = () => {
        teacherModal.style.display = 'none';
    };



    window.closeViewModal = () => {
        viewModal.style.display = 'none';
    };

    window.deleteTeacher = async (id) => {
        if (confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
            try {
                await teachersAPI.delete(id);
                loadTeachers();
            } catch (error) {
                alert('Failed to delete teacher: ' + error.message);
            }
        }
    };

    window.editTeacher = async (id) => {
        try {
            const teacher = await teachersAPI.getById(id);
            
            document.getElementById('teacherId').value = teacher.id;
            modalTitle.textContent = 'Edit Teacher';
            
            document.getElementById('tchName').value = teacher.name;
            document.getElementById('tchName').disabled = true; // Not in update schema
            document.getElementById('tchEmail').value = teacher.email;
            document.getElementById('tchEmail').disabled = true;
            document.getElementById('tchPassword').parentElement.style.display = 'none';
            document.getElementById('tchPassword').required = false;
            document.getElementById('tchEmployeeId').value = teacher.employee_id || '';
            document.getElementById('tchEmployeeId').disabled = true;
            
            document.getElementById('tchDepartment').value = teacher.department_branch || '';
            document.getElementById('tchGender').value = teacher.gender || '';
            document.getElementById('tchDesignation').value = teacher.designation || '';
            document.getElementById('tchQualification').value = teacher.qualification || '';
            document.getElementById('tchExperience').value = teacher.experience || '';
            document.getElementById('tchPhone').value = teacher.phone || '';
            document.getElementById('tchAddress').value = teacher.address || '';
            
            // Photo handling
            selectedPhotoFile = null;
            photoInput.value = '';
            if (teacher.profile_photo) {
                photoPreview.innerHTML = `<img src="http://localhost:8000${teacher.profile_photo}" style="width: 100%; height: 100%; object-fit: cover;">`;
            } else {
                photoPreview.innerHTML = '<i class="fas fa-user"></i>';
            }

            modalMessage.style.display = 'none';
            teacherModal.style.display = 'flex';
        } catch (error) {
            alert('Failed to load teacher data');
        }
    };

    window.viewTeacher = async (id) => {
        try {
            const teacher = await teachersAPI.getById(id);
            
            document.getElementById('viewName').textContent = teacher.name;
            document.getElementById('viewEmail').textContent = teacher.email;
            document.getElementById('viewRoll').textContent = teacher.employee_id || 'N/A';
            document.getElementById('viewBranch').textContent = teacher.department_branch || 'N/A';
            document.getElementById('viewSem').textContent = teacher.designation || 'N/A';
            
            document.getElementById('viewPhone').textContent = teacher.phone || 'No phone provided';
            document.getElementById('viewAddress').textContent = teacher.address || 'No address provided';
            
            document.getElementById('viewQualification').textContent = teacher.qualification || 'N/A';
            document.getElementById('viewExperience').textContent = teacher.experience || 'N/A';
            
            const viewPhoto = document.getElementById('viewPhoto');
            if (teacher.profile_photo) {
                viewPhoto.innerHTML = `<img src="http://localhost:8000${teacher.profile_photo}" style="width: 100%; height: 100%; object-fit: cover;">`;
            } else {
                viewPhoto.innerHTML = '<i class="fas fa-user"></i>';
            }
            
            viewModal.style.display = 'flex';
        } catch (error) {
            alert('Failed to load teacher details');
        }
    };
})();
