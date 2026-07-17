const BASE_URL = 'http://localhost:8000/api';

const fetchAPI = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    
    const headers = { ...options.headers };
    
    // Auto-set JSON content type if it's not FormData
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'An error occurred');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

const authAPI = {
    login: async (email, password) => {
        const formData = new URLSearchParams();
        formData.append('username', email); // OAuth2 expects 'username'
        formData.append('password', password);

        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'Login failed');
        }
        return data;
    },
    register: (name, email, password) => fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ full_name: name, email, password })
    }),
    forgotPassword: (email) => fetchAPI('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
    }),
    changePassword: (currentPassword, newPassword) => fetchAPI('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    }),
    getMe: () => fetchAPI('/auth/me'),
};

const studentsAPI = {
    getAll: async (search = '', branch = '', semester = '') => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (branch) params.append('branch', branch);
        if (semester) params.append('semester', semester);
        return fetchAPI(`/students/?${params.toString()}`);
    },
    
    getById: async (id) => {
        return fetchAPI(`/students/${id}`);
    },
    
    create: async (data) => {
        return fetchAPI('/students/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    update: async (id, data) => {
        return fetchAPI(`/students/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    delete: async (id) => {
        return fetchAPI(`/students/${id}`, {
            method: 'DELETE'
        });
    },
    
    uploadPhoto: async (id, file) => {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${BASE_URL}/students/${id}/photo`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Note: Don't set Content-Type here, browser sets it with boundaries for FormData
            },
            body: formData
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'Photo upload failed');
        }
        return data;
    }
};

const attendanceAPI = {
    getAll: async (student_id = '', subject = '', target_date = '') => {
        const params = new URLSearchParams();
        if (student_id) params.append('student_id', student_id);
        if (subject) params.append('subject', subject);
        if (target_date) params.append('target_date', target_date);
        return fetchAPI(`/attendance/?${params.toString()}`);
    },
    
    createBulk: async (data) => {
        return fetchAPI('/attendance/bulk', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    update: async (id, data) => {
        return fetchAPI(`/attendance/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    delete: async (id) => {
        return fetchAPI(`/attendance/${id}`, {
            method: 'DELETE'
        });
    },
    
    getStats: async () => {
        return fetchAPI('/attendance/me/stats');
    }
};

const marksAPI = {
    getAll: async (student_id = '', subject = '', semester = '', exam_type = '') => {
        const params = new URLSearchParams();
        if (student_id) params.append('student_id', student_id);
        if (subject) params.append('subject', subject);
        if (semester) params.append('semester', semester);
        if (exam_type) params.append('exam_type', exam_type);
        return fetchAPI(`/marks/?${params.toString()}`);
    },
    
    create: async (data) => {
        return fetchAPI('/marks/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    update: async (id, data) => {
        return fetchAPI(`/marks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    delete: async (id) => {
        return fetchAPI(`/marks/${id}`, {
            method: 'DELETE'
        });
    },
    
    getStats: async () => {
        return fetchAPI('/marks/me/stats');
    }
};

const feesAPI = {
    getAll: async (student_id = '', status = '') => {
        const params = new URLSearchParams();
        if (student_id) params.append('student_id', student_id);
        if (status) params.append('status', status);
        return fetchAPI(`/fees/?${params.toString()}`);
    },
    
    create: async (data) => {
        return fetchAPI('/fees/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    update: async (id, data) => {
        return fetchAPI(`/fees/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    delete: async (id) => {
        return fetchAPI(`/fees/${id}`, {
            method: 'DELETE'
        });
    },
    
    recordPayment: async (fee_id, data) => {
        return fetchAPI(`/fees/${fee_id}/payments`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    getStats: async () => {
        return fetchAPI('/fees/me/stats');
    }
};

const notesAPI = {
    getAll: async (branch = '', semester = '', subject = '', search = '') => {
        const params = new URLSearchParams();
        if (branch) params.append('branch', branch);
        if (semester) params.append('semester', semester);
        if (subject) params.append('subject', subject);
        if (search) params.append('search', search);
        return fetchAPI(`/notes/?${params.toString()}`);
    },
    
    upload: async (formData) => {
        // formData is a FormData object containing file and fields
        return fetchAPI('/notes/', {
            method: 'POST',
            body: formData
        });
    },
    
    update: async (id, data) => {
        return fetchAPI(`/notes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    delete: async (id) => {
        return fetchAPI(`/notes/${id}`, {
            method: 'DELETE'
        });
    }
};

const papersAPI = {
    getAll: async (branch = '', semester = '', subject = '', year = '', search = '') => {
        const params = new URLSearchParams();
        if (branch) params.append('branch', branch);
        if (semester) params.append('semester', semester);
        if (subject) params.append('subject', subject);
        if (year) params.append('year', year);
        if (search) params.append('search', search);
        return fetchAPI(`/papers/?${params.toString()}`);
    },
    
    upload: async (formData) => {
        return fetchAPI('/papers/', {
            method: 'POST',
            body: formData
        });
    },
    
    update: async (id, data) => {
        return fetchAPI(`/papers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    delete: async (id) => {
        return fetchAPI(`/papers/${id}`, {
            method: 'DELETE'
        });
    }
};
