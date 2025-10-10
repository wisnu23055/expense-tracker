// Global variables
window.authManager = null;
window.expenseManager = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Expense Tracker...');
    
    window.expenseManager = new ExpenseManager();
    window.authManager = new AuthManager();
    
    setupEventListeners();
    setupCTAButtons();  //  Add CTA handlers
    
    console.log('✅ App initialized successfully');
});

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            alert('Mohon isi semua field');
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
            alert('Mohon isi semua field');
            return;
        }
        
        if (password.length < 6) {
            alert('Password minimal 6 karakter');
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
            alert('Mohon isi semua field');
            return;
        }

        if (parseFloat(amount) <= 0) {
            alert('Jumlah harus lebih dari 0');
            return;
        }

        const result = await window.expenseManager.addTransaction({
            description,
            amount: parseFloat(amount),
            type,
            category
        });

        if (result) {
            document.getElementById('transactionForm').reset();
        }
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Yakin ingin logout?')) {
            window.authManager.signOut();
        }
    });

    // Modal switchers
    document.getElementById('showSignup').addEventListener('click', (e) => {
        e.preventDefault();
        window.authManager.showSignupModal();
    });

    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        window.authManager.showLoginModal();
    });
}

//  Setup CTA buttons from hero section
function setupCTAButtons() {
    const ctaSignup = document.getElementById('ctaSignup');
    const ctaLogin = document.getElementById('ctaLogin');

    if (ctaSignup) {
        ctaSignup.addEventListener('click', () => {
            window.authManager.showSignupModal();
        });
    }

    if (ctaLogin) {
        ctaLogin.addEventListener('click', () => {
            window.authManager.showLoginModal();
        });
    }
}

// Global error handlers
window.addEventListener('error', (e) => {
    console.error('🚨 Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('🚨 Unhandled promise rejection:', e.reason);
});

// Refresh data when tab becomes visible
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.authManager?.user && window.expenseManager) {
        console.log('🔄 Tab visible, refreshing data...');
        window.expenseManager.loadExpenses();
    }
});