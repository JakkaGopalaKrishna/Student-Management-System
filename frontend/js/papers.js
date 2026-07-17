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

    // DOM Elements
    const searchKeyword = document.getElementById('searchKeyword');
    const searchYear = document.getElementById('searchYear');
    const searchBranch = document.getElementById('searchBranch');
    const searchBtn = document.getElementById('searchBtn');
    const papersTableBody = document.getElementById('papersTableBody');
    
    // Paper Modal
    const paperModal = document.getElementById('paperModal');
    const paperForm = document.getElementById('paperForm');
    const fileUploadGroup = document.getElementById('fileUploadGroup');
    const paperFile = document.getElementById('paperFile');
    
    // Load Papers
    const loadPapers = async () => {
        try {
            const papers = await papersAPI.getAll(
                searchBranch.value, 
                '', 
                '', 
                searchYear.value,
                searchKeyword.value.trim()
            );
            
            papersTableBody.innerHTML = '';
            
            if (papers.length === 0) {
                papersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px;">No exam papers found.</td></tr>';
                return;
            }

            papers.forEach(paper => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><span class="badge" style="background: var(--warning-color); color: white; padding: 4px 8px; border-radius: 4px; font-weight: 700;">${paper.year}</span></td>
                    <td><strong>${paper.title}</strong></td>
                    <td>${paper.subject}</td>
                    <td>${paper.branch}</td>
                    <td>${paper.semester}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-view" onclick="window.open('http://localhost:8000/${paper.file_path}', '_blank')" title="View PDF"><i class="fas fa-eye"></i></button>
                            <button class="btn-edit" onclick="editPaper(${paper.id})" title="Edit Metadata"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="deletePaper(${paper.id})" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
                papersTableBody.appendChild(tr);
            });
        } catch (error) {
            console.error('Failed to load papers', error);
            papersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger-color);">Error loading data.</td></tr>';
        }
    };

    searchBtn.addEventListener('click', loadPapers);
    loadPapers();

    // Add Paper Modal
    document.getElementById('openUploadModalBtn').addEventListener('click', () => {
        paperForm.reset();
        document.getElementById('paperId').value = '';
        document.getElementById('paperModalTitle').textContent = 'Upload Exam Paper';
        fileUploadGroup.style.display = 'block';
        paperFile.required = true;
        paperModal.style.display = 'flex';
    });

    paperForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('paperId').value;
        const submitBtn = document.getElementById('submitBtn');
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            if (id) {
                // Update Metadata
                await papersAPI.update(id, {
                    title: document.getElementById('paperTitle').value.trim(),
                    subject: document.getElementById('paperSubject').value.trim(),
                    year: parseInt(document.getElementById('paperYear').value),
                    branch: document.getElementById('paperBranch').value,
                    semester: document.getElementById('paperSemester').value
                });
                alert('Paper info updated!');
            } else {
                // Upload New Paper
                if (!paperFile.files[0]) {
                    alert("Please select a PDF file.");
                    return;
                }
                
                const formData = new FormData();
                formData.append('title', document.getElementById('paperTitle').value.trim());
                formData.append('subject', document.getElementById('paperSubject').value.trim());
                formData.append('year', document.getElementById('paperYear').value);
                formData.append('branch', document.getElementById('paperBranch').value);
                formData.append('semester', document.getElementById('paperSemester').value);
                formData.append('file', paperFile.files[0]);
                
                await papersAPI.upload(formData);
                alert('Exam paper uploaded successfully!');
            }
            loadPapers();
            closePaperModal();
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Upload';
        }
    });

    window.closePaperModal = () => { paperModal.style.display = 'none'; };

    window.editPaper = async (id) => {
        try {
            const papers = await papersAPI.getAll();
            const paper = papers.find(p => p.id === id);
            if (!paper) throw new Error('Paper not found');
            
            document.getElementById('paperId').value = paper.id;
            document.getElementById('paperModalTitle').textContent = 'Edit Paper Info';
            document.getElementById('paperTitle').value = paper.title;
            document.getElementById('paperSubject').value = paper.subject;
            document.getElementById('paperYear').value = paper.year;
            document.getElementById('paperBranch').value = paper.branch;
            document.getElementById('paperSemester').value = paper.semester;
            
            fileUploadGroup.style.display = 'none';
            paperFile.required = false;
            
            document.getElementById('submitBtn').innerHTML = 'Update Details';
            
            paperModal.style.display = 'flex';
        } catch (error) {
            alert('Failed to edit: ' + error.message);
        }
    };

    window.deletePaper = async (id) => {
        if (confirm('Delete this exam paper? The PDF file will be permanently removed.')) {
            try {
                await papersAPI.delete(id);
                loadPapers();
            } catch (error) {
                alert('Failed to delete: ' + error.message);
            }
        }
    };

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
});
