// ============ ADMIN FUNCTIONS ============

function renderAdminPanel() {
    if (currentUser.role !== 'admin') {
        document.getElementById('page-content').innerHTML = '<div class="empty-state">⛔ Akses ditolak. Halaman ini hanya untuk admin.</div>';
        return;
    }
    
    const menus = getMenus();
    const users = getUsers();
    const config = getConfig();
    const pteroConfig = getPteroConfig();
    
    const html = `
        <div class="card">
            <div class="card-title">⚙️ Pengaturan Global</div>
            <div class="form-group">
                <label>Default Prefix</label>
                <div style="display:flex;gap:10px;align-items:center;">
                    <input type="text" id="admin-prefix" value="${config.prefix}" style="width:80px;">
                    <button class="btn btn-primary btn-sm" onclick="updateAdminPrefix()">Update</button>
                </div>
            </div>
            <div class="info-box">
                📌 Prefix digunakan untuk semua perintah bot. Contoh: ${config.prefix}help
            </div>
        </div>
        
        <div class="card">
            <div class="card-title">🦅 Koneksi Pterodactyl (Admin Only)</div>
            <div class="info-box">
                Hubungkan panel Pterodactyl untuk deploy bot ke server VPS.
            </div>
            <div class="form-group">
                <label>URL Panel</label>
                <input type="text" id="admin-ptero-url" value="${pteroConfig.url || ''}" placeholder="https://panel.domain.com">
            </div>
            <div class="form-group">
                <label>Client API Key</label>
                <input type="password" id="admin-ptero-key" value="${pteroConfig.key || ''}" placeholder="ptlc_xxx">
            </div>
            <div style="display:flex;gap:10px;">
                <button class="btn btn-primary" id="connect-ptero-btn" onclick="connectPterodactyl()">🔌 Hubungkan Panel</button>
                <button class="btn btn-danger" onclick="disconnectPterodactyl()">✖ Putuskan</button>
            </div>
            <div id="ptero-server-list" style="margin-top:20px;">
                ${pteroConfig.connected ? '<div class="loading">Memuat server...</div>' : '<div class="empty-state">Panel belum terhubung</div>'}
            </div>
        </div>
        
        <div class="card">
            <div class="card-title">📋 Daftar Menu / Perintah</div>
            <button class="btn btn-primary btn-sm" onclick="showAddMenuModal()" style="margin-bottom:16px;">+ Tambah Menu</button>
            <div id="admin-menu-table"></div>
        </div>
        
        <div class="card">
            <div class="card-title">👥 Manajemen User</div>
            <div id="admin-user-table"></div>
        </div>
        
        <div class="card">
            <div class="card-title">💰 Subscription Plans</div>
            <button class="btn btn-primary btn-sm" onclick="editPlans()" style="margin-bottom:16px;">✏️ Edit Paket</button>
            <div id="admin-plans-table"></div>
        </div>
    `;
    
    document.getElementById('page-content').innerHTML = html;
    
    // Render tables
    renderAdminMenuTable();
    renderAdminUserTable();
    renderAdminPlansTable();
    
    // Load servers if connected
    if (pteroConfig.connected) {
        pteroConnected = true;
        pteroServers = [];
        renderPteroServerList();
    }
}

function updateAdminPrefix() {
    const newPrefix = document.getElementById('admin-prefix').value.trim();
    if (!newPrefix) return notify('Prefix tidak boleh kosong!', 'error');
    saveConfig({ prefix: newPrefix });
    notify(`Prefix diubah menjadi "${newPrefix}"`, 'success');
}

