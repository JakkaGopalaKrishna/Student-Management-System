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
        if (currentUser.role !== 'student') {
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
    
    const syllabusContainer = document.getElementById('syllabusContainer');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');

    const loadSyllabus = async () => {
        try {
            syllabusContainer.innerHTML = '';
            syllabusContainer.style.display = 'none';
            emptyState.style.display = 'none';
            loadingState.style.display = 'block';

            // Default branch/semester from student profile if not specified
            let queryBranch = searchBranch.value;
            let querySemester = searchSemester.value;

            // Only on initial load (when fields are completely empty) use the profile
            if (!queryBranch && !querySemester && currentUser.student_profile && !searchKeyword.value) {
                queryBranch = currentUser.student_profile.branch;
                querySemester = currentUser.student_profile.semester;
                searchBranch.value = queryBranch;
                searchSemester.value = querySemester;
            }

            const syllabuses = await syllabusAPI.getAll(
                queryBranch, 
                querySemester, 
                searchKeyword.value.trim()
            );
            
            loadingState.style.display = 'none';

            if (syllabuses.length === 0) {
                emptyState.style.display = 'block';
                return;
            }

            syllabusContainer.style.display = 'grid';

            syllabuses.forEach(syllabus => {
                const pdfUrl = `http://localhost:8000/${syllabus.file_path}`;
                
                const card = document.createElement('div');
                card.className = 'syllabus-card';
                card.innerHTML = `
                    <div class="syllabus-header">
                        <i class="fas fa-list-alt syllabus-icon"></i>
                        <div>
                            <h3 class="syllabus-title">${syllabus.title}</h3>
                        </div>
                    </div>
                    <div class="syllabus-body">
                        <div class="syllabus-meta">
                            <i class="fas fa-code-branch"></i> ${syllabus.branch}
                        </div>
                        <div class="syllabus-meta">
                            <i class="fas fa-graduation-cap"></i> ${syllabus.semester} Semester
                        </div>
                    </div>
                    <div class="syllabus-actions">
                        <a href="${pdfUrl}" target="_blank" class="btn btn-outline btn-full">
                            <i class="fas fa-eye"></i> Preview
                        </a>
                        <a href="${pdfUrl}" download class="btn btn-primary btn-full">
                            <i class="fas fa-download"></i> Download
                        </a>
                    </div>
                `;
                syllabusContainer.appendChild(card);
            });
            
        } catch (error) {
            console.error('Failed to load syllabus', error);
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
            emptyState.innerHTML = `<h3 style="color: var(--danger-color)">Error loading syllabus</h3><p>${error.message}</p>`;
        }
    };

    searchBtn.addEventListener('click', loadSyllabus);
    
    loadSyllabus();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
});
