// ============ SUBSCRIPTION ============

function showSubscriptionModal() {
    const plans = getPlans();
    const pricingContainer = document.getElementById('pricing-list');
    
    if (!pricingContainer) return;
    
    pricingContainer.innerHTML = plans.map(plan => `
        <div class="pricing-card" onclick="selectPlan('${plan.id}', '${plan.name}')">
            <div class="pricing-badge ${plan.badge}">${plan.name}</div>
            <div class="pricing-price">
                Rp ${plan.price_monthly.toLocaleString('id-ID')}
                <small>/bulan</small>
            </div>
            <div class="pricing-price" style="font-size:20px;">
                Rp ${plan.price_yearly.toLocaleString('id-ID')}
                <small>/tahun (hemat ${Math.round((1 - plan.price_yearly/(plan.price_monthly*12)) * 100)}%)</small>
            </div>
            <div class="pricing-features">
                ${plan.features.map(f => `✓ ${f}<br>`).join('')}
            </div>
            <button class="btn btn-primary" style="margin-top:16px;">Pilih Paket</button>
        </div>
    `).join('');
    
    document.getElementById('subscription-modal').classList.add('open');
}

function closeSubscriptionModal() {
    document.getElementById('subscription-modal').classList.remove('open');
}

function selectPlan(planId, planName) {
    closeSubscriptionModal();
    
    const plans = getPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    
    const choice = confirm(`Pilih paket ${planName}:\n\n1. Bulanan - Rp ${plan.price_monthly.toLocaleString('id-ID')}\n2. Tahunan - Rp ${plan.price_yearly.toLocaleString('id-ID')}\n\nKlik OK untuk Bulanan, Cancel untuk Tahunan`);
    
    const isYearly = !choice;
    const amount = isYearly ? plan.price_yearly : plan.price_monthly;
    const duration = isYearly ? 365 : 30;
    
    // Simulasi pembayaran
    notify(`Redirect ke pembayaran...\nPaket: ${planName}\n${isYearly ? 'Tahunan' : 'Bulanan'}\nTotal: Rp ${amount.toLocaleString('id-ID')}`, 'info');
    
    setTimeout(() => {
        // Simulasi pembayaran sukses
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + duration);
        
        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        
        if (userIndex !== -1) {
            users[userIndex].subscription = planId;
            users[userIndex].subscriptionExpiry = expiryDate.toISOString();
            saveUsers(users);
            
            // Update current user
            currentUser.subscription = planId;
            currentUser.subscriptionExpiry = expiryDate.toISOString();
            sessionStorage.setItem('botforge_user', JSON.stringify(currentUser));
            
            updateSubscriptionInfo();
            notify(`✅ Pembayaran berhasil! Subscription ${planName} aktif sampai ${expiryDate.toLocaleDateString('id-ID')}`, 'success');
            
            // Refresh page to update limits
            setTimeout(() => location.reload(), 1500);
        }
    }, 1500);
}

function canCreateBot() {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (!checkUserSubscription()) return false;
    
    const bots = getBots();
    const plans = getPlans();
    const userPlan = plans.find(p => p.id === currentUser.subscription);
    
    if (!userPlan) return false;
    
    // Check bot limit based on plan
    let maxBots = 1;
    if (userPlan.id === 'standard') maxBots = 1;
    if (userPlan.id === 'gold') maxBots = 5;
    if (userPlan.id === 'platinum') maxBots = 999;
    
    if (bots.length >= maxBots) {
        notify(`Limit bot Anda sudah mencapai ${maxBots}. Upgrade paket untuk membuat lebih banyak bot!`, 'error');
        return false;
    }
    
    return true;
}
