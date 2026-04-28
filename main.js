// ============ MAIN APPLICATION ============

function renderNavigation() {
    const config = getConfig();
    const prefix = config.prefix;
    const menus = getMenus();
    const navContainer = document.getElementById('nav-menu');
    const isAdmin = currentUser?.role === 'admin';
    
    // Main navigation
    let navHtml = `
        <div class="nav-section">Menu Utama</div>
        <div class="nav-item" onclick="loadPage('dashboard')">
            <span class="nav-icon">📊</span> Dashboard
        </div>
        <div class="nav-item" onclick="loadPage('create')">
            <span class="nav-icon">✚</span> Buat Bot
        </div>
        <div class="nav-item" onclick="loadPage('mybots')">
            <span class="nav-icon">🤖</span> Bot Saya
        </div>
        <div class="nav-item" onclick="loadPage('subscription')">
            <span class="nav-icon">💎</span> Langganan
        </div>
    `;
    
    // Commands navigation
    if (menus.length > 0) {
        navHtml += `<div class="nav-section">📋 Perintah (${prefix})</div>`;
        menus.slice(0, 8).forEach(menu => {
            navHtml += `
                <div class="nav-item" onclick="showCommandInfo('${menu.command}')">
                    <span class="nav-icon">⚡</span> ${prefix}${menu.command}
                </div>
            `;
        });
    }
    
    // Admin navigation
    if (isAdmin) {
        navHtml += `
            <div class="nav-section">Admin</div>
            <div class="nav-item" onclick="loadPage('admin')">
                <span class="nav-icon">⚙️</span> Admin Panel
            </div>
        `;
    }
    
    navContainer.innerHTML = navHtml;
}

function loadPage(pageName) {
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    event?.target?.closest('.nav-item')?.classList.add('active');
    
    document.getElementById('page-title').textContent = getPageTitle(pageName);
    
    // Load page content
    switch(pageName) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'create':
            renderCreateBotPage();
            break;
        case 'mybots':
            renderMyBots();
            break;
        case 'subscription':
            renderSubscriptionPage();
            break;
        case 'admin':
            if (currentUser?.role === 'admin') renderAdminPanel();
            else renderDashboard();
            break;
        default:
            renderDashboard();
    }
}

function getPageTitle(page) {
    const titles = {
        dashboard: 'Dashboard',
        create: 'Buat Bot Baru',
        mybots: 'Bot Saya',
        subscription: 'Langganan',
        admin: 'Admin Panel'
    };
    return titles[page] || 'Dashboard';
}

