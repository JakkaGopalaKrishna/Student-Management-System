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
    const profileName = document.getElementById('profileName');
    const profileRoll = document.getElementById('profileRoll');
    const profileBranch = document.getElementById('profileBranch');
    const profileSemester = document.getElementById('profileSemester');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhoto = document.getElementById('profilePhoto');
    
    const inputPhone = document.getElementById('inputPhone');
    const inputParent = document.getElementById('inputParent');
    const inputAddress = document.getElementById('inputAddress');
    const saveActions = document.getElementById('saveActions');
    const editBtn = document.getElementById('editBtn');
    
    // Populate Profile
    const populateProfile = (user) => {
        profileName.textContent = user.full_name;
        profileEmail.textContent = user.email;
        
        if (user.student_profile) {
            const p = user.student_profile;
            profileRoll.textContent = p.roll_number;
            profileBranch.textContent = p.branch;
            profileSemester.textContent = p.semester;
            
            inputPhone.value = p.phone || '';
            inputParent.value = p.parent_details || '';
            inputAddress.value = p.address || '';
            
            if (p.profile_photo) {
                profilePhoto.src = p.profile_photo.startsWith('http') ? p.profile_photo : `http://localhost:8000${p.profile_photo}`;
            } else {
                profilePhoto.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random`;
            }
        }
    };
    
    populateProfile(currentUser);

    // Profile Edit Logic
    window.toggleEdit = () => {
        inputPhone.disabled = false;
        inputParent.disabled = false;
        inputAddress.disabled = false;
        saveActions.style.display = 'flex';
        editBtn.style.display = 'none';
        inputPhone.focus();
    };

    window.cancelEdit = () => {
        inputPhone.disabled = true;
        inputParent.disabled = true;
        inputAddress.disabled = true;
        saveActions.style.display = 'none';
        editBtn.style.display = 'inline-block';
        
        // Reset to current values
        populateProfile(currentUser);
    };

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('saveProfileBtn');
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            const payload = {
                phone: inputPhone.value.trim(),
                parent_details: inputParent.value.trim(),
                address: inputAddress.value.trim()
            };
            
            currentUser = await studentsAPI.updateMe(payload);
            
            alert('Profile updated successfully!');
            
            inputPhone.disabled = true;
            inputParent.disabled = true;
            inputAddress.disabled = true;
            saveActions.style.display = 'none';
            editBtn.style.display = 'inline-block';
            
        } catch (error) {
            alert('Error updating profile: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Changes';
        }
    });

    // Profile Photo Upload Logic
    const photoUpload = document.getElementById('photoUpload');
    photoUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // Optimistic UI update
            const reader = new FileReader();
            reader.onload = (e) => {
                profilePhoto.src = e.target.result;
            };
            reader.readAsDataURL(file);

            const result = await studentsAPI.uploadPhoto(currentUser.id, file);
            // Update current user photo URL
            if(currentUser.student_profile) {
                currentUser.student_profile.profile_photo = result.profile_photo;
            }
            alert('Profile photo updated successfully!');
        } catch (error) {
            alert('Failed to upload photo: ' + error.message);
            // Revert photo
            populateProfile(currentUser);
        }
    });

    // Password Update Logic
    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const btn = document.getElementById('updatePwdBtn');

        if (newPassword !== confirmPassword) {
            alert('New passwords do not match!');
            return;
        }

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            
            await authAPI.changePassword(currentPassword, newPassword);
            
            alert('Password updated successfully! Please login again with your new password.');
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Update Password';
            document.getElementById('passwordForm').reset();
        }
    });

    // Fetch and Populate Dashboard Summary Stats
    const loadStats = async () => {
        try {
            // Fetch concurrently
            const [attStats, marksStats, feesStats] = await Promise.all([
                attendanceAPI.getStats(),
                marksAPI.getStats(),
                feesAPI.getStats()
            ]);

            document.getElementById('statAttendance').textContent = `${attStats.percentage}%`;
            document.getElementById('statMarks').textContent = `${marksStats.overall_percentage}%`;
            document.getElementById('statFees').textContent = `$${feesStats.pending_amount}`;
            
            // Color coding based on stats
            if (attStats.percentage < 75) {
                document.getElementById('statAttendance').style.color = 'var(--danger-color)';
            }
            if (feesStats.pending_amount > 0) {
                document.getElementById('statFees').style.color = 'var(--danger-color)';
            } else {
                document.getElementById('statFees').style.color = 'var(--success-color)';
            }

        } catch (error) {
            console.error('Failed to load some profile stats', error);
        }
    };

    loadStats();

    // Notification Badge
    const loadNotificationBadge = async () => {
        try {
            const notifications = await notificationsAPI.getAll();
            const unreadCount = notifications.filter(n => !n.is_read).length;
            const badge = document.getElementById('navUnreadBadge');
            if (badge && unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'flex';
            }
        } catch (e) {}
    };
    loadNotificationBadge();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
});
