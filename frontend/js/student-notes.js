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
        if (currentUser.role !== 'student') {
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
    
    const notesContainer = document.getElementById('notesContainer');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString();
    };

    const loadNotes = async () => {
        try {
            notesContainer.innerHTML = '';
            notesContainer.style.display = 'none';
            emptyState.style.display = 'none';
            loadingState.style.display = 'block';

            const notes = await notesAPI.getAll(
                searchBranch.value, 
                searchSemester.value, 
                '', 
                searchKeyword.value.trim()
            );
            
            loadingState.style.display = 'none';

            if (notes.length === 0) {
                emptyState.style.display = 'block';
                return;
            }

            notesContainer.style.display = 'grid';

            notes.forEach(note => {
                const pdfUrl = `http://localhost:8000/${note.file_path}`;
                
                const card = document.createElement('div');
                card.className = 'note-card';
                card.innerHTML = `
                    <div class="note-header">
                        <i class="fas fa-file-pdf note-icon"></i>
                        <div>
                            <h3 class="note-title">${note.title}</h3>
                            <p class="note-subject">${note.subject}</p>
                        </div>
                    </div>
                    <div class="note-body">
                        <div class="note-meta">
                            <i class="fas fa-code-branch"></i> ${note.branch}
                        </div>
                        <div class="note-meta">
                            <i class="fas fa-graduation-cap"></i> ${note.semester} Semester
                        </div>
                        <div class="note-meta">
                            <i class="fas fa-clock"></i> Uploaded: ${formatDate(note.upload_date)}
                        </div>
                    </div>
                    <div class="note-actions">
                        <a href="${pdfUrl}" target="_blank" class="btn btn-outline btn-full">
                            <i class="fas fa-eye"></i> Preview
                        </a>
                        <a href="${pdfUrl}" download class="btn btn-primary btn-full">
                            <i class="fas fa-download"></i> Download
                        </a>
                    </div>
                `;
                notesContainer.appendChild(card);
            });
            
        } catch (error) {
            console.error('Failed to load notes', error);
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
            emptyState.innerHTML = `<h3 style="color: var(--danger-color)">Error loading notes</h3><p>${error.message}</p>`;
        }
    };

    searchBtn.addEventListener('click', loadNotes);
    
    // Initial Load - Optional: filter by user's branch/semester by default if available in currentUser Profile
    if (currentUser.student_profile) {
        searchBranch.value = currentUser.student_profile.branch;
        searchSemester.value = currentUser.student_profile.semester;
    }
    
    loadNotes();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    });
})();
