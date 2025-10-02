class AuthManager {
    constructor() {
        this.user = null;
        this.token = null;
        this.isInitialized = false;  // ✅ Add flag
        this.init();
    }

    async init() {
        console.log('🔄 Initializing AuthManager...');
        
        // ✅ CEK URL PARAMETERS untuk email confirmation
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('confirmed') === 'true') {
            alert('✅ Email confirmed successfully! You can now sign in.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Cek apakah ada saved session
        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
            console.log('🔑 Found saved session, restoring...');
            
            this.token = savedToken;
            this.user = JSON.parse(savedUser);
            
            // ✅ Verify token masih valid sebelum show content
            try {
                await this.verifyToken();
                console.log('✅ Token verified, showing main content');
                this.showMainContent();
                
                // ✅ Wait untuk expense manager ready, lalu load data
                this.waitForExpenseManagerAndLoad();
                
            } catch (error) {
                console.log('❌ Token invalid, clearing session');
                this.clearSession();
                this.showLoginModal();
            }
        } else {
            console.log('📝 No saved session, showing login');
            this.showLoginModal();
        }
        
        this.isInitialized = true;
        console.log('✅ AuthManager initialized');
    }

    // ✅ Add token verification method
    async verifyToken() {
        if (!this.token) {
            throw new Error('No token');
        }

        const response = await fetch('/.netlify/functions/transactions', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Token invalid');
        }

        return true;
    }

    // ✅ Wait for expense manager and load data
    waitForExpenseManagerAndLoad() {
        const maxAttempts = 10;
        let attempts = 0;

        const checkAndLoad = () => {
            attempts++;
            console.log(`🔍 Checking for expenseManager (attempt ${attempts}/${maxAttempts})`);
            
            if (window.expenseManager && typeof window.expenseManager.loadExpenses === 'function') {
                console.log('✅ ExpenseManager found, loading expenses...');
                window.expenseManager.loadExpenses();
                return;
            }

            if (attempts < maxAttempts) {
                setTimeout(checkAndLoad, 100); // Try again after 100ms
            } else {
                console.log('❌ ExpenseManager not found after maximum attempts');
            }
        };

        checkAndLoad();
    }

    // ✅ Add clear session method
    clearSession() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
    }

    async signUp(email, password) {
        try {
            console.log('🚀 Starting signup for:', email);
            
            const response = await fetch('/.netlify/functions/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'signup', 
                    email, 
                    password 
                })
            });

            console.log('📡 Response status:', response.status);
            
            const data = await response.json();
            console.log('📄 Response data:', data);
            
            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            if (data.needsConfirmation) {
                alert(`✅ ${data.message}\n\n📧 Email akan dikirim dari: noreply@mail.app.supabase.io\nSilakan cek inbox dan folder spam!`);
            } else {
                alert('✅ Account created and ready to use!');
            }
            
            this.showLoginModal();
            
        } catch (error) {
            console.error('❌ Full signup error:', error);
            alert('❌ Signup error: ' + error.message);
        }
    }

    async signIn(email, password) {
        try {
            console.log('🔑 Starting signin for:', email);
            
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
            console.log('📄 Signin response:', data);
            
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Save session
            this.token = data.session.access_token;
            this.user = data.user;
            
            localStorage.setItem('auth_token', this.token);
            localStorage.setItem('user', JSON.stringify(this.user));
            
            console.log('✅ Login successful, showing main content');
            this.showMainContent();
            
            // ✅ Load expenses immediately after successful login
            if (window.expenseManager) {
                console.log('📊 Loading expenses after login...');
                await window.expenseManager.loadExpenses();
            }
            
        } catch (error) {
            alert('❌ Login error: ' + error.message);
            console.error('Login error:', error);
        }
    }

    async signOut() {
        console.log('🚪 Signing out...');
        
        this.clearSession();
        this.showLoginModal();
        
        // Clear transactions UI
        if (window.expenseManager) {
            window.expenseManager.transactions = [];
            window.expenseManager.updateUI();
        }
    }

    showMainContent() {
        console.log('🖥️ Showing main content for user:', this.user?.email);
        
        document.getElementById('mainContent').style.display = 'block';
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('signupModal').style.display = 'none';
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'inline-block';
        document.getElementById('userEmail').textContent = this.user?.email || '';
    }

    showLoginModal() {
        console.log('🔐 Showing login modal');
        
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