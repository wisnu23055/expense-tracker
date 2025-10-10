class ExpenseManager {
    constructor() {
        this.transactions = [];
        this.isLoading = false;  //  Add loading state
        console.log('💰 ExpenseManager initialized');
    }

    async addTransaction(transaction) {
        try {
            console.log('➕ Adding transaction:', transaction);
            
            //  Check auth before making request
            if (!window.authManager?.token) {
                throw new Error('Not authenticated. Please login again.');
            }

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
                //  Handle auth errors specifically
                if (response.status === 401) {
                    alert('Session expired. Please login again.');
                    window.authManager.signOut();
                    return null;
                }
                throw new Error(data.error || 'Failed to add transaction');
            }

            console.log(' Transaction added:', data.id);
            
            //  Reload expenses to ensure consistency
            await this.loadExpenses();
            return data;
            
        } catch (error) {
            console.error('❌ Add transaction error:', error);
            alert('❌ Error adding transaction: ' + error.message);
            return null;
        }
    }

    async loadExpenses() {
        //  Prevent multiple simultaneous loads
        if (this.isLoading) {
            console.log('⏳ Load already in progress, skipping...');
            return;
        }

        try {
            this.isLoading = true;
            console.log('📊 Loading expenses...');
            
            //  Check auth before making request
            if (!window.authManager?.token) {
                console.log('❌ No auth token, cannot load expenses');
                this.transactions = [];
                this.updateUI();
                return;
            }

            const response = await fetch('/.netlify/functions/transactions', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${window.authManager.token}`
                }
            });

            const data = await response.json();
            
            if (!response.ok) {
                //  Handle auth errors
                if (response.status === 401) {
                    console.log('❌ Authentication failed, clearing session');
                    window.authManager.signOut();
                    return;
                }
                throw new Error(data.error || 'Failed to load transactions');
            }

            console.log(` Loaded ${data.length} transactions`);
            this.transactions = data || [];
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Load expenses error:', error);
            this.transactions = [];
            this.updateUI();
            
            //  Don't show alert for auth errors (handled above)
            if (!error.message.includes('authentication') && !error.message.includes('login')) {
                alert('❌ Error loading transactions: ' + error.message);
            }
        } finally {
            this.isLoading = false;
        }
    }

    async deleteTransaction(id) {
        if (!confirm('Are you sure you want to delete this transaction?')) {
            return;
        }

        try {
            console.log('🗑️ Deleting transaction:', id);
            
            if (!window.authManager?.token) {
                throw new Error('Not authenticated. Please login again.');
            }

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
                if (response.status === 401) {
                    alert('Session expired. Please login again.');
                    window.authManager.signOut();
                    return;
                }
                throw new Error(data.error || 'Failed to delete transaction');
            }

            console.log(' Transaction deleted');
            await this.loadExpenses();
            
        } catch (error) {
            console.error('❌ Delete transaction error:', error);
            alert('❌ Error deleting transaction: ' + error.message);
        }
    }

    updateUI() {
        console.log('🔄 Updating UI with', this.transactions.length, 'transactions');
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

        //  Add null checks for DOM elements
        const balanceEl = document.getElementById('totalBalance');
        const incomeEl = document.getElementById('totalIncome');
        const expenseEl = document.getElementById('totalExpense');

        if (balanceEl) {
            balanceEl.textContent = this.formatCurrency(balance);
            balanceEl.style.color = balance >= 0 ? '#28a745' : '#dc3545';
        }

        if (incomeEl) {
            incomeEl.textContent = this.formatCurrency(totals.income);
        }

        if (expenseEl) {
            expenseEl.textContent = this.formatCurrency(totals.expense);
        }

        console.log('💰 Summary updated:', { balance, income: totals.income, expense: totals.expense });
    }

    renderTransactions() {
        const container = document.getElementById('transactionsList');
        if (!container) {
            console.error('❌ Transactions container not found');
            return;
        }

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
                    <div style="font-weight: bold; margin-bottom: 4px;">${this.escapeHtml(transaction.description)}</div>
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

        console.log('📋 Rendered', this.transactions.length, 'transactions');
    }

    //  Add HTML escape method for security
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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