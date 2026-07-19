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

    const internalMarksTable = document.getElementById('internalMarksTable');
    const externalMarksTable = document.getElementById('externalMarksTable');
    const semesterResultsContainer = document.getElementById('semesterResultsContainer');

    const getGrade = (percentage) => {
        if (percentage >= 90) return { label: 'O', class: 'grade-excellent' };
        if (percentage >= 80) return { label: 'A+', class: 'grade-excellent' };
        if (percentage >= 70) return { label: 'A', class: 'grade-good' };
        if (percentage >= 60) return { label: 'B+', class: 'grade-good' };
        if (percentage >= 50) return { label: 'B', class: 'grade-average' };
        if (percentage >= 40) return { label: 'C', class: 'grade-average' };
        return { label: 'F', class: 'grade-poor' };
    };

    const renderMarksTable = (marksArray, tableElement) => {
        tableElement.innerHTML = '';
        if (marksArray.length === 0) {
            tableElement.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No marks recorded yet.</td></tr>';
            return;
        }

        // Sort by semester then subject
        marksArray.sort((a, b) => a.semester.localeCompare(b.semester) || a.subject.localeCompare(b.subject));

        marksArray.forEach(mark => {
            const perc = mark.max_marks > 0 ? (mark.marks_obtained / mark.max_marks) * 100 : 0;
            const grade = getGrade(perc);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${mark.semester}</td>
                <td><strong>${mark.subject}</strong></td>
                <td>${mark.marks_obtained}</td>
                <td>${mark.max_marks}</td>
                <td><span class="grade-badge ${grade.class}">${grade.label}</span></td>
            `;
            tableElement.appendChild(tr);
        });
    };

    const loadStats = async () => {
        try {
            const stats = await marksAPI.getStats();
            
            // Overall Stats
            document.getElementById('overallPercentage').textContent = `${stats.overall_percentage}%`;
            
            // If they have any semester results, show the latest SGPA
            if (stats.semester_results.length > 0) {
                // Since they are sorted alphabetically (1st, 2nd, etc), the last one is likely the latest.
                // For a more robust app, you'd sort by actual academic year/term logic.
                const latest = stats.semester_results[stats.semester_results.length - 1];
                document.getElementById('latestSgpa').textContent = latest.sgpa.toFixed(2);
            }

            // Render Tables
            renderMarksTable(stats.internal_marks, internalMarksTable);
            renderMarksTable(stats.external_marks, externalMarksTable);

            // Render Semester Results
            semesterResultsContainer.innerHTML = '';
            if (stats.semester_results.length === 0) {
                semesterResultsContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No semester results available.</p>';
            } else {
                stats.semester_results.forEach(sem => {
                    const div = document.createElement('div');
                    div.className = 'semester-card';
                    div.innerHTML = `
                        <div>
                            <h4 style="margin-bottom: 4px;">${sem.semester} Semester</h4>
                            <p style="font-size: 0.875rem; color: var(--text-secondary);">Marks: ${sem.total_obtained} / ${sem.total_max}</p>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${sem.sgpa.toFixed(2)}</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">SGPA (${sem.percentage}%)</div>
                        </div>
                    `;
                    semesterResultsContainer.appendChild(div);
                });
            }
        } catch (error) {
            console.error('Failed to load marks stats', error);
        }
    };

    loadStats();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    });
})();