function renderDashboard() {
    const bots = getBots();
    const config = getConfig();
    
    const statsHtml = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Bot</div>
                <div class="stat-value green">${bots.length}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">WhatsApp</div>
                <div class="stat-value" style="color:var(--wa)">${bots.filter(b => b.type === 'wa').length}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Telegram</div>
                <div class="stat-value" style="color:var(--tg)">${bots.filter(b => b.type === 'tg').length}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Prefix</div>
                <div class="stat-value gold">${config.prefix}</div>
            </div>
        </div>
        <div class="card">
            <div class="card-title">📋 Bot Terbaru</div>
            <div id="recent-bots-list"></div>
        </div>
    `;
    
    document.getElementById('page-content').innerHTML = statsHtml;
    
    const recentContainer = document.getElementById('recent-bots-list');
    if (bots.length === 0) {
        recentContainer.innerHTML = `<div class="empty-state"><div class="empty-icon">🤖</div><div>Belum ada bot. <button class="btn btn-primary btn-sm" onclick="loadPage('create')">Buat sekarang</button></div></div>`;
    } else {
        recentContainer.innerHTML = bots.slice(-5).reverse().map(b => `
            <div style="display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid var(--border);">
                <span style="font-size:20px;">${b.type === 'wa' ? '💬' : '✈️'}</span>
                <div style="flex:1;">
                    <div style="font-weight:500;">${b.name}</div>
                    <div style="font-size:11px;color:var(--muted);">${new Date(b.createdAt).toLocaleDateString('id-ID')}</div>
                </div>
                <span class="chip ${b.type === 'wa' ? 'chip-wa' : 'chip-tg'}">${b.type === 'wa' ? 'WA' : 'TG'}</span>
            </div>
        `).join('');
    }
}

function renderCreateBotPage() {
    const canCreate = checkUserSubscription();
    
    if (!canCreate && currentUser?.role !== 'admin') {
        document.getElementById('page-content').innerHTML = `
            <div class="card">
                <div class="empty-state">
                    <div class="empty-icon">💎</div>
                    <div class="empty-title">Belum Berlangganan</div>
                    <div>Anda perlu berlangganan untuk membuat bot.</div>
                    <button class="btn btn-primary" style="margin-top:16px;" onclick="loadPage('subscription')">Lihat Paket</button>
                </div>
            </div>
        `;
        return;
    }
    
    const html = `
        <div class="bot-types" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
            <div class="bot-type-card" id="type-wa" onclick="selectBotType('wa')">
                <div style="font-size:36px;">💬</div>
                <div style="font-family:'Syne',sans-serif;font-weight:700;">WhatsApp Bot</div>
                <div style="font-size:12px;color:var(--muted);">Baileys / whatsapp-web.js</div>
            </div>
            <div class="bot-type-card" id="type-tg" onclick="selectBotType('tg')">
                <div style="font-size:36px;">✈️</div>
                <div style="font-family:'Syne',sans-serif;font-weight:700;">Telegram Bot</div>
                <div style="font-size:12px;color:var(--muted);">Telegraf / node-telegram-bot-api</div>
            </div>
        </div>
        <div id="bot-config-form"></div>
        <button class="btn btn-primary" style="width:100%;padding:12px;margin-top:16px;" onclick="generateBotCode()">⚡ Generate Kode Bot</button>
        <div id="generated-code" style="display:none;margin-top:20px;"></div>
        <div id="save-bot-section" style="display:none;margin-top:16px;">
            <button class="btn btn-primary" style="width:100%;" onclick="saveBot()">💾 Simpan Bot</button>
        </div>
    `;
    
    document.getElementById('page-content').innerHTML = html;
    selectedBotType = null;
}

function renderMyBots() {
    const bots = getBots();
    
    if (bots.length === 0) {
        document.getElementById('page-content').innerHTML = `
            <div class="card">
                <div class="empty-state">
                    <div class="empty-icon">🤖</div>
                    <div class="empty-title">Belum Ada Bot</div>
                    <div>Klik "Buat Bot" untuk membuat bot pertama Anda.</div>
                    <button class="btn btn-primary" style="margin-top:16px;" onclick="loadPage('create')">Buat Bot</button>
                </div>
            </div>
        `;
        return;
    }
    
    const html = `
        <div class="card">
            <div class="card-title">🤖 Daftar Bot Saya</div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Nama</th>
                            <th>Tipe</th>
                            <th>Library</th>
                            <th>Dibuat</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bots.map(b => `
                            <tr>
                                <td><strong>${b.name}</strong></td>
                                <td><span class="chip ${b.type === 'wa' ? 'chip-wa' : 'chip-tg'}">${b.type === 'wa' ? 'WhatsApp' : 'Telegram'}</span></td>
                                <td style="font-size:12px;">${b.lib || '-'}</td>
                                <td style="color:var(--muted);">${new Date(b.createdAt).toLocaleDateString('id-ID')}</td>
                                <td><span class="chip ${b.status === 'running' ? 'chip-active' : ''}">${b.status === 'running' ? 'Active' : 'Saved'}</span></td>
                                <td>
                                    <button class="btn btn-sm" onclick="viewBotCode(${b.id})">📄 Lihat Kode</button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteBot(${b.id})">🗑 Hapus</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    document.getElementById('page-content').innerHTML = html;
}

function renderSubscriptionPage() {
    const plans = getPlans();
    
    const html = `
        <div class="card">
            <div class="card-title">💎 Pilih Paket Subscription</div>
            <div class="info-box">
                📌 Subscription aktifkan fitur pembuatan bot. Admin memiliki akses penuh.
            </div>
            <div class="pricing-grid">
                ${plans.map(plan => `
                    <div class="pricing-card">
                        <div class="pricing-badge ${plan.badge}">${plan.name}</div>
                        <div class="pricing-price">
                            Rp ${plan.price_monthly.toLocaleString('id-ID')}
                            <small>/bulan</small>
                        </div>
                        <div class="pricing-price" style="font-size:20px;">
                            Rp ${plan.price_yearly.toLocaleString('id-ID')}
                            <small>/tahun</small>
                        </div>
                        <div class="pricing-features">
                            ${plan.features.map(f => `✓ ${f}<br>`).join('')}
                        </div>
                        <button class="btn btn-primary" onclick="selectPlan('${plan.id}', '${plan.name}')">Pilih Paket</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('page-content').innerHTML = html;
}

function viewBotCode(botId) {
    const bots = getBots();
    const bot = bots.find(b => b.id === botId);
    
    if (bot) {
        const modal = document.createElement('div');
        modal.className = 'modal-bg open';
        modal.innerHTML = `
            <div class="modal" style="max-width: 700px;">
                <div class="modal-title">📄 Kode Bot: ${bot.name}</div>
                <pre style="background:var(--bg3);padding:16px;border-radius:8px;overflow:auto;max-height:400px;font-size:11px;font-family:'DM Mono',monospace;">${escapeHtml(bot.code)}</pre>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="copyToClipboard(\`${escapeHtml(bot.code)}\`)">📋 Salin</button>
                    <button class="btn" onclick="this.closest('.modal-bg').remove()">Tutup</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    notify('Kode disalin!', 'success');
}

function showCommandInfo(command) {
    const menus = getMenus();
    const menu = menus.find(m => m.command === command);
    const prefix = getConfig().prefix;
    
    if (menu) {
        notify(`📌 ${prefix}${command}: ${menu.description}`, 'info');
    }
}

function deleteBot(botId) {
    if (confirm('Hapus bot ini?')) {
        deleteBotById(botId);
        renderMyBots();
        renderDashboard();
        notify('Bot berhasil dihapus', 'success');
    }
}

function notify(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `notif ${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

function initApp() {
    const session = sessionStorage.getItem('botforge_user');
    
    if (session) {
        const userData = JSON.parse(session);
        currentUser = userData;
        
        document.getElementById('auth-overlay').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        
        document.getElementById('user-name-display').innerHTML = `
            ${userData.username}
            <span class="user-role ${userData.role === 'admin' ? 'admin' : ''}">
                ${userData.role === 'admin' ? '👑 Admin' : '👤 User'}
            </span>
        `;
        
        updateSubscriptionInfo();
        renderNavigation();
        renderDashboard();
        
        // Check subscription for non-admin
        if (userData.role !== 'admin' && !checkUserSubscription()) {
            setTimeout(() => {
                notify('⚠️ Anda belum berlangganan. Silakan pilih paket subscription untuk membuat bot.', 'warn');
                loadPage('subscription');
            }, 1000);
        }
        
        // Load ptero for admin
        if (userData.role === 'admin') {
            const pteroConfig = getPteroConfig();
            if (pteroConfig.connected) {
                pteroConnected = true;
                pteroServers = [];
            }
        }
    } else {
        document.getElementById('auth-overlay').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
    }
}

// Start application
initApp();
