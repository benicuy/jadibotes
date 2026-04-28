// ============ AUTHENTICATION ============

let currentUser = null;

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    if (tab === 'login') {
        document.querySelector('.auth-tab:first-child').classList.add('active');
        document.getElementById('login-form').classList.add('active');
    } else {
        document.querySelector('.auth-tab:last-child').classList.add('active');
        document.getElementById('register-form').classList.add('active');
    }
}

function doLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) return notify('Isi username dan password!', 'error');
    
    const users = getUsers();
    const user = users.find(u => u.username === username && atob(u.password) === password);
    
    if (!user) return notify('Username atau password salah!', 'error');
    
    // Check subscription expiry
    if (user.subscription && user.subscriptionExpiry) {
        const expiryDate = new Date(user.subscriptionExpiry);
        if (expiryDate < new Date()) {
            user.subscription = null;
            user.subscriptionExpiry = null;
            saveUsers(users);
            notify('Subscription Anda telah habis! Silakan perpanjang.', 'warn');
        }
    }
    
    currentUser = { ...user, password: undefined };
    sessionStorage.setItem('botforge_user', JSON.stringify({ 
        id: user.id, 
        username: user.username, 
        role: user.role,
        subscription: user.subscription,
        subscriptionExpiry: user.subscriptionExpiry
    }));
    
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    
    // Load ptero config for admin
    if (currentUser.role === 'admin') {
        const pteroConfig = getPteroConfig();
        if (pteroConfig.connected) {
            document.getElementById('status-dot').classList.add('connected');
            document.getElementById('status-text').textContent = 'Panel terhubung ✓';
        }
    }
    
    initApp();
    notify(`Selamat datang, ${user.username}!`, 'success');
}

function doRegister() {
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    
    if (!username || !email || !password) return notify('Isi semua field!', 'error');
    if (password !== confirm) return notify('Password tidak cocok!', 'error');
    if (password.length < 4) return notify('Password minimal 4 karakter!', 'error');
    
    const users = getUsers();
    if (users.find(u => u.username === username)) return notify('Username sudah ada!', 'error');
    if (users.find(u => u.email === email)) return notify('Email sudah terdaftar!', 'error');
    
    const newUser = {
        id: Date.now(),
        username,
        email,
        password: btoa(password),
        role: 'user',
        subscription: null,
        subscriptionExpiry: null,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    notify('Registrasi berhasil! Silakan login.', 'success');
    switchAuthTab('login');
    document.getElementById('login-username').value = username;
    document.getElementById('login-password').value = '';
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('botforge_user');
    document.getElementById('app').style.display = 'none';
    document.getElementById('auth-overlay').style.display = 'flex';
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
}

function checkUserSubscription() {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    
    if (!currentUser.subscription || !currentUser.subscriptionExpiry) {
        return false;
    }
    
    const expiryDate = new Date(currentUser.subscriptionExpiry);
    return expiryDate > new Date();
}

function updateSubscriptionInfo() {
    const container = document.getElementById('subscription-info');
    if (!container) return;
    
    if (!currentUser) return;
    
    if (currentUser.role === 'admin') {
        container.innerHTML = '<div class="subscription-badge">👑 Administrator</div>';
        return;
    }
    
    if (currentUser.subscription && currentUser.subscriptionExpiry) {
        const expiryDate = new Date(currentUser.subscriptionExpiry);
        const isExpired = expiryDate < new Date();
        
        if (isExpired) {
            container.innerHTML = '<div class="subscription-badge" style="background:rgba(255,77,109,0.15);color:var(--danger);">⚠️ Subscription Habis <button class="btn btn-sm btn-gold" style="margin-left:8px;" onclick="showSubscriptionModal()">Perpanjang</button></div>';
        } else {
            const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
            container.innerHTML = `<div class="subscription-badge">💎 ${currentUser.subscription.toUpperCase()} · Aktif ${daysLeft} hari lagi</div>`;
        }
    } else {
        container.innerHTML = '<div class="subscription-badge" style="background:rgba(255,77,109,0.15);color:var(--danger);">⚠️ Belum Berlangganan <button class="btn btn-sm btn-gold" style="margin-left:8px;" onclick="showSubscriptionModal()">Langganan</button></div>';
    }
}
