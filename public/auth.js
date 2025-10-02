class AuthManager {
    constructor() {
        this.user = null;
        this.token = null;
        this.init();
    }

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // ✅ Handle email confirmation dengan welcome message
        if (urlParams.get('confirmed') === 'true') {
            const isWelcome = urlParams.get('welcome') === 'true';
            
            if (isWelcome) {
                alert('🎉 Selamat datang di Expense Tracker!\n✅ Email Anda telah dikonfirmasi.\n\nAnda sekarang bisa login dan mulai mengelola keuangan Anda!');
            } else {
                alert('✅ Email confirmed successfully! You can now sign in.');
            }
            
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }

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

            // ✅ BETTER MESSAGE HANDLING
            if (data.needsConfirmation) {
                alert(`✅ ${data.message}\n\n📧 Debug info:\n- Email will be sent from: noreply@mail.app.supabase.io\n- Check spam folder!\n- Redirect URL: ${data.debug?.emailRedirectTo}`);
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
            
            // Load expenses after login
            if (window.expenseManager) {
                window.expenseManager.loadExpenses();
            }
            
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