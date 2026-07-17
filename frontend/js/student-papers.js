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
    const searchYear = document.getElementById('searchYear');
    const searchSemester = document.getElementById('searchSemester');
    const searchBtn = document.getElementById('searchBtn');
    
    const papersContainer = document.getElementById('papersContainer');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');

    const loadPapers = async () => {
        try {
            papersContainer.innerHTML = '';
            papersContainer.style.display = 'none';
            emptyState.style.display = 'none';
            loadingState.style.display = 'block';

            // By default, if no branch is searched, we might want to default to the student's branch
            let searchBranch = '';
            if (currentUser.student_profile) {
                searchBranch = currentUser.student_profile.branch;
            }

            const papers = await papersAPI.getAll(
                searchBranch, 
                searchSemester.value, 
                '', 
                searchYear.value,
                searchKeyword.value.trim()
            );
            
            loadingState.style.display = 'none';

            if (papers.length === 0) {
                emptyState.style.display = 'block';
                return;
            }

            papersContainer.style.display = 'grid';

            papers.forEach(paper => {
                const pdfUrl = `http://localhost:8000/${paper.file_path}`;
                
                const card = document.createElement('div');
                card.className = 'paper-card';
                card.innerHTML = `
                    <div class="year-badge">${paper.year}</div>
                    <div class="paper-header">
                        <i class="fas fa-file-pdf paper-icon"></i>
                        <div>
                            <h3 class="paper-title">${paper.title}</h3>
                            <p class="paper-subject">${paper.subject}</p>
                        </div>
                    </div>
                    <div class="paper-body">
                        <div class="paper-meta">
                            <i class="fas fa-code-branch"></i> ${paper.branch}
                        </div>
                        <div class="paper-meta">
                            <i class="fas fa-graduation-cap"></i> ${paper.semester} Semester
                        </div>
                    </div>
                    <div class="paper-actions">
                        <a href="${pdfUrl}" target="_blank" class="btn btn-outline btn-full">
                            <i class="fas fa-eye"></i> Preview
                        </a>
                        <a href="${pdfUrl}" download class="btn btn-primary btn-full">
                            <i class="fas fa-download"></i> Download
                        </a>
                    </div>
                `;
                papersContainer.appendChild(card);
            });
            
        } catch (error) {
            console.error('Failed to load papers', error);
            loadingState.style.display = 'none';
            emptyState.style.display = 'block';
            emptyState.innerHTML = `<h3 style="color: var(--danger-color)">Error loading papers</h3><p>${error.message}</p>`;
        }
    };

    searchBtn.addEventListener('click', loadPapers);
    
    // Initial Load
    if (currentUser.student_profile) {
        searchSemester.value = currentUser.student_profile.semester;
    }
    
    loadPapers();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
});
