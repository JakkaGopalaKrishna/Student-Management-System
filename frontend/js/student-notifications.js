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
    const notificationsListEl = document.getElementById('notificationsList');
    const navUnreadBadge = document.getElementById('navUnreadBadge');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    
    let allNotifications = [];

    const loadNotifications = async () => {
        try {
            allNotifications = await notificationsAPI.getAll();
            renderNotificationsList();
            updateUnreadCount();
        } catch (error) {
            console.error('Failed to load notifications', error);
            notificationsListEl.innerHTML = '<div style="color: var(--danger-color); text-align: center; padding: 20px;">Failed to load announcements.</div>';
        }
    };

    const updateUnreadCount = () => {
        const unreadCount = allNotifications.filter(n => !n.is_read).length;
        if (unreadCount > 0) {
            navUnreadBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            navUnreadBadge.style.display = 'flex';
            markAllReadBtn.style.display = 'inline-block';
        } else {
            navUnreadBadge.style.display = 'none';
            markAllReadBtn.style.display = 'none';
        }
    };

    const renderNotificationsList = () => {
        notificationsListEl.innerHTML = '';
        
        if (allNotifications.length === 0) {
            notificationsListEl.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 40px;"><i class="fas fa-bell-slash fa-3x" style="margin-bottom: 16px; color: var(--border-color);"></i><br>No new announcements.</div>';
            return;
        }

        allNotifications.forEach(n => {
            const dateStr = new Date(n.created_at).toLocaleString();
            
            const item = document.createElement('div');
            item.className = `notification-card ${n.is_read ? '' : 'unread'}`;
            
            let html = `
                <div class="notification-header">
                    <div class="notification-title-group">
                        ${n.is_read ? '' : '<span style="color: var(--primary-color);"><i class="fas fa-circle" style="font-size: 8px;"></i></span>'}
                        <span class="priority-badge priority-${n.priority}">${n.priority}</span>
                        <h4 class="notification-title">${n.title}</h4>
                    </div>
                    <span class="notification-time">${dateStr}</span>
                </div>
                <p class="notification-message">${n.message}</p>
            `;

            if (!n.is_read) {
                html += `<button class="btn-mark-read" onclick="markRead(${n.id})">Mark as read</button>`;
            }

            item.innerHTML = html;
            notificationsListEl.appendChild(item);
        });
    };

    window.markRead = async (id) => {
        try {
            await notificationsAPI.markAsRead(id);
            // Update local state without full reload
            const notif = allNotifications.find(n => n.id === id);
            if (notif) {
                notif.is_read = true;
            }
            renderNotificationsList();
            updateUnreadCount();
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    };

    markAllReadBtn.addEventListener('click', async () => {
        try {
            await notificationsAPI.markAllAsRead();
            allNotifications.forEach(n => n.is_read = true);
            renderNotificationsList();
            updateUnreadCount();
        } catch (error) {
            console.error('Failed to mark all read', error);
        }
    });

    // Initial Load
    loadNotifications();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
});
