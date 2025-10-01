// Global variables
window.authManager = null;
window.expenseManager = null;

// Initialize aplikasi
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Expense Tracker...');
    
    // ✅ TIDAK PERLU Supabase client di frontend!
    // Semua komunikasi via Netlify Functions
    
    window.authManager = new AuthManager();
    window.expenseManager = new ExpenseManager();
    
    setupEventListeners();
    
    console.log('✅ App initialized successfully');
});

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        await window.authManager.signIn(email, password);
    });

    // Signup form
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        
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

        if (!description || !amount || !type) {
            alert('Please fill all required fields');
            return;
        }

        await window.expenseManager.addTransaction({
            description,
            amount: parseFloat(amount),
            type,
            category
        });

        document.getElementById('transactionForm').reset();
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

// Error handlers
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});