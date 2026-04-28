// ============ PTERODACTYL (ADMIN ONLY) ============

let pteroConnected = false;
let pteroServers = [];

async function connectPterodactyl() {
    if (currentUser.role !== 'admin') {
        notify('Hanya admin yang dapat menghubungkan ke panel Pterodactyl!', 'error');
        return;
    }
    
    const url = document.getElementById('ptero-url').value.trim();
    const key = document.getElementById('ptero-key').value.trim();
    
    if (!url || !key) return notify('Isi URL dan API Key!', 'error');
    
    const btn = document.getElementById('connect-ptero-btn');
    if (btn) {
        btn.innerHTML = '<span class="loading" style="display:inline-block;width:14px;height:14px;border:2px solid var(--accent);border-top-color:transparent;border-radius:50%;animation:spin 0.6s linear infinite;"></span> Menghubungkan...';
        btn.disabled = true;
    }
    
    try {
        const res = await fetch(url + '/api/client/account', {
            headers: { 'Authorization': 'Bearer ' + key, 'Accept': 'application/json' }
        });
        
        if (!res.ok) throw new Error('Gagal konek ke panel');
        
        const serversRes = await fetch(url + '/api/client', {
            headers: { 'Authorization': 'Bearer ' + key }
        });
        const serversData = await serversRes.json();
        
        pteroConnected = true;
        pteroServers = serversData.data || [];
        
        // Save config
        savePteroConfig({ url, key, connected: true });
        
        document.getElementById('status-dot').classList.add('connected');
        document.getElementById('status-text').textContent = 'Panel terhubung ✓';
        
        notify('Berhasil terhubung ke Pterodactyl!', 'success');
        
        // Render server list
        renderPteroServerList();
        
    } catch (e) {
        notify('Gagal: ' + e.message, 'error');
    }
    
    if (btn) {
        btn.innerHTML = '🔌 Hubungkan Panel';
        btn.disabled = false;
    }
}

function disconnectPterodactyl() {
    if (currentUser.role !== 'admin') return;
    
    pteroConnected = false;
    pteroServers = [];
    savePteroConfig({ url: '', key: '', connected: false });
    
    document.getElementById('status-dot').classList.remove('connected');
    document.getElementById('status-text').textContent = 'Panel belum terhubung';
    
    notify('Panel diputuskan', 'info');
    
    const serverContainer = document.getElementById('ptero-server-list');
    if (serverContainer) {
        serverContainer.innerHTML = '<div class="empty-state">Panel belum terhubung</div>';
    }
}

function renderPteroServerList() {
    const container = document.getElementById('ptero-server-list');
    if (!container) return;
    
    if (!pteroConnected || pteroServers.length === 0) {
        container.innerHTML = '<div class="empty-state">Tidak ada server atau panel belum terhubung</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="server-list">
            ${pteroServers.map(s => `
                <div class="server-item">
                    <div>
                        <strong>${s.attributes.name}</strong>
                        <div style="font-size:11px;color:var(--muted);">${s.attributes.identifier}</div>
                    </div>
                    <div>
                        <span class="chip ${s.attributes.status === 'running' ? 'chip-active' : ''}">
                            ${s.attributes.status === 'running' ? '▶ Running' : '◼ Offline'}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function deployToServer(botCode, botName, serverId) {
    if (currentUser.role !== 'admin') {
        notify('Hanya admin yang dapat deploy ke server!', 'error');
        return false;
    }
    
    const pteroConfig = getPteroConfig();
    if (!pteroConfig.connected) {
        notify('Panel Pterodactyl belum terhubung!', 'error');
        return false;
    }
    
    try {
        // Upload file
        const uploadRes = await fetch(`${pteroConfig.url}/api/client/servers/${serverId}/files/write?file=/bot.js`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + pteroConfig.key, 'Content-Type': 'text/plain' },
            body: botCode
        });
        
        if (!uploadRes.ok) throw new Error('Gagal upload file');
        
        // Send command to start
        await fetch(`${pteroConfig.url}/api/client/servers/${serverId}/command`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + pteroConfig.key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: 'node bot.js' })
        });
        
        return true;
    } catch (e) {
        notify('Deploy gagal: ' + e.message, 'error');
        return false;
    }
}
