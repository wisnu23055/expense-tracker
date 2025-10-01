class ExpenseManager {
    constructor() {
        this.transactions = [];
    }

    async addTransaction(transaction) {
        try {
            // ✅ Request ke Netlify function dengan auth token
            const response = await fetch('/.netlify/functions/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.authManager.token}`
                },
                body: JSON.stringify(transaction)
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to add transaction');
            }

            await this.loadExpenses();
            return data;
            
        } catch (error) {
            alert('❌ Error adding transaction: ' + error.message);
            console.error('Add transaction error:', error);
        }
    }

    async loadExpenses() {
        try {
            // ✅ Request ke Netlify function
            const response = await fetch('/.netlify/functions/transactions', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${window.authManager.token}`
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to load transactions');
            }

            this.transactions = data;
            this.updateUI();
            
        } catch (error) {
            console.error('Load expenses error:', error);
            this.transactions = [];
            this.updateUI();
        }
    }

    async deleteTransaction(id) {
        if (!confirm('Are you sure you want to delete this transaction?')) {
            return;
        }

        try {
            // ✅ Request ke Netlify function
            const response = await fetch('/.netlify/functions/transactions', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.authManager.token}`
                },
                body: JSON.stringify({ id })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete transaction');
            }

            await this.loadExpenses();
            
        } catch (error) {
            alert('❌ Error deleting transaction: ' + error.message);
            console.error('Delete transaction error:', error);
        }
    }

    updateUI() {
        this.updateSummary();
        this.renderTransactions();
    }

    updateSummary() {
        const totals = this.transactions.reduce((acc, transaction) => {
            const amount = parseFloat(transaction.amount);
            if (transaction.type === 'income') {
                acc.income += amount;
            } else if (transaction.type === 'expense') {
                acc.expense += amount;
            }
            return acc;
        }, { income: 0, expense: 0 });

        const balance = totals.income - totals.expense;

        document.getElementById('totalBalance').textContent = this.formatCurrency(balance);
        document.getElementById('totalIncome').textContent = this.formatCurrency(totals.income);
        document.getElementById('totalExpense').textContent = this.formatCurrency(totals.expense);

        const balanceElement = document.getElementById('totalBalance');
        balanceElement.style.color = balance >= 0 ? '#28a745' : '#dc3545';
    }

    renderTransactions() {
        const container = document.getElementById('transactionsList');
        container.innerHTML = '';

        if (this.transactions.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Belum ada transaksi. Tambahkan transaksi pertama Anda!</p>';
            return;
        }

        this.transactions.forEach(transaction => {
            const item = document.createElement('div');
            item.className = 'transaction-item';
            
            const date = new Date(transaction.created_at);
            const formattedDate = date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            const amount = parseFloat(transaction.amount);
            const amountText = transaction.type === 'income' ? `+${this.formatCurrency(amount)}` : `-${this.formatCurrency(amount)}`;
            
            item.innerHTML = `
                <div class="transaction-info">
                    <div style="font-weight: bold; margin-bottom: 4px;">${transaction.description}</div>
                    <div style="font-size: 0.9rem; color: #666;">
                        ${formattedDate}
                        <span class="transaction-category">${this.formatCategory(transaction.category)}</span>
                    </div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${amountText}
                </div>
                <button class="delete-btn" onclick="window.expenseManager.deleteTransaction(${transaction.id})" title="Hapus transaksi">
                    ✕
                </button>
            `;
            
            container.appendChild(item);
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatCategory(category) {
        const categoryNames = {
            'food': 'Makanan',
            'transport': 'Transport',
            'entertainment': 'Hiburan',
            'bills': 'Tagihan',
            'salary': 'Gaji',
            'other': 'Lainnya'
        };
        return categoryNames[category] || category;
    }
}