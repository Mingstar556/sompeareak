/* ================================================================
   SRDB – Python Backend Client & Local Cache
   Connects to Python Flask backend (/api/...) and SQLite database.
   Provides instant synchronous access with background async sync.
   ================================================================ */
const SRDB = (() => {
  const STORAGE_KEY = 'srdb_cache_v2';
  const DEFAULT = {
    settings: {
      site_title: 'សម្ភារៈ - Somphea Reak',
      siteTitle: 'សម្ភារៈ - Somphea Reak',
      subtitle: 'Premium Studio',
      tagline: 'Cambodia Kingdom of Wonder',
      site_logo: 'logo.jpg',
      siteLogo: 'logo.jpg',
      admin_pin: '1234',
      adminPin: '1234',
      delivery_fee: 1.5,
      deliveryFee: 1.5,
      voucher_cost: 25,
      voucherCost: 25,
      voucher_pct: 10,
      voucherPct: 10,
      custom_base_price: 8.0,
      customBasePrice: 8.0,
      charm_price: 1.5,
      charmPrice: 1.5,
      custom_pt: 5,
      customPt: 5,
      charms: ['❤️','⭐','🌸','🦋','🐱','🍀','🌙','☀️','💎','🎀','🐶','🌈','⚽','🎵','🇰🇭','🔤','⚡','👑'],
      announcement: '✨ Welcome to Somphea Reak Studio • Verified Telegram Orders • Earn Points on Every Item!',
      seller_telegram: 'sompheareak',
      sellerTelegram: 'sompheareak',
    },
    categories: [
      { id: 'custom-bracelet', name: 'Custom Italy Charm', kh: 'CUSTOMIZE ITALY CHARM', en: 'Build your own charm bracelet', icon: '🔗', grad: 'linear-gradient(135deg,#d4af37,#8b5cf6)', sort_order: 0 },
      { id: 'minifigure', name: 'Minifigure', kh: 'MINIFIGURE', en: 'Collectible mini figures', icon: '🧸', grad: 'linear-gradient(135deg,#06b6d4,#3b82f6)', sort_order: 1 },
      { id: 'toy-universe', name: 'Toy Universe', kh: 'TOY', en: 'Toy universe', icon: '🪀', grad: 'linear-gradient(135deg,#f97316,#ec4899)', sort_order: 2 },
      { id: 'bracelet', name: 'Ready-Made Bracelet', kh: 'Bracelet for Female&Male', en: 'Ready-made bracelets', icon: '📿', grad: 'linear-gradient(135deg,#22c55e,#14b8a6)', sort_order: 3 },
    ],
    products: [],
    orders: [],
    users: [],
    notifications: [],
  };

  let data = readCache();
  function readCache() {
    try {
      const c = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (c && c.settings) {
        return {
          ...DEFAULT,
          ...c,
          settings: { ...DEFAULT.settings, ...c.settings },
          categories: (Array.isArray(c.categories) && c.categories.length) ? c.categories : structuredClone(DEFAULT.categories),
        };
      }
    } catch (e) {}
    return structuredClone(DEFAULT);
  }

  // Real-time zero-delay BroadcastChannel for instant cross-tab live sync
  const liveChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('sr_live_sync_bus') : null;

  function writeCache(broadcast = true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
    notifyListeners();
    if (broadcast && liveChannel) {
      try { liveChannel.postMessage({ type: 'SYNC', at: Date.now() }); } catch (err) {}
    }
  }

  const listeners = [];
  function notifyListeners() {
    listeners.forEach(fn => {
      try { fn(); } catch (err) { console.error('Listener error:', err); }
    });
  }

  // Cross-tab broadcast listener
  if (liveChannel) {
    liveChannel.onmessage = () => {
      data = readCache();
      notifyListeners();
    };
  }

  // Cross-tab storage fallback sync
  window.addEventListener('storage', e => {
    if (e.key === STORAGE_KEY) {
      data = readCache();
      notifyListeners();
    }
  });

  // Base API caller
  const API_BASE = window.location.origin.includes('http') ? '' : 'http://127.0.0.1:5000';
  async function api(path, opts = {}) {
    try {
      const pin = sessionStorage.getItem('sr_admin_pin') || (sessionStorage.getItem('sr_admin') === '1' ? (data?.settings?.admin_pin || '1234') : '');
      const headers = {
        'Content-Type': 'application/json',
        ...(pin ? { 'X-Admin-PIN': pin } : {}),
        ...(opts.headers || {})
      };
      const res = await fetch(`${API_BASE}${path}`, {
        ...opts,
        headers,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.warn(`Python API [${path}] error or offline, fallback to local:`, e.message);
      return null;
    }
  }

  // Initial full fetch from Python backend
  async function syncFromPython() {
    const [st, cats, pr, ord, usr, notif] = await Promise.all([
      api('/api/settings'),
      api('/api/categories'),
      api('/api/products?all=1'),
      api('/api/orders'),
      api('/api/users'),
      api('/api/notifications')
    ]);

    let changed = false;
    if (st) {
      // Normalize both snake_case and camelCase
      data.settings = {
        ...data.settings,
        ...st,
        siteTitle: st.site_title || st.siteTitle || data.settings.siteTitle,
        siteLogo: st.site_logo || st.siteLogo || data.settings.siteLogo || 'logo.jpg',
        adminPin: st.admin_pin || st.adminPin || data.settings.adminPin,
        deliveryFee: st.delivery_fee !== undefined ? st.delivery_fee : data.settings.deliveryFee,
        voucherCost: st.voucher_cost !== undefined ? st.voucher_cost : data.settings.voucherCost,
        voucherPct: st.voucher_pct !== undefined ? st.voucher_pct : data.settings.voucherPct,
        customBasePrice: st.custom_base_price !== undefined ? st.custom_base_price : data.settings.customBasePrice,
        charmPrice: st.charm_price !== undefined ? st.charm_price : data.settings.charmPrice,
        customPt: st.custom_pt !== undefined ? st.custom_pt : data.settings.customPt,
      };
      changed = true;
    }
    if (Array.isArray(cats) && cats.length) { data.categories = cats; changed = true; }
    if (Array.isArray(pr)) { data.products = pr; changed = true; }
    if (Array.isArray(ord)) { data.orders = ord; changed = true; }
    if (Array.isArray(usr)) { data.users = usr; changed = true; }
    if (Array.isArray(notif)) { data.notifications = notif; changed = true; }

    if (changed) writeCache(false);
  }

  // Poll Python server every 2.5 seconds for live order & status synchronization
  setInterval(syncFromPython, 2500);
  setTimeout(syncFromPython, 50);

  return {
    onChange: fn => listeners.push(fn),
    sync: syncFromPython,
    reload() { data = readCache(); },

    /* --- Categories --- */
    categories: () => (Array.isArray(data.categories) && data.categories.length) ? data.categories : DEFAULT.categories,
    category: id => (data.categories || DEFAULT.categories).find(c => c.id === id),
    async upsertCategory(cat) {
      if (!Array.isArray(data.categories)) data.categories = structuredClone(DEFAULT.categories);
      if (cat.id) {
        const idx = data.categories.findIndex(c => c.id === cat.id);
        if (idx !== -1) data.categories[idx] = { ...data.categories[idx], ...cat };
        else data.categories.push(cat);
      } else {
        const slug = (cat.name || cat.kh || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ('cat-' + Date.now().toString(36));
        cat.id = slug;
        data.categories.push(cat);
      }
      writeCache();
      const res = await api('/api/categories', {
        method: 'POST',
        body: JSON.stringify(cat)
      });
      if (res) syncFromPython();
      return cat;
    },
    async deleteCategory(id) {
      data.categories = (data.categories || DEFAULT.categories).filter(c => c.id !== id);
      writeCache();
      await api(`/api/categories/${id}`, { method: 'DELETE' });
      syncFromPython();
    },

    /* --- Settings --- */
    settings: () => data.settings,
    async saveSettings(patch) {
      Object.assign(data.settings, patch);
      writeCache();
      const res = await api('/api/settings', {
        method: 'POST',
        body: JSON.stringify(patch)
      });
      if (res) syncFromPython();
      return data.settings;
    },

    /* --- Products --- */
    products: (all = false) => data.products.filter(p => all || p.active),
    product: id => data.products.find(p => p.id === id),
    finalPrice: p => +(p.price * (1 - (p.discount || 0) / 100)).toFixed(2),

    async upsertProduct(p) {
      // Optimistic local update
      if (p.id) {
        const ex = this.product(p.id);
        if (ex) Object.assign(ex, p);
      } else {
        const tempId = 'P' + Date.now().toString(36);
        data.products.unshift({
          ...p,
          id: tempId,
          active: p.active !== undefined ? p.active : true,
          stock: Math.max(0, parseInt(p.stock) || 0),
          discount: Math.min(100, Math.max(0, parseFloat(p.discount) || 0)),
          createdAt: new Date().toISOString(),
        });
      }
      writeCache();

      // Post to Python API
      const saved = await api('/api/products', {
        method: 'POST',
        body: JSON.stringify(p)
      });
      if (saved) {
        syncFromPython();
        return saved;
      }
      return p;
    },

    async adjustStock(id, delta) {
      const p = this.product(id);
      if (p) {
        p.stock = Math.max(0, p.stock + delta);
        writeCache();
      }
      await api(`/api/products/${id}/stock`, {
        method: 'POST',
        body: JSON.stringify({ delta })
      });
      syncFromPython();
    },

    async deleteProduct(id) {
      data.products = data.products.filter(p => p.id !== id);
      writeCache();
      await api(`/api/products/${id}`, { method: 'DELETE' });
      syncFromPython();
    },

    async clearProducts() {
      data.products = [];
      writeCache();
      await api('/api/products/clear', { method: 'POST' });
      syncFromPython();
    },

    async seedSampleProducts() {
      const res = await api('/api/products/seed', { method: 'POST' });
      if (res) {
        await syncFromPython();
        return data.products.length;
      }
      return 0;
    },

    /* --- Users --- */
    users: () => data.users,
    user: id => data.users.find(u => u.id === id),

    async upsertUser({ username, phone }) {
      const uname = username.trim().replace(/^@/, '');
      let u = data.users.find(x => x.username.toLowerCase() === uname.toLowerCase());
      if (u) {
        u.phone = phone;
      } else {
        u = {
          id: 'U' + Date.now().toString(36),
          username: uname,
          phone,
          name: '',
          points: 0,
          vouchers: [],
          point_log: [],
          createdAt: new Date().toISOString()
        };
        data.users.push(u);
      }
      writeCache();

      const serverUser = await api('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({ username: uname, phone })
      });
      if (serverUser) {
        Object.assign(u, serverUser);
        writeCache();
      }
      return u;
    },

    async updateUser(id, patch) {
      const u = this.user(id);
      if (u) {
        Object.assign(u, patch);
        writeCache();
      }
      await api(`/api/users/${id}`, {
        method: 'POST',
        body: JSON.stringify(patch)
      });
      syncFromPython();
    },

    async redeemVoucher(userId) {
      const res = await api(`/api/users/${userId}/redeem-voucher`, {
        method: 'POST'
      });
      if (res && res.voucher) {
        const u = this.user(userId);
        if (u && res.user) {
          Object.assign(u, res.user);
          writeCache();
        }
        syncFromPython();
        return res;
      }
      // Offline fallback
      const u = this.user(userId);
      if (!u) return { error: 'User not found' };
      const st = this.settings();
      const vc = st.voucherCost || 25;
      const vp = st.voucherPct || 10;
      if ((u.points || 0) < vc) return { error: `Insufficient points (need ${vc} pt)` };
      const code = 'SR' + vp + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
      const vObj = { code, pct: vp, used: false, created_at: new Date().toISOString() };
      if (!u.vouchers) u.vouchers = [];
      u.vouchers.unshift(vObj);
      u.points -= vc;
      if (!u.point_log) u.point_log = [];
      u.point_log.unshift({ t: 'Redeemed voucher ' + code, d: -vc, at: new Date().toISOString() });
      writeCache();
      return { voucher: vObj, user: u };
    },

    async resetDatabase() {
      const res = await api('/api/database/reset', { method: 'POST' });
      await syncFromPython();
      return res;
    },

    async addPoints(id, delta, reason) {
      const u = this.user(id);
      if (u) {
        u.points = Math.max(0, u.points + delta);
        if (!u.point_log) u.point_log = [];
        u.point_log.unshift({ t: reason, d: delta, at: new Date().toISOString() });
        writeCache();
      }
      await api(`/api/users/${id}/points`, {
        method: 'POST',
        body: JSON.stringify({ delta, reason })
      });
      syncFromPython();
    },

    /* --- Orders --- */
    orders: () => data.orders,
    ordersOf: userId => data.orders.filter(o => o.user_id === userId || o.userId === userId),
    order: id => data.orders.find(o => o.id === id),

    async placeOrder(orderData) {
      const payload = {
        user_id: orderData.userId || orderData.user_id,
        items: orderData.items,
        subtotal: orderData.subtotal,
        discount: orderData.discount,
        delivery: orderData.delivery,
        total: orderData.total,
        earned: orderData.earned,
        voucher: orderData.voucher,
        contact: orderData.contact,
      };

      const tempId = 'SR' + Date.now().toString().slice(-6);
      const localOrder = { ...payload, id: tempId, status: 'Pending', createdAt: new Date().toISOString() };
      data.orders.unshift(localOrder);

      if (payload.voucher) {
        const u = this.user(payload.user_id);
        if (u && Array.isArray(u.vouchers)) {
          const v = u.vouchers.find(x => x.code === payload.voucher);
          if (v) {
            v.used = true;
            v.used_at = new Date().toISOString();
            v.order_id = tempId;
          }
        }
      }
      writeCache();

      const saved = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (saved) {
        Object.assign(localOrder, saved);
        if (payload.voucher) {
          const u = this.user(payload.user_id);
          const v = u?.vouchers?.find(x => x.code === payload.voucher);
          if (v) v.order_id = saved.id;
        }
        writeCache();
        syncFromPython();
        return saved;
      }
      return localOrder;
    },

    async approveOrder(id) {
      const o = this.order(id);
      if (!o || o.status !== 'Pending') return 'Order is not in pending status';

      // Check stock locally
      for (const it of o.items || []) {
        if (it.productId) {
          const p = this.product(it.productId);
          if (p && p.stock < (it.qty || 1)) {
            return `Insufficient stock for "${p.name}" (only ${p.stock} remaining)`;
          }
        }
      }

      const res = await api(`/api/orders/${id}/approve`, { method: 'POST' });
      if (res && res.error) return res.error;

      // Local update
      o.status = 'Approved';
      (o.items || []).forEach(it => {
        if (it.productId) {
          const p = this.product(it.productId);
          if (p) p.stock = Math.max(0, p.stock - (it.qty || 1));
        }
      });
      writeCache();
      syncFromPython();
      return null;
    },

    async rejectOrder(id, note = 'Out of stock') {
      const o = this.order(id);
      if (o) { o.status = 'Rejected'; o.note = note; writeCache(); }
      await api(`/api/orders/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ note })
      });
      syncFromPython();
    },

    async cancelOrder(id, reason = 'Cancelled by admin') {
      const o = this.order(id);
      if (o) { o.status = 'Cancelled'; o.note = reason; writeCache(); }
      await api(`/api/orders/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      syncFromPython();
    },

    async setStatus(id, status) {
      const o = this.order(id);
      if (o) { o.status = status; writeCache(); }
      await api(`/api/orders/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status })
      });
      syncFromPython();
    },

    /* --- Notifications --- */
    notifications: () => data.notifications,
    unread: () => data.notifications.filter(n => !n.read && n.type === 'receipt').length,
    async markAllRead() {
      data.notifications.forEach(n => { n.read = true; });
      writeCache();
      await api('/api/notifications/read', { method: 'POST' });
    },
  };
})();
