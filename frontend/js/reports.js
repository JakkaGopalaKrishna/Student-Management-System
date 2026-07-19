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
        if (currentUser.role !== 'admin') {
            window.location.href = '/dashboard.html';
            return;
        }
    } catch (error) {
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    }

    // Elements
    const reportType = document.getElementById('reportType');
    const filterBranch = document.getElementById('filterBranch');
    const filterSemester = document.getElementById('filterSemester');
    const generateBtn = document.getElementById('generateBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    const placeholderState = document.getElementById('placeholderState');
    const documentWrapper = document.getElementById('documentWrapper');
    
    const docTitle = document.getElementById('docTitle');
    const docSubtitle = document.getElementById('docSubtitle');
    const docDate = document.getElementById('docDate');
    const docFilters = document.getElementById('docFilters');
    
    const docSummaryContainer = document.getElementById('docSummaryContainer');
    const docTableHead = document.getElementById('docTableHead');
    const docTableBody = document.getElementById('docTableBody');

    const generateReport = async () => {
        const type = reportType.value;
        const branch = filterBranch.value;
        const sem = filterSemester.value;

        if (!type) {
            alert('Please select a report type first.');
            return;
        }

        try {
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            
            // Set Meta
            docDate.textContent = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            let filterText = [];
            if(branch) filterText.push(`Branch: ${branch}`);
            if(sem) filterText.push(`Semester: ${sem}`);
            docFilters.textContent = filterText.length > 0 ? filterText.join(' | ') : 'None (All Data)';

            // Clear previous
            docSummaryContainer.innerHTML = '';
            docTableHead.innerHTML = '';
            docTableBody.innerHTML = '';

            if (type === 'student') {
                await renderStudentReport(branch, sem);
            } else if (type === 'attendance') {
                await renderAttendanceReport(branch, sem);
            } else if (type === 'marks') {
                await renderMarksReport(branch, sem);
            } else if (type === 'fees') {
                await renderFeesReport(branch, sem);
            }

            // Show Document
            placeholderState.style.display = 'none';
            documentWrapper.style.display = 'block';
            downloadBtn.disabled = false;

        } catch (error) {
            alert('Failed to generate report: ' + error.message);
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-sync"></i> Generate Preview';
        }
    };

    const renderStudentReport = async (branch, sem) => {
        docTitle.textContent = 'Student Roster Report';
        docSubtitle.textContent = 'Complete list of registered students';
        
        const students = await studentsAPI.getAll('', branch, sem);
        
        docSummaryContainer.innerHTML = `
            <div class="doc-summary">
                <div class="doc-summary-box">
                    <h4>Total Students</h4>
                    <p>${students.length}</p>
                </div>
            </div>
        `;

        docTableHead.innerHTML = `
            <tr>
                <th>Roll Number</th>
                <th>Name</th>
                <th>Email</th>
                <th>Branch</th>
                <th>Semester</th>
                <th>Contact</th>
            </tr>
        `;

        let rows = '';
        students.forEach(s => {
            const p = s.student_profile || {};
            rows += `
                <tr>
                    <td>${p.roll_number || '-'}</td>
                    <td>${s.full_name}</td>
                    <td>${s.email}</td>
                    <td>${p.branch || '-'}</td>
                    <td>${p.semester || '-'}</td>
                    <td>${p.phone || '-'}</td>
                </tr>
            `;
        });
        docTableBody.innerHTML = rows;
    };

    const renderAttendanceReport = async (branch, sem) => {
        docTitle.textContent = 'Attendance Summary Report';
        docSubtitle.textContent = 'Aggregated attendance records';
        
        // Note: Our attendance API currently fetches records for a specific student. 
        // For a global admin report, we will fetch all students matching the filter, 
        // but since we don't have a bulk attendance aggregate API, we might just fetch the students 
        // and ideally we'd have a backend route. To simulate, we'll list students if no dedicated bulk API exists.
        // Wait, the API only fetches attendance for a specific `student_id`.
        // If `student_id` is empty, does it fetch all?
        // Let's check `attendanceAPI.getAll()`
        
        const records = await attendanceAPI.getAll('', '', '');
        
        // Filter by branch/sem if needed (by checking student profile inside the record)
        const filtered = records.filter(r => {
            const p = r.student?.student_profile;
            if(!p) return false;
            if (branch && p.branch !== branch) return false;
            if (sem && p.semester !== sem) return false;
            return true;
        });

        const presentCount = filtered.filter(r => r.status === 'present').length;
        const absentCount = filtered.filter(r => r.status === 'absent').length;
        const total = presentCount + absentCount;
        const overall = total === 0 ? 0 : Math.round((presentCount / total) * 100);

        docSummaryContainer.innerHTML = `
            <div class="doc-summary">
                <div class="doc-summary-box">
                    <h4>Total Classes Recorded</h4>
                    <p>${total}</p>
                </div>
                <div class="doc-summary-box">
                    <h4>Overall Attendance</h4>
                    <p>${overall}%</p>
                </div>
            </div>
        `;

        docTableHead.innerHTML = `
            <tr>
                <th>Date</th>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Subject</th>
                <th>Status</th>
            </tr>
        `;

        // Group by Date for better report? Or just chronological
        filtered.sort((a,b) => new Date(b.date) - new Date(a.date));

        let rows = '';
        filtered.forEach(r => {
            const p = r.student?.student_profile || {};
            rows += `
                <tr>
                    <td>${r.date}</td>
                    <td>${p.roll_number || '-'}</td>
                    <td>${r.student?.full_name || '-'}</td>
                    <td>${r.subject}</td>
                    <td style="color: ${r.status === 'present' ? 'green' : 'red'}; text-transform: capitalize;">${r.status}</td>
                </tr>
            `;
        });
        docTableBody.innerHTML = rows;
    };

    const renderMarksReport = async (branch, sem) => {
        docTitle.textContent = 'Academic Performance Report';
        docSubtitle.textContent = 'Marks and grades summary';
        
        const records = await marksAPI.getAll('', '', sem, '');
        
        const filtered = records.filter(r => {
            const p = r.student?.student_profile;
            if(!p) return false;
            if (branch && p.branch !== branch) return false;
            return true;
        });

        docSummaryContainer.innerHTML = `
            <div class="doc-summary">
                <div class="doc-summary-box">
                    <h4>Total Records</h4>
                    <p>${filtered.length}</p>
                </div>
            </div>
        `;

        docTableHead.innerHTML = `
            <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Subject</th>
                <th>Exam Type</th>
                <th>Marks</th>
                <th>Result</th>
            </tr>
        `;

        let rows = '';
        filtered.forEach(r => {
            const p = r.student?.student_profile || {};
            const totalMarks = (r.internal_marks || 0) + (r.external_marks || 0);
            const status = totalMarks >= 40 ? 'Pass' : 'Fail';
            
            rows += `
                <tr>
                    <td>${p.roll_number || '-'}</td>
                    <td>${r.student?.full_name || '-'}</td>
                    <td>${r.subject}</td>
                    <td style="text-transform: capitalize;">${r.exam_type}</td>
                    <td>${totalMarks}</td>
                    <td style="color: ${status === 'Pass' ? 'green' : 'red'}">${status}</td>
                </tr>
            `;
        });
        docTableBody.innerHTML = rows;
    };

    const renderFeesReport = async (branch, sem) => {
        docTitle.textContent = 'Fee Collection Report';
        docSubtitle.textContent = 'Financial status and pending dues';
        
        const records = await feesAPI.getAll('', '');
        
        const filtered = records.filter(r => {
            const p = r.student?.student_profile;
            if(!p) return false;
            if (branch && p.branch !== branch) return false;
            if (sem && p.semester !== sem) return false;
            return true;
        });

        let totalAmount = 0;
        let totalPaid = 0;
        let totalPending = 0;

        filtered.forEach(r => {
            totalAmount += r.total_amount;
            totalPaid += r.paid_amount;
            totalPending += r.pending_amount;
        });

        docSummaryContainer.innerHTML = `
            <div class="doc-summary">
                <div class="doc-summary-box">
                    <h4>Total Expected</h4>
                    <p>$${totalAmount}</p>
                </div>
                <div class="doc-summary-box">
                    <h4>Total Collected</h4>
                    <p style="color: green;">$${totalPaid}</p>
                </div>
                <div class="doc-summary-box">
                    <h4>Total Pending</h4>
                    <p style="color: red;">$${totalPending}</p>
                </div>
            </div>
        `;

        docTableHead.innerHTML = `
            <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Fee Type</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Pending</th>
                <th>Status</th>
            </tr>
        `;

        let rows = '';
        filtered.forEach(r => {
            const p = r.student?.student_profile || {};
            rows += `
                <tr>
                    <td>${p.roll_number || '-'}</td>
                    <td>${r.student?.full_name || '-'}</td>
                    <td>${r.fee_type}</td>
                    <td>$${r.total_amount}</td>
                    <td>$${r.paid_amount}</td>
                    <td>$${r.pending_amount}</td>
                    <td style="text-transform: capitalize; color: ${r.status === 'paid' ? 'green' : (r.status === 'pending' ? 'orange' : 'red')}">${r.status}</td>
                </tr>
            `;
        });
        docTableBody.innerHTML = rows;
    };

    // PDF Generation
    downloadBtn.addEventListener('click', () => {
        const element = document.getElementById('documentWrapper');
        
        // Options for html2pdf
        const opt = {
            margin:       0,
            filename:     `${reportType.value}_report_${new Date().getTime()}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Old html2pdf API logic, but it's very robust
        html2pdf().set(opt).from(element).save();
    });

    generateBtn.addEventListener('click', generateReport);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    });
})();
