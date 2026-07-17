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

    // Modal Elements
    const notifModal = document.getElementById('notifModal');
    const notifForm = document.getElementById('notifForm');
    const notificationsListEl = document.getElementById('notificationsList');
    
    let allNotifications = [];

    const loadNotifications = async () => {
        try {
            allNotifications = await notificationsAPI.getAll();
            renderNotificationsList();
        } catch (error) {
            console.error('Failed to load notifications', error);
            alert('Failed to load notifications: ' + error.message);
        }
    };

    const renderNotificationsList = () => {
        notificationsListEl.innerHTML = '';
        
        if (allNotifications.length === 0) {
            notificationsListEl.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">No announcements sent yet.</div>';
            return;
        }

        allNotifications.forEach(n => {
            const dateStr = new Date(n.created_at).toLocaleString();
            
            const item = document.createElement('div');
            item.className = 'notification-card';
            item.innerHTML = `
                <div class="notification-content">
                    <div class="notification-header">
                        <span class="priority-badge priority-${n.priority}">${n.priority}</span>
                        <h4 class="notification-title">${n.title}</h4>
                    </div>
                    <span class="notification-time">${dateStr}</span>
                    <p class="notification-message" style="margin-top: 8px;">${n.message}</p>
                </div>
                <div class="action-btns" style="flex-direction: column;">
                    <button class="btn-edit" onclick="editNotif(${n.id})" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="deleteNotif(${n.id})" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            `;
            notificationsListEl.appendChild(item);
        });
    };

    // Modal Actions
    window.openNotifModal = () => {
        notifForm.reset();
        document.getElementById('notifId').value = '';
        document.getElementById('notifModalTitle').textContent = 'Broadcast Announcement';
        notifModal.style.display = 'flex';
    };

    window.closeNotifModal = () => {
        notifModal.style.display = 'none';
    };

    notifForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('notifId').value;
        const submitBtn = document.getElementById('submitBtn');
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            
            const payload = {
                title: document.getElementById('notifTitle').value.trim(),
                priority: document.getElementById('notifPriority').value,
                message: document.getElementById('notifMessage').value.trim()
            };

            if (id) {
                await notificationsAPI.update(id, payload);
            } else {
                await notificationsAPI.create(payload);
            }
            
            closeNotifModal();
            loadNotifications();
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Send Announcement';
        }
    });

    window.editNotif = (id) => {
        const notif = allNotifications.find(n => n.id === id);
        if (!notif) return;
        
        document.getElementById('notifId').value = notif.id;
        document.getElementById('notifModalTitle').textContent = 'Edit Announcement';
        document.getElementById('notifTitle').value = notif.title;
        document.getElementById('notifPriority').value = notif.priority;
        document.getElementById('notifMessage').value = notif.message;
        
        notifModal.style.display = 'flex';
    };

    window.deleteNotif = async (id) => {
        if (confirm('Are you sure you want to delete this announcement?')) {
            try {
                await notificationsAPI.delete(id);
                loadNotifications();
            } catch (error) {
                alert('Failed to delete: ' + error.message);
            }
        }
    };

    // Initial Load
    loadNotifications();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
});
