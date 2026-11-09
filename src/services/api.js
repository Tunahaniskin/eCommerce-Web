/* ============================================================
   API SERVICE — Nexara eCommerce React Client
   Backend: http://localhost:5166
   ============================================================ */

export const API_BASE = import.meta.env.VITE_API_URL ?? '';

export const Api = {
  /* ——— Auth ——— */
  async login(email, password) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Giriş başarısız. Bilgilerinizi kontrol edin.');
    }
    return res.json();
  },

  async register(data) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Kayıt başarısız. Bilgilerinizi kontrol edin.');
    }
    return res.json();
  },

  /* ——— Products ——— */
  async getProducts({ page = 1, pageSize = 20, categoryId = null, search = null } = {}) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (categoryId) params.set('categoryId', categoryId);
    if (search && search.trim()) params.set('search', search.trim());

    const res = await fetch(`${API_BASE}/api/products?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.Message || 'Ürünler yüklenemedi.');
    }
    return res.json();
  },

  async getProductById(id) {
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.Message || 'Ürün bulunamadı.');
    }
    return res.json();
  },

  /* ——— Orders ——— */
  async getOrders(token) {
    if (!token) throw new Error('Oturum açmanız gerekiyor.');
    const res = await fetch(`${API_BASE}/api/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Siparişler yüklenemedi.');
    return res.json();
  },

  async getOrderById(id, token) {
    if (!token) throw new Error('Oturum açmanız gerekiyor.');
    const res = await fetch(`${API_BASE}/api/orders/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Sipariş bulunamadı.');
    return res.json();
  },

  async createOrder(items, token) {
    if (!token) throw new Error('Sipariş oluşturmak için oturum açmalısınız.');
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ items })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Sipariş oluşturulamadı.');
    }
    return res.json();
  },

  /* ——— Profile & Wallet ——— */
  async getProfile(token) {
    if (!token) throw new Error('Oturum açmanız gerekiyor.');
    const res = await fetch(`${API_BASE}/api/admin/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Profil yüklenemedi.');
    return res.json();
  },

  async getWallet(userId, token) {
    if (!token) return { balance: 0, transactions: [] };
    try {
      if (userId) {
        const res = await fetch(`${API_BASE}/api/admin/users/${userId}/customer-360`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          return {
            balance: Number(data?.stats?.currentBalance) || 0,
            transactions: Array.isArray(data?.walletTransactions) ? data.walletTransactions : [],
            stats: data?.stats || null
          };
        }
      }
    } catch {
      // Fallback
    }
    return { balance: 0, transactions: [] };
  },

  async requestDeposit(amount, token) {
    if (!token) throw new Error('Oturum açmanız gerekiyor.');
    const res = await fetch(`${API_BASE}/api/finance/deposit-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount: Number(amount) })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.Message || 'Bakiye yükleme talebi iletilemedi.');
    }
    return res.json();
  },

  /* ——— Client Logs ——— */
  async logClientError(message, stackTrace = '') {
    try {
      await fetch(`${API_BASE}/api/logs/client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          stackTrace,
          url: typeof window !== 'undefined' ? window.location.href : ''
        })
      });
    } catch {
      // sessizce geç
    }
  },

  /* ——— Helpers ——— */
  getImageUrl(path) {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE}${cleanPath}`;
  }
};

export function formatPrice(price) {
  if (price === null || price === undefined || isNaN(price)) return '₺0,00';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(price);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
