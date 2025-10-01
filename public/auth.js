class AuthManager {
    constructor() {
        this.user = null;
        this.token = null;
        this.init();
    }

    async init() {
        // Cek apakah ada saved session
        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
            this.token = savedToken;
            this.user = JSON.parse(savedUser);
            this.showMainContent();
            
            // Load expenses setelah login
            if (window.expenseManager) {
                window.expenseManager.loadExpenses();
            }
        } else {
            this.showLoginModal();
        }
    }

    async signUp(email, password) {
        try {
            const response = await fetch('/.netlify/functions/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'signup', 
                    email, 
                    password 
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            // ✅ UPDATE MESSAGE
            alert('✅ Account created! Please check your email and click the confirmation link before signing in.');
            this.showLoginModal();
            
        } catch (error) {
            alert('❌ Signup error: ' + error.message);
            console.error('Signup error:', error);
        }
    }

    async signIn(email, password) {
        try {
            // ✅ Request ke Netlify function
            const response = await fetch('/.netlify/functions/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'signin', 
                    email, 
                    password 
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Save session
            this.token = data.session.access_token;
            this.user = data.user;
            
            localStorage.setItem('auth_token', this.token);
            localStorage.setItem('user', JSON.stringify(this.user));
            
            this.showMainContent();
            
        } catch (error) {
            alert('❌ Login error: ' + error.message);
            console.error('Login error:', error);
        }
    }

    async signOut() {
        this.token = null;
        this.user = null;
        
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        
        this.showLoginModal();
        
        // Clear transactions
        if (window.expenseManager) {
            window.expenseManager.transactions = [];
            window.expenseManager.updateUI();
        }
    }

    showMainContent() {
        document.getElementById('mainContent').style.display = 'block';
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('signupModal').style.display = 'none';
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'inline-block';
        document.getElementById('userEmail').textContent = this.user?.email || '';
    }

    showLoginModal() {
        document.getElementById('mainContent').style.display = 'none';
        document.getElementById('loginModal').style.display = 'flex';
        document.getElementById('signupModal').style.display = 'none';
        document.getElementById('loginBtn').style.display = 'inline-block';
        document.getElementById('logoutBtn').style.display = 'none';
        document.getElementById('userEmail').textContent = '';
    }

    showSignupModal() {
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('signupModal').style.display = 'flex';
    }
}