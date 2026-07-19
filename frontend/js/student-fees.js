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
            const stats = await feesAPI.getStats();
            
            // Overall Stats
            document.getElementById('totalPaidAmount').textContent = `$${stats.total_paid.toFixed(2)}`;
            document.getElementById('totalPendingAmount').textContent = `$${stats.total_pending.toFixed(2)}`;
            document.getElementById('totalDemandedAmount').textContent = `$${stats.total_fees_demanded.toFixed(2)}`;
            
            // Fee Demands Table
            const feeDemandsTable = document.getElementById('feeDemandsTable');
            feeDemandsTable.innerHTML = '';
            
            if (stats.fees.length === 0) {
                feeDemandsTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No fee demands found.</td></tr>';
            } else {
                stats.fees.forEach(fee => {
                    const balance = fee.total_amount - fee.paid_amount;
                    let badgeClass = 'status-pending';
                    if (fee.status === 'Paid') badgeClass = 'status-paid';
                    else if (fee.status === 'Partial') badgeClass = 'status-partial';

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${fee.title}</strong></td>
                        <td>$${fee.total_amount.toFixed(2)}</td>
                        <td>$${fee.paid_amount.toFixed(2)}</td>
                        <td style="color: ${balance > 0 ? 'var(--danger-color)' : 'var(--text-primary)'}; font-weight: 600;">$${balance.toFixed(2)}</td>
                        <td>${fee.due_date}</td>
                        <td><span class="status-badge ${badgeClass}">${fee.status}</span></td>
                    `;
                    feeDemandsTable.appendChild(tr);
                });
            }

            // Payment History Table
            const paymentsTable = document.getElementById('paymentsTable');
            paymentsTable.innerHTML = '';
            
            if (stats.recent_payments.length === 0) {
                paymentsTable.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No payments recorded yet.</td></tr>';
            } else {
                stats.recent_payments.forEach(payment => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${payment.payment_date}</td>
                        <td style="font-weight: 600; color: var(--success-color);">$${payment.amount_paid.toFixed(2)}</td>
                        <td>${payment.payment_method}</td>
                        <td>${payment.reference_number || 'N/A'}</td>
                        <td>
                            <button class="btn btn-primary" onclick="window.open('receipt.html?id=${payment.id}', '_blank')" style="padding: 6px 12px; font-size: 0.875rem;">
                                <i class="fas fa-print"></i> Receipt
                            </button>
                        </td>
                    `;
                    paymentsTable.appendChild(tr);
                });
            }

        } catch (error) {
            console.error('Failed to load fee stats', error);
        }
    };

    loadStats();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    });
})();
