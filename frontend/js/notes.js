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
    const searchBranch = document.getElementById('searchBranch');
    const searchSemester = document.getElementById('searchSemester');
    const searchBtn = document.getElementById('searchBtn');
    const notesTableBody = document.getElementById('notesTableBody');
    
    // Note Modal
    const noteModal = document.getElementById('noteModal');
    const noteForm = document.getElementById('noteForm');
    const fileUploadGroup = document.getElementById('fileUploadGroup');
    const noteFile = document.getElementById('noteFile');
    
    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    };

    // Load Notes
    const loadNotes = async () => {
        try {
            const notes = await notesAPI.getAll(
                searchBranch.value, 
                searchSemester.value, 
                '', 
                searchKeyword.value.trim()
            );
            
            notesTableBody.innerHTML = '';
            
            if (notes.length === 0) {
                notesTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px;">No notes found.</td></tr>';
                return;
            }

            notes.forEach(note => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${note.title}</strong></td>
                    <td>${note.subject}</td>
                    <td>${note.branch}</td>
                    <td>${note.semester}</td>
                    <td>${formatDate(note.upload_date)}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-view" onclick="window.open('http://localhost:8000/${note.file_path}', '_blank')" title="View PDF"><i class="fas fa-eye"></i></button>
                            <button class="btn-edit" onclick="editNote(${note.id})" title="Edit Metadata"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="deleteNote(${note.id})" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
                notesTableBody.appendChild(tr);
            });
        } catch (error) {
            console.error('Failed to load notes', error);
            notesTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger-color);">Error loading data.</td></tr>';
        }
    };

    searchBtn.addEventListener('click', loadNotes);
    loadNotes();

    // Add Note Modal
    document.getElementById('openUploadModalBtn').addEventListener('click', () => {
        noteForm.reset();
        document.getElementById('noteId').value = '';
        document.getElementById('noteModalTitle').textContent = 'Upload Notes';
        fileUploadGroup.style.display = 'block';
        noteFile.required = true;
        noteModal.style.display = 'flex';
    });

    noteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('noteId').value;
        const submitBtn = document.getElementById('submitBtn');
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            if (id) {
                // Update Metadata only
                await notesAPI.update(id, {
                    title: document.getElementById('noteTitle').value.trim(),
                    subject: document.getElementById('noteSubject').value.trim(),
                    branch: document.getElementById('noteBranch').value,
                    semester: document.getElementById('noteSemester').value
                });
                alert('Note updated!');
            } else {
                // Upload New Note
                if (!noteFile.files[0]) {
                    alert("Please select a PDF file.");
                    return;
                }
                
                const formData = new FormData();
                formData.append('title', document.getElementById('noteTitle').value.trim());
                formData.append('subject', document.getElementById('noteSubject').value.trim());
                formData.append('branch', document.getElementById('noteBranch').value);
                formData.append('semester', document.getElementById('noteSemester').value);
                formData.append('file', noteFile.files[0]);
                
                await notesAPI.upload(formData);
                alert('Note uploaded successfully!');
            }
            loadNotes();
            closeNoteModal();
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Upload';
        }
    });

    window.closeNoteModal = () => { noteModal.style.display = 'none'; };

    window.editNote = async (id) => {
        try {
            const notes = await notesAPI.getAll();
            const note = notes.find(n => n.id === id);
            if (!note) throw new Error('Note not found');
            
            document.getElementById('noteId').value = note.id;
            document.getElementById('noteModalTitle').textContent = 'Edit Note Info';
            document.getElementById('noteTitle').value = note.title;
            document.getElementById('noteSubject').value = note.subject;
            document.getElementById('noteBranch').value = note.branch;
            document.getElementById('noteSemester').value = note.semester;
            
            // Hide file upload for edit
            fileUploadGroup.style.display = 'none';
            noteFile.required = false;
            
            document.getElementById('submitBtn').innerHTML = 'Update Details';
            
            noteModal.style.display = 'flex';
        } catch (error) {
            alert('Failed to edit: ' + error.message);
        }
    };

    window.deleteNote = async (id) => {
        if (confirm('Delete this note? The PDF file will be permanently removed.')) {
            try {
                await notesAPI.delete(id);
                loadNotes();
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
