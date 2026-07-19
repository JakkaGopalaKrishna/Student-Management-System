(async () => {
    // Only run this script on dashboard pages
    if (!window.location.pathname.includes('dashboard')) return;

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }

    let currentUser = null;

    try {
        currentUser = await authAPI.getMe();
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userRole').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
        
        // Role based UI logic
        if (currentUser.role === 'admin') {
            const navSettings = document.getElementById('navSettings');
            if (navSettings) navSettings.style.display = 'flex';
            
            const adminDash = document.getElementById('adminDashboard');
            if (adminDash) {
                adminDash.style.display = 'block';
                
                // Fetch stats and render
                try {
                    const stats = await dashboardAPI.getStats();
                    
                    const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
                    
                    const setText = (id, text) => {
                        const el = document.getElementById(id);
                        if (el) el.textContent = text;
                    };
                    
                    setText('stat-total-students', stats.total_students.toLocaleString());
                    setText('stat-total-branches', stats.total_branches.toLocaleString());
                    setText('stat-total-subjects', stats.total_subjects.toLocaleString());
                    setText('stat-total-notes', stats.total_notes.toLocaleString());
                    setText('stat-total-papers', stats.total_papers.toLocaleString());
                    setText('stat-notifications', stats.notifications.toLocaleString());
                    setText('stat-holidays', stats.holidays.toLocaleString());
                    
                    setText('stat-fee-collected', formatCurrency(stats.fee_collected));
                    setText('stat-fee-pending', formatCurrency(stats.fee_pending));
                    
                    setText('stat-attendance-percent', stats.overall_attendance_percent + '%');
                } catch (error) {
                    console.error('Failed to load dashboard stats', error);
                }
            } else if (window.location.pathname.endsWith('/dashboard.html')) {
                // Fallback: If Admin ended up on the root dashboard, redirect to admin portal
                window.location.href = '/admin/dashboard/index.html';
                return;
            }
        } else if (currentUser.role === 'teacher') {
            // Teacher dashboard (could share with student dashboard for now or have its own)
            document.getElementById('studentDashboard').style.display = 'block';
            document.getElementById('displayStudentName').textContent = currentUser.name;
        } else {
            document.getElementById('studentDashboard').style.display = 'block';
            document.getElementById('displayStudentName').textContent = currentUser.name;

            // Show student-only elements (like notification bell)
            document.querySelectorAll('.student-only').forEach(el => {
                el.style.display = 'flex'; 
            });

            // Fetch notifications
            try {
                const notifications = await notificationsAPI.getAll();
                const unreadCount = notifications.filter(n => !n.is_read).length;
                const badge = document.getElementById('navUnreadBadge');
                if (badge && unreadCount > 0) {
                    badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                    badge.style.display = 'flex';
                }
            } catch (error) {
                console.error('Failed to load notifications', error);
            }
            
            // If on dashboard, load stats
            if (window.location.pathname.endsWith('/dashboard.html')) {
                try {
                    const [attStats, marksStats, feeStats] = await Promise.all([
                        attendanceAPI.getStats().catch(() => null),
                        marksAPI.getStats().catch(() => null),
                        feesAPI.getStats().catch(() => null)
                    ]);
                    
                    if (attStats) {
                        const el = document.getElementById('student-stat-attendance');
                        if (el) el.textContent = attStats.overall_percentage + '%';
                    }
                    
                    if (marksStats && marksStats.semester_results && marksStats.semester_results.length > 0) {
                        const el = document.getElementById('student-stat-sgpa');
                        // Get latest SGPA
                        const latest = marksStats.semester_results[marksStats.semester_results.length - 1].sgpa;
                        if (el) el.textContent = latest;
                    } else {
                        const el = document.getElementById('student-stat-sgpa');
                        if (el) el.textContent = 'N/A';
                    }
                    
                    if (feeStats) {
                        const el = document.getElementById('student-stat-fee');
                        if (el) {
                            if (feeStats.total_pending === 0 && feeStats.total_fees_demanded > 0) {
                                el.textContent = 'Paid';
                                el.style.color = 'var(--success-color)';
                            } else if (feeStats.total_pending > 0) {
                                el.textContent = 'Pending';
                                el.style.color = 'var(--danger-color)';
                            } else {
                                el.textContent = 'No Fees';
                                el.style.color = 'var(--text-secondary)';
                            }
                        }
                    }
                } catch (error) {
                    console.error('Failed to load student stats', error);
                }
            }
        }
    } catch (error) {
        console.error('Failed to load user session');
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    }

    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    });

    // Sidebar Toggle for Mobile
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Change Password Modal Logic
    const changePasswordModal = document.getElementById('changePasswordModal');
    const navChangePassword = document.getElementById('navChangePassword');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const modalMessage = document.getElementById('modalMessage');

    navChangePassword.addEventListener('click', () => {
        changePasswordModal.style.display = 'flex';
        changePasswordForm.reset();
        modalMessage.style.display = 'none';
    });

    closeModalBtn.addEventListener('click', () => {
        changePasswordModal.style.display = 'none';
    });

    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPasswordChange').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        const submitBtn = changePasswordForm.querySelector('button[type="submit"]');

        if (newPassword !== confirmNewPassword) {
            showModalMessage('New passwords do not match.', 'error');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            
            await authAPI.changePassword(currentPassword, newPassword);
            showModalMessage('Password updated successfully.', 'success');
            changePasswordForm.reset();
            
            setTimeout(() => {
                changePasswordModal.style.display = 'none';
            }, 2000);
        } catch (error) {
            showModalMessage(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Update Password';
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

    // Global Search Logic
    const searchInput = document.getElementById('globalSearchInput');
    const searchDropdown = document.getElementById('searchResultsDropdown');

    if (searchInput) {
        let debounceTimer;
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!document.getElementById('globalSearchContainer').contains(e.target)) {
                searchDropdown.style.display = 'none';
            }
        });

        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length >= 2) {
                searchDropdown.style.display = 'block';
            }
        });

        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value.trim();

            if (query.length < 2) {
                searchDropdown.style.display = 'none';
                return;
            }

            debounceTimer = setTimeout(async () => {
                try {
                    searchDropdown.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-secondary);"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
                    searchDropdown.style.display = 'block';

                    const response = await searchAPI.query(query);
                    const results = response.results;

                    if (results.length === 0) {
                        searchDropdown.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-secondary);">No results found.</div>';
                        return;
                    }

                    // Group results by type
                    const grouped = results.reduce((acc, curr) => {
                        if (!acc[curr.type]) acc[curr.type] = [];
                        acc[curr.type].push(curr);
                        return acc;
                    }, {});

                    let html = '';
                    const icons = {
                        student: 'fa-user-graduate',
                        note: 'fa-book',
                        paper: 'fa-file-pdf',
                        syllabus: 'fa-list-alt',
                        notification: 'fa-bell'
                    };

                    const titles = {
                        student: 'Students',
                        note: 'Notes',
                        paper: 'Previous Papers',
                        syllabus: 'Syllabus / Subjects',
                        notification: 'Announcements'
                    };

                    for (const [type, items] of Object.entries(grouped)) {
                        html += `
                            <div style="background: var(--bg-hover); padding: 8px 16px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary);">
                                ${titles[type]}
                            </div>
                        `;
                        items.forEach(item => {
                            html += `
                                <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); cursor: pointer; display: flex; align-items: center; gap: 12px; transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='transparent'" onclick="window.location.href='${item.link}'">
                                    <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(59, 130, 246, 0.1); color: var(--primary-color); display: flex; align-items: center; justify-content: center;">
                                        <i class="fas ${icons[type]}"></i>
                                    </div>
                                    <div>
                                        <div style="font-weight: 600; color: var(--text-primary); font-size: 0.875rem;">${item.title}</div>
                                        ${item.subtitle ? `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${item.subtitle}</div>` : ''}
                                    </div>
                                </div>
                            `;
                        });
                    }

                    searchDropdown.innerHTML = html;
                } catch (error) {
                    console.error('Search failed', error);
                    searchDropdown.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--danger-color);">Error loading results.</div>';
                }
            }, 300);
        });
    }
})();