function renderAdminMenuTable() {
    const menus = getMenus();
    const prefix = getConfig().prefix;
    const container = document.getElementById('admin-menu-table');
    
    if (!container) return;
    
    if (menus.length === 0) {
        container.innerHTML = '<div class="empty-state">Belum ada menu</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="table-wrap">
            <table>
                <thead><tr><th>Perintah</th><th>Deskripsi</th><th>Tipe</th><th>Aksi</th></tr></thead>
                <tbody>
                    ${menus.map(m => `
                        <tr>
                            <td><code>${prefix}${m.command}</code></td>
                            <td>${m.description}</td>
                            <td><span class="chip">${m.type}</span></td>
                            <td><button class="btn btn-sm btn-danger" onclick="deleteMenu(${m.id})">Hapus</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderAdminUserTable() {
    const users = getUsers();
    const container = document.getElementById('admin-user-table');
    
    if (!container) return;
    
    container.innerHTML = `
        <div class="table-wrap">
            <table>
                <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Subscription</th><th>Expiry</th><th>Aksi</th></tr></thead>
                <tbody>
                    ${users.map(u => `
                        <tr>
                            <td>${u.username}</td>
                            <td>${u.email || '-'}</td>
                            <td><span class="chip ${u.role === 'admin' ? 'chip-active' : ''}">${u.role}</span></td>
                            <td>${u.subscription ? `<span class="chip chip-gold">${u.subscription}</span>` : '-'}</td>
                            <td>${u.subscriptionExpiry ? new Date(u.subscriptionExpiry).toLocaleDateString('id-ID') : '-'}</td>
                            <td>
                                ${u.role !== 'admin' ? `<button class="btn btn-sm" onclick="makeAdmin(${u.id})">Jadikan Admin</button>` : ''}
                                <button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id})">Hapus</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderAdminPlansTable() {
    const plans = getPlans();
    const container = document.getElementById('admin-plans-table');
    
    if (!container) return;
    
    container.innerHTML = `
        <div class="table-wrap">
            <table>
                <thead><tr><th>Paket</th><th>Harga Bulanan</th><th>Harga Tahunan</th><th>Fitur</th><th>Aksi</th></tr></thead>
                <tbody>
                    ${plans.map(p => `
                        <tr>
                            <td><strong>${p.name}</strong></td>
                            <td>Rp ${p.price_monthly.toLocaleString('id-ID')}</td>
                            <td>Rp ${p.price_yearly.toLocaleString('id-ID')}</td>
                            <td style="max-width:300px;">${p.features.join(', ')}</td>
                            <td><button class="btn btn-sm" onclick="editPlan('${p.id}')">✏️ Edit</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function showAddMenuModal() {
    document.getElementById('add-menu-modal').classList.add('open');
}

function closeMenuModal() {
    document.getElementById('add-menu-modal').classList.remove('open');
    document.getElementById('menu-cmd').value = '';
    document.getElementById('menu-desc').value = '';
}

function addNewMenu() {
    const command = document.getElementById('menu-cmd').value.trim().toLowerCase();
    const description = document.getElementById('menu-desc').value.trim();
    const type = document.getElementById('menu-type').value;
    
    if (!command || !description) return notify('Isi command dan deskripsi!', 'error');
    
    const menus = getMenus();
    if (menus.find(m => m.command === command)) return notify('Perintah sudah ada!', 'error');
    
    const newMenu = {
        id: Date.now(),
        command,
        description,
        type,
        code: `return "📌 ${description}";`
    };
    
    menus.push(newMenu);
    saveMenus(menus);
    closeMenuModal();
    renderAdminMenuTable();
    notify(`Perintah ${command} berhasil ditambahkan!`, 'success');
}

function deleteMenu(id) {
    if (confirm('Hapus perintah ini?')) {
        let menus = getMenus();
        menus = menus.filter(m => m.id !== id);
        saveMenus(menus);
        renderAdminMenuTable();
        notify('Perintah dihapus', 'info');
    }
}

function makeAdmin(userId) {
    let users = getUsers();
    const user = users.find(u => u.id === userId);
    if (user && user.role !== 'admin') {
        user.role = 'admin';
        saveUsers(users);
        renderAdminUserTable();
        notify(`${user.username} sekarang menjadi admin!`, 'success');
    }
}

function deleteUser(userId) {
    if (userId === currentUser.id) {
        notify('Tidak bisa menghapus akun sendiri!', 'error');
        return;
    }
    
    if (confirm('Hapus user ini? Semua bot user akan ikut terhapus.')) {
        let users = getUsers();
        users = users.filter(u => u.id !== userId);
        saveUsers(users);
        
        // Delete user's bots
        let bots = JSON.parse(localStorage.getItem('botforge_bots') || '[]');
        bots = bots.filter(b => b.userId !== userId);
        saveBots(bots);
        
        renderAdminUserTable();
        notify('User berhasil dihapus', 'success');
    }
}

function editPlan(planId) {
    const plans = getPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    
    const newMonthly = prompt(`Edit harga bulanan untuk ${plan.name}:`, plan.price_monthly);
    const newYearly = prompt(`Edit harga tahunan untuk ${plan.name}:`, plan.price_yearly);
    
    if (newMonthly && newYearly) {
        plan.price_monthly = parseInt(newMonthly);
        plan.price_yearly = parseInt(newYearly);
        saveMenus(plans); // Reuse saveMenus for plans
        localStorage.setItem('botforge_plans', JSON.stringify(plans));
        renderAdminPlansTable();
        notify(`Paket ${plan.name} diperbarui!`, 'success');
    }
}

function editPlans() {
    notify('Klik Edit pada paket yang ingin diubah', 'info');
}
