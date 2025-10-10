class AuthManager {
    constructor() {
        this.user = null;
        this.token = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        console.log('🔄 Initializing AuthManager...');
        
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('confirmed') === 'true') {
            alert('✅ Email berhasil dikonfirmasi! Silakan login.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
            console.log('🔑 Found saved session, restoring...');
            
            this.token = savedToken;
            this.user = JSON.parse(savedUser);
            
            try {
                await this.verifyToken();
                console.log('✅ Token verified, showing main content');
                this.showMainContent();
                this.waitForExpenseManagerAndLoad();
                
            } catch (error) {
                console.log('❌ Token invalid, clearing session');
                this.clearSession();
                this.showHero();  //  Show hero instead of login modal
            }
        } else {
            console.log('📝 No saved session, showing hero');
            this.showHero();  // Show hero for new visitors
        }
        
        this.isInitialized = true;
        console.log('✅ AuthManager initialized');
    }

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
                setTimeout(checkAndLoad, 100);
            } else {
                console.log('❌ ExpenseManager not found after maximum attempts');
            }
        };

        checkAndLoad();
    }

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

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            if (data.needsConfirmation) {
                alert(`✅ ${data.message}\n\n📧 Email konfirmasi telah dikirim ke ${email}\nSilakan cek inbox dan folder spam!`);
            }
            
            this.showLoginModal();
            
        } catch (error) {
            console.error('❌ Signup error:', error);
            alert('❌ Error signup: ' + error.message);
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
            
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            this.token = data.session.access_token;
            this.user = data.user;
            
            localStorage.setItem('auth_token', this.token);
            localStorage.setItem('user', JSON.stringify(this.user));
            
            console.log('✅ Login successful');
            this.showMainContent();
            
            if (window.expenseManager) {
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
        this.showHero();  //  Show hero after logout
        
        if (window.expenseManager) {
            window.expenseManager.transactions = [];
            window.expenseManager.updateUI();
        }
    }

    //  Show hero section (landing page)
    showHero() {
        console.log('🏠 Showing hero section');
        
        const heroSection = document.getElementById('heroSection');
        const appHeader = document.getElementById('appHeader');
        const mainContent = document.getElementById('mainContent');
        const loginModal = document.getElementById('loginModal');
        const signupModal = document.getElementById('signupModal');

        if (heroSection) heroSection.style.display = 'grid';
        if (appHeader) appHeader.style.display = 'none';
        if (mainContent) mainContent.style.display = 'none';
        if (loginModal) loginModal.style.display = 'none';
        if (signupModal) signupModal.style.display = 'none';
    }

    showMainContent() {
        console.log('🖥️ Showing main content for user:', this.user?.email);
        
        const heroSection = document.getElementById('heroSection');
        const appHeader = document.getElementById('appHeader');
        const mainContent = document.getElementById('mainContent');
        const loginModal = document.getElementById('loginModal');
        const signupModal = document.getElementById('signupModal');
        const userEmail = document.getElementById('userEmail');

        if (heroSection) heroSection.style.display = 'none';  //  Hide hero
        if (appHeader) appHeader.style.display = 'flex';
        if (mainContent) mainContent.style.display = 'block';
        if (loginModal) loginModal.style.display = 'none';
        if (signupModal) signupModal.style.display = 'none';
        if (userEmail) userEmail.textContent = this.user?.email || '';
    }

    showLoginModal() {
        console.log('🔐 Showing login modal');
        
        const heroSection = document.getElementById('heroSection');
        const loginModal = document.getElementById('loginModal');
        const signupModal = document.getElementById('signupModal');

        if (heroSection) heroSection.style.display = 'none';  //  Hide hero when showing modal
        if (loginModal) loginModal.style.display = 'flex';
        if (signupModal) signupModal.style.display = 'none';
    }

    showSignupModal() {
        console.log('📝 Showing signup modal');
        
        const heroSection = document.getElementById('heroSection');
        const loginModal = document.getElementById('loginModal');
        const signupModal = document.getElementById('signupModal');

        if (heroSection) heroSection.style.display = 'none';  //  Hide hero when showing modal
        if (loginModal) loginModal.style.display = 'none';
        if (signupModal) signupModal.style.display = 'flex';
    }
}