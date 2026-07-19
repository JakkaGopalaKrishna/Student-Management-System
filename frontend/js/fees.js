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

    // DOM Elements
    const searchStudentId = document.getElementById('searchStudentId');
    const searchStatus = document.getElementById('searchStatus');
    const searchBtn = document.getElementById('searchBtn');
    const feesTableBody = document.getElementById('feesTableBody');
    
    // Fee Modal
    const feeModal = document.getElementById('feeModal');
    const feeForm = document.getElementById('feeForm');
    const feeStudentId = document.getElementById('feeStudentId');
    
    // Payment Modal
    const paymentModal = document.getElementById('paymentModal');
    const paymentForm = document.getElementById('paymentForm');
    const pendingBalanceDisplay = document.getElementById('pendingBalanceDisplay');
    let currentFeeBalance = 0;
    
    // Load Students for Dropdown
    const loadStudentsDropdown = async () => {
        try {
            const students = await studentsAPI.getAll();
            feeStudentId.innerHTML = '<option value="">Select Student</option>';
            students.forEach(s => {
                const roll = s.student_profile ? s.student_profile.roll_number : 'N/A';
                feeStudentId.innerHTML += `<option value="${s.id}">${s.full_name} (${roll})</option>`;
            });
        } catch (error) {
            console.error('Failed to load students for dropdown', error);
        }
    };
    
    loadStudentsDropdown();

    // Load Fees
    const loadFees = async () => {
        try {
            const fees = await feesAPI.getAll(
                searchStudentId.value.trim(), 
                searchStatus.value
            );
            
            feesTableBody.innerHTML = '';
            
            if (fees.length === 0) {
                feesTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 24px;">No fee records found.</td></tr>';
                return;
            }

            fees.forEach(fee => {
                const balance = fee.total_amount - fee.paid_amount;
                let badgeClass = 'status-pending';
                if (fee.status === 'Paid') badgeClass = 'status-paid';
                else if (fee.status === 'Partial') badgeClass = 'status-partial';
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${fee.student_id}</strong></td>
                    <td>${fee.title}</td>
                    <td>$${fee.total_amount.toFixed(2)}</td>
                    <td>$${fee.paid_amount.toFixed(2)}</td>
                    <td style="color: ${balance > 0 ? 'var(--danger-color)' : 'var(--text-primary)'}; font-weight: 600;">$${balance.toFixed(2)}</td>
                    <td>${fee.due_date}</td>
                    <td><span class="status-badge ${badgeClass}">${fee.status}</span></td>
                    <td>
                        <div class="action-btns">
                            ${fee.status !== 'Paid' ? `<button class="btn-pay" onclick="openPaymentModal(${fee.id}, ${balance})" title="Record Payment"><i class="fas fa-dollar-sign"></i></button>` : ''}
                            <button class="btn-edit" onclick="editFee(${fee.id})" title="Edit Demand"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="deleteFee(${fee.id})" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
                feesTableBody.appendChild(tr);
            });
        } catch (error) {
            console.error('Failed to load fees', error);
            feesTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--danger-color);">Error loading data.</td></tr>';
        }
    };

    searchBtn.addEventListener('click', loadFees);
    loadFees();

    // Add Fee Modal
    document.getElementById('openAddFeeModalBtn').addEventListener('click', () => {
        feeForm.reset();
        document.getElementById('feeId').value = '';
        document.getElementById('feeModalTitle').textContent = 'Add Fee Demand';
        document.getElementById('feeStudentId').disabled = false;
        feeModal.style.display = 'flex';
    });

    feeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('feeId').value;
        const submitBtn = feeForm.querySelector('button[type="submit"]');
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            if (id) {
                await feesAPI.update(id, {
                    title: document.getElementById('feeTitle').value.trim(),
                    total_amount: parseFloat(document.getElementById('feeTotal').value),
                    due_date: document.getElementById('feeDueDate').value
                });
                alert('Fee demand updated!');
            } else {
                await feesAPI.create({
                    student_id: parseInt(document.getElementById('feeStudentId').value),
                    title: document.getElementById('feeTitle').value.trim(),
                    total_amount: parseFloat(document.getElementById('feeTotal').value),
                    due_date: document.getElementById('feeDueDate').value
                });
                alert('Fee demand created!');
            }
            loadFees();
            closeFeeModal();
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Save Fee';
        }
    });

    // Payment Modal
    window.openPaymentModal = (feeId, balance) => {
        paymentForm.reset();
        document.getElementById('paymentFeeId').value = feeId;
        document.getElementById('payDate').valueAsDate = new Date();
        document.getElementById('payAmount').max = balance;
        document.getElementById('payAmount').value = balance; // Default to full pending
        currentFeeBalance = balance;
        pendingBalanceDisplay.textContent = `$${balance.toFixed(2)}`;
        paymentModal.style.display = 'flex';
    };

    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const feeId = document.getElementById('paymentFeeId').value;
        const amount = parseFloat(document.getElementById('payAmount').value);
        const submitBtn = paymentForm.querySelector('button[type="submit"]');
        
        if (amount > currentFeeBalance) {
            alert('Payment amount cannot exceed pending balance.');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            
            const payment = await feesAPI.recordPayment(feeId, {
                amount_paid: amount,
                payment_method: document.getElementById('payMethod').value,
                payment_date: document.getElementById('payDate').value,
                reference_number: document.getElementById('payReference').value || null
            });
            
            alert('Payment recorded successfully!');
            
            // Ask to view receipt immediately
            // Payment object returned is actually the FeeResponse, we can't easily grab the new payment ID here
            // unless we change the API. But they can find it in the tables. 
            
            loadFees();
            closePaymentModal();
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Confirm Payment';
        }
    });

    window.closeFeeModal = () => { feeModal.style.display = 'none'; };
    window.closePaymentModal = () => { paymentModal.style.display = 'none'; };

    window.editFee = async (id) => {
        try {
            const fees = await feesAPI.getAll();
            const fee = fees.find(f => f.id === id);
            if (!fee) throw new Error('Fee record not found');
            
            if (fee.status === 'Paid') {
                alert('Cannot edit a fully paid fee demand.');
                return;
            }

            document.getElementById('feeId').value = fee.id;
            document.getElementById('feeModalTitle').textContent = 'Edit Fee Demand';
            document.getElementById('feeStudentId').value = fee.student_id;
            document.getElementById('feeStudentId').disabled = true;
            document.getElementById('feeTitle').value = fee.title;
            document.getElementById('feeTotal').value = fee.total_amount;
            document.getElementById('feeTotal').min = fee.paid_amount; // Can't lower below paid
            document.getElementById('feeDueDate').value = fee.due_date;
            
            feeModal.style.display = 'flex';
        } catch (error) {
            alert('Failed to edit: ' + error.message);
        }
    };

    window.deleteFee = async (id) => {
        if (confirm('Delete this fee demand? This will also delete any associated payment records.')) {
            try {
                await feesAPI.delete(id);
                loadFees();
            } catch (error) {
                alert('Failed to delete: ' + error.message);
            }
        }
    };

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    });
})();
