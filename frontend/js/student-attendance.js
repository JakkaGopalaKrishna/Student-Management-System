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

    const loadStats = async () => {
        try {
            const stats = await attendanceAPI.getStats();
            
            // Overall Stats
            document.getElementById('overallPercentage').textContent = `${stats.overall_percentage}%`;
            document.getElementById('overallClasses').textContent = `${stats.total_present + stats.total_late} / ${stats.total_classes} Classes Attended`;
            
            const progressBar = document.getElementById('overallProgressBar');
            progressBar.style.width = `${stats.overall_percentage}%`;
            
            if (stats.overall_percentage < 75) {
                progressBar.className = 'progress-bar-fill danger';
            } else if (stats.overall_percentage < 85) {
                progressBar.className = 'progress-bar-fill warning';
            } else {
                progressBar.className = 'progress-bar-fill';
            }

            document.getElementById('totalClasses').textContent = stats.total_classes;
            document.getElementById('totalPresent').textContent = stats.total_present;
            document.getElementById('totalAbsent').textContent = stats.total_absent;
            document.getElementById('totalLate').textContent = stats.total_late;

            // Subject Stats
            const subjectContainer = document.getElementById('subjectStatsContainer');
            subjectContainer.innerHTML = '';
            
            if (stats.subject_stats.length === 0) {
                subjectContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No subject data available.</p>';
            } else {
                stats.subject_stats.forEach(subj => {
                    let barClass = 'progress-bar-fill';
                    if (subj.percentage < 75) barClass += ' danger';
                    else if (subj.percentage < 85) barClass += ' warning';

                    const div = document.createElement('div');
                    div.style.marginBottom = '20px';
                    div.innerHTML = `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="font-weight: 500;">${subj.subject}</span>
                            <span><span style="font-weight: 600;">${subj.percentage}%</span> <span style="font-size: 0.875rem; color: var(--text-secondary);">(${subj.present + subj.late}/${subj.total_classes})</span></span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="${barClass}" style="width: ${subj.percentage}%;"></div>
                        </div>
                    `;
                    subjectContainer.appendChild(div);
                });
            }

            // Monthly Stats
            const monthlyContainer = document.getElementById('monthlyStatsContainer');
            monthlyContainer.innerHTML = '';
            
            if (stats.monthly_stats.length === 0) {
                monthlyContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No monthly data available.</p>';
            } else {
                stats.monthly_stats.forEach(month => {
                    // Convert "2023-10" to "Oct 2023"
                    const dateObj = new Date(month.month + "-01");
                    const monthName = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });

                    const div = document.createElement('div');
                    div.style.display = 'flex';
                    div.style.justifyContent = 'space-between';
                    div.style.alignItems = 'center';
                    div.style.padding = '12px 0';
                    div.style.borderBottom = '1px solid var(--border-color)';
                    
                    div.innerHTML = `
                        <span style="font-weight: 500; min-width: 100px;">${monthName}</span>
                        <div style="flex: 1; margin: 0 16px;">
                            <div class="progress-bar-container" style="margin-top: 0;">
                                <div class="progress-bar-fill ${month.percentage < 75 ? 'danger' : ''}" style="width: ${month.percentage}%;"></div>
                            </div>
                        </div>
                        <span style="font-weight: 600; min-width: 50px; text-align: right;">${month.percentage}%</span>
                    `;
                    monthlyContainer.appendChild(div);
                });
            }

        } catch (error) {
            console.error('Failed to load stats', error);
        }
    };

    loadStats();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    });
})();
