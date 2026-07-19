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
    const searchKeyword = document.getElementById('searchKeyword');
    const searchBranch = document.getElementById('searchBranch');
    const searchSemester = document.getElementById('searchSemester');
    const searchBtn = document.getElementById('searchBtn');
    const syllabusTableBody = document.getElementById('syllabusTableBody');
    
    // Syllabus Modal
    const syllabusModal = document.getElementById('syllabusModal');
    const syllabusForm = document.getElementById('syllabusForm');
    const fileUploadGroup = document.getElementById('fileUploadGroup');
    const syllabusFile = document.getElementById('syllabusFile');
    
    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    };

    // Load Syllabus
    const loadSyllabus = async () => {
        try {
            const syllabuses = await syllabusAPI.getAll(
                searchBranch.value, 
                searchSemester.value, 
                searchKeyword.value.trim()
            );
            
            syllabusTableBody.innerHTML = '';
            
            if (syllabuses.length === 0) {
                syllabusTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 24px;">No syllabus found.</td></tr>';
                return;
            }

            syllabuses.forEach(syllabus => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${syllabus.title}</strong></td>
                    <td>${syllabus.branch}</td>
                    <td>${syllabus.semester}</td>
                    <td>${formatDate(syllabus.upload_date)}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-view" onclick="window.open('http://localhost:8000/${syllabus.file_path}', '_blank')" title="View PDF"><i class="fas fa-eye"></i></button>
                            <button class="btn-edit" onclick="editSyllabus(${syllabus.id})" title="Edit Metadata"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="deleteSyllabus(${syllabus.id})" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
                syllabusTableBody.appendChild(tr);
            });
        } catch (error) {
            console.error('Failed to load syllabus', error);
            syllabusTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger-color);">Error loading data.</td></tr>';
        }
    };

    searchBtn.addEventListener('click', loadSyllabus);
    loadSyllabus();

    // Add Syllabus Modal
    document.getElementById('openUploadModalBtn').addEventListener('click', () => {
        syllabusForm.reset();
        document.getElementById('syllabusId').value = '';
        document.getElementById('syllabusModalTitle').textContent = 'Upload Syllabus';
        fileUploadGroup.style.display = 'block';
        syllabusFile.required = true;
        syllabusModal.style.display = 'flex';
    });

    syllabusForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('syllabusId').value;
        const submitBtn = document.getElementById('submitBtn');
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            if (id) {
                // Update Metadata
                await syllabusAPI.update(id, {
                    title: document.getElementById('syllabusTitle').value.trim(),
                    branch: document.getElementById('syllabusBranch').value,
                    semester: document.getElementById('syllabusSemester').value
                });
                alert('Syllabus info updated!');
            } else {
                // Upload New Syllabus
                if (!syllabusFile.files[0]) {
                    alert("Please select a PDF file.");
                    return;
                }
                
                const formData = new FormData();
                formData.append('title', document.getElementById('syllabusTitle').value.trim());
                formData.append('branch', document.getElementById('syllabusBranch').value);
                formData.append('semester', document.getElementById('syllabusSemester').value);
                formData.append('file', syllabusFile.files[0]);
                
                await syllabusAPI.upload(formData);
                alert('Syllabus uploaded successfully!');
            }
            loadSyllabus();
            closeSyllabusModal();
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Upload';
        }
    });

    window.closeSyllabusModal = () => { syllabusModal.style.display = 'none'; };

    window.editSyllabus = async (id) => {
        try {
            const syllabuses = await syllabusAPI.getAll();
            const syllabus = syllabuses.find(s => s.id === id);
            if (!syllabus) throw new Error('Syllabus not found');
            
            document.getElementById('syllabusId').value = syllabus.id;
            document.getElementById('syllabusModalTitle').textContent = 'Edit Syllabus Info';
            document.getElementById('syllabusTitle').value = syllabus.title;
            document.getElementById('syllabusBranch').value = syllabus.branch;
            document.getElementById('syllabusSemester').value = syllabus.semester;
            
            fileUploadGroup.style.display = 'none';
            syllabusFile.required = false;
            
            document.getElementById('submitBtn').innerHTML = 'Update Details';
            
            syllabusModal.style.display = 'flex';
        } catch (error) {
            alert('Failed to edit: ' + error.message);
        }
    };

    window.deleteSyllabus = async (id) => {
        if (confirm('Delete this syllabus? The PDF file will be permanently removed.')) {
            try {
                await syllabusAPI.delete(id);
                loadSyllabus();
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
