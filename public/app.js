// Global variables
window.authManager = null;
window.expenseManager = null;

// Initialize aplikasi
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Expense Tracker...');
    
    // ✅ Initialize ExpenseManager FIRST
    window.expenseManager = new ExpenseManager();
    console.log('✅ ExpenseManager initialized');
    
    // ✅ Then initialize AuthManager (will try to load expenses if logged in)
    window.authManager = new AuthManager();
    console.log('✅ AuthManager initialized');
    
    setupEventListeners();
    
    console.log('✅ App initialized successfully');
    
    // ✅ Add debugging info
    setTimeout(() => {
        console.log('🔍 Debug Info:');
        console.log('- AuthManager ready:', !!window.authManager);
        console.log('- ExpenseManager ready:', !!window.expenseManager);
        console.log('- User logged in:', !!window.authManager?.user);
        console.log('- Token available:', !!window.authManager?.token);
        console.log('- Transactions loaded:', window.expenseManager?.transactions?.length || 0);
    }, 1000);
});

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }
        
        await window.authManager.signIn(email, password);
    });

    // Signup form
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        
        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }
        
        if (password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }
        
        await window.authManager.signUp(email, password);
    });

    // Transaction form
    document.getElementById('transactionForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const description = document.getElementById('description').value.trim();
        const amount = document.getElementById('amount').value;
        const type = document.getElementById('type').value;
        const category = document.getElementById('category').value;

        if (!description || !amount || !type || !category) {
            alert('Please fill all required fields');
            return;
        }

        if (parseFloat(amount) <= 0) {
            alert('Amount must be greater than 0');
            return;
        }

        console.log('➕ Adding transaction:', { description, amount, type, category });

        const result = await window.expenseManager.addTransaction({
            description,
            amount: parseFloat(amount),
            type,
            category
        });

        if (result) {
            console.log('✅ Transaction added successfully');
            document.getElementById('transactionForm').reset();
        }
    });

    // Auth buttons
    document.getElementById('loginBtn').addEventListener('click', () => {
        window.authManager.showLoginModal();
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            window.authManager.signOut();
        }
    });

    document.getElementById('showSignup').addEventListener('click', (e) => {
        e.preventDefault();
        window.authManager.showSignupModal();
    });

    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        window.authManager.showLoginModal();
    });
}

// ✅ Add global error handlers with better logging
window.addEventListener('error', (e) => {
    console.error('🚨 Global error:', e.error);
    console.error('🔍 Error details:', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
    });
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('🚨 Unhandled promise rejection:', e.reason);
    console.error('🔍 Promise:', e.promise);
});

// ✅ Add visibility change handler (when user switches tabs)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.authManager?.user && window.expenseManager) {
        console.log('🔄 Tab became visible, refreshing data...');
        window.expenseManager.loadExpenses();
    }
});