// ============ DATABASE (localStorage) ============

function initDatabase() {
    // Users table
    if (!localStorage.getItem('botforge_users')) {
        const defaultUsers = [
            { id: 1, username: 'admin', password: btoa('admin123'), email: 'admin@botforge.com', role: 'admin', subscription: null, subscriptionExpiry: null, createdAt: new Date().toISOString() }
        ];
        localStorage.setItem('botforge_users', JSON.stringify(defaultUsers));
    }
    
    // Menus/Commands table
    if (!localStorage.getItem('botforge_menus')) {
        const defaultMenus = [
            { id: 1, command: 'help', description: 'Menampilkan daftar perintah', type: 'all', code: 'return "📋 Daftar perintah: " + Object.keys(global.menus).join(", ");' },
            { id: 2, command: 'ping', description: 'Cek respon bot', type: 'all', code: 'return "🏓 Pong!";' },
            { id: 3, command: 'info', description: 'Informasi bot', type: 'all', code: 'return "🤖 Bot dibuat dengan BotForge\\nPrefix: " + global.prefix;' },
            { id: 4, command: 'owner', description: 'Info owner bot', type: 'all', code: 'return "👑 Owner: @" + global.owner;' }
        ];
        localStorage.setItem('botforge_menus', JSON.stringify(defaultMenus));
    }
    
    // Config
    if (!localStorage.getItem('botforge_config')) {
        localStorage.setItem('botforge_config', JSON.stringify({ prefix: '.' }));
    }
    
    // Bots
    if (!localStorage.getItem('botforge_bots')) {
        localStorage.setItem('botforge_bots', JSON.stringify([]));
    }
    
    // Pterodactyl config (only for admin)
    if (!localStorage.getItem('botforge_ptero')) {
        localStorage.setItem('botforge_ptero', JSON.stringify({ url: '', key: '', connected: false }));
    }
    
    // Subscription plans
    if (!localStorage.getItem('botforge_plans')) {
        const plans = [
            { id: 'standard', name: 'Standard', price_monthly: 50000, price_yearly: 500000, features: ['1 Bot Aktif', 'WhatsApp/Telegram', '5 Menu Kustom', 'Support 3 Hari'], color: 'standard', badge: 'badge-standard' },
            { id: 'gold', name: 'Gold', price_monthly: 100000, price_yearly: 1000000, features: ['5 Bot Aktif', 'WhatsApp + Telegram', '15 Menu Kustom', 'Support Prioritas', 'Deploy ke Server'], color: 'gold', badge: 'badge-gold' },
            { id: 'platinum', name: 'Platinum', price_monthly: 200000, price_yearly: 2000000, features: ['Unlimited Bot', 'Semua Platform', 'Unlimited Menu', 'Support 24/7', 'Deploy ke Server', 'Custom Domain'], color: 'platinum', badge: 'badge-platinum' }
        ];
        localStorage.setItem('botforge_plans', JSON.stringify(plans));
    }
}

// Users
function getUsers() { return JSON.parse(localStorage.getItem('botforge_users') || '[]'); }
function saveUsers(users) { localStorage.setItem('botforge_users', JSON.stringify(users)); }

// Menus
function getMenus() { return JSON.parse(localStorage.getItem('botforge_menus') || '[]'); }
function saveMenus(menus) { localStorage.setItem('botforge_menus', JSON.stringify(menus)); }

// Config
function getConfig() { return JSON.parse(localStorage.getItem('botforge_config') || '{"prefix":"."}'); }
function saveConfig(config) { localStorage.setItem('botforge_config', JSON.stringify(config)); }

// Bots
function getBots() {
    const allBots = JSON.parse(localStorage.getItem('botforge_bots') || '[]');
    if (currentUser && currentUser.role !== 'admin') {
        return allBots.filter(b => b.userId === currentUser.id);
    }
    return allBots;
}
function saveBots(bots) { localStorage.setItem('botforge_bots', JSON.stringify(bots)); }
function addBot(bot) {
    const bots = JSON.parse(localStorage.getItem('botforge_bots') || '[]');
    bots.push(bot);
    localStorage.setItem('botforge_bots', JSON.stringify(bots));
}
function deleteBotById(botId) {
    let bots = JSON.parse(localStorage.getItem('botforge_bots') || '[]');
    bots = bots.filter(b => b.id !== botId);
    localStorage.setItem('botforge_bots', JSON.stringify(bots));
}

// Pterodactyl
function getPteroConfig() { return JSON.parse(localStorage.getItem('botforge_ptero') || '{"url":"","key":"","connected":false}'); }
function savePteroConfig(config) { localStorage.setItem('botforge_ptero', JSON.stringify(config)); }

// Subscription Plans
function getPlans() { return JSON.parse(localStorage.getItem('botforge_plans') || '[]'); }

initDatabase();
