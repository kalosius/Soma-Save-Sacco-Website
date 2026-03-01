// API Base URL - dynamic based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ── In-memory API response cache for instant re-renders ──
const apiCache = new Map();
const CACHE_TTL = 30_000; // 30 seconds

function getCached(key) {
  const entry = apiCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  apiCache.delete(key);
  return null;
}

function setCache(key, data, ttl = CACHE_TTL) {
  apiCache.set(key, { data, ts: Date.now() });
  // Auto-cleanup
  setTimeout(() => apiCache.delete(key), ttl);
}

// ── Auth token helper ──
function getAuthToken() {
  return localStorage.getItem('authToken');
}

// Wrapper around fetch that auto-injects the Authorization header
function apiFetch(url, options = {}) {
  const token = getAuthToken();
  if (token) {
    options.headers = {
      ...(options.headers || {}),
      'Authorization': `Token ${token}`,
    };
  }
  return fetch(url, options);
}

// Deduplicate in-flight requests
const inflightRequests = new Map();

function deduplicatedFetch(url, options) {
  // Auto-inject auth token
  const token = getAuthToken();
  if (token) {
    options = { ...options, headers: { ...(options?.headers || {}), 'Authorization': `Token ${token}` } };
  }
  const key = url + (options?.method || 'GET');
  if (options?.method === 'GET' || !options?.method) {
    if (inflightRequests.has(key)) return inflightRequests.get(key);
  }
  const promise = fetch(url, options).finally(() => inflightRequests.delete(key));
  if (options?.method === 'GET' || !options?.method) {
    inflightRequests.set(key, promise);
  }
  return promise;
}

// Helper function to get CSRF token from cookies
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// API Service
const api = {
  // Auth endpoints
  auth: {
    register: async (userData) => {
      const response = await apiFetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const error = new Error(data.error || data.message || 'Registration failed');
        error.response = { data };
        throw error;
      }
      
      return data;
    },

    login: async (identifier, password, otp = null) => {
      const body = { identifier, password };
      if (otp) {
        body.otp = otp;
      }
      
      const response = await apiFetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
      
      const data = await response.json();
      
      // Store auth token for cross-domain authentication
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      
      // Clear all caches on login (fresh session)
      apiCache.clear();
      
      return data;
    },

    logout: async () => {
      const csrftoken = getCookie('csrftoken');
      // Clear all caches on logout
      apiCache.clear();
      try {
        const response = await apiFetch(`${API_BASE_URL}/auth/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
          },
          credentials: 'include',
        });
        
        // Clear all auth-related data immediately
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        
        // Don't manually clear cookies - let the server handle it
        // The backend will expire the session cookie properly
        
        return response.ok ? await response.json() : { success: true };
      } catch (error) {
        // Even if logout fails on server, clear local data
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        throw error;
      }
    },

    getCurrentUser: async () => {
      const response = await apiFetch(`${API_BASE_URL}/auth/user/`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      
      return response.json();
    },

    getDashboardStats: async () => {
      // Return cached data instantly if available
      const cached = getCached('dashboard_stats');
      if (cached) return cached;
      
      const csrftoken = getCookie('csrftoken');
      
      const response = await deduplicatedFetch(`${API_BASE_URL}/dashboard/stats/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(csrftoken && { 'X-CSRFToken': csrftoken }),
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const e = new Error(errorData.error || `Failed to fetch dashboard data (status ${response.status})`);
        e.status = response.status;
        e.response = errorData;
        throw e;
      }

      const data = await response.json();
      setCache('dashboard_stats', data);
      return data;
    },

    requestPasswordReset: async (email) => {
      const response = await apiFetch(`${API_BASE_URL}/auth/password-reset/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.email?.[0] || 'Failed to send password reset email');
      }
      
      return data;
    },

    confirmPasswordReset: async (uid, token, new_password, confirm_password) => {
      const response = await apiFetch(`${API_BASE_URL}/auth/password-reset-confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ uid, token, new_password, confirm_password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.token?.[0] || data.new_password?.[0] || 'Failed to reset password');
      }
      
      return data;
    },
  },

  // Universities (cached - rarely changes)
  universities: {
    getAll: async () => {
      const cached = getCached('universities');
      if (cached) return cached;
      
      const response = await deduplicatedFetch(`${API_BASE_URL}/universities/`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch universities');
      }
      
      const data = await response.json();
      setCache('universities', data, 300_000); // Cache 5 min
      return data;
    },
  },

  // Courses (cached per university)
  courses: {
    getAll: async (universityId = null) => {
      const cacheKey = `courses_${universityId || 'all'}`;
      const cached = getCached(cacheKey);
      if (cached) return cached;
      
      const url = universityId 
        ? `${API_BASE_URL}/courses/?university=${universityId}`
        : `${API_BASE_URL}/courses/`;
      
      const response = await deduplicatedFetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const data = await response.json();
      setCache(cacheKey, data, 300_000); // Cache 5 min
      return data;
    },
  },

  // Accounts
  accounts: {
    getMy: async () => {
      const response = await apiFetch(`${API_BASE_URL}/accounts/`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      
      return response.json();
    },
  },

  // Deposits
  deposits: {
    getMy: async () => {
      const response = await apiFetch(`${API_BASE_URL}/deposits/`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch deposits');
      }
      
      return response.json();
    },
  },

  // Loans
  loans: {
    getMy: async () => {
      const response = await apiFetch(`${API_BASE_URL}/loans/`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch loans');
      }
      
      return response.json();
    },

    apply: async (loanData) => {
      const csrftoken = getCookie('csrftoken');
      const response = await apiFetch(`${API_BASE_URL}/loans/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        credentials: 'include',
        body: JSON.stringify(loanData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Loan application failed');
      }
      
      return response.json();
    },
  },

  // User Settings
  settings: {
    get: async () => {
      const response = await apiFetch(`${API_BASE_URL}/users/settings/`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      return response.json();
    },

    update: async (settingsData) => {
      const csrftoken = getCookie('csrftoken');
      const response = await apiFetch(`${API_BASE_URL}/users/settings/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        credentials: 'include',
        body: JSON.stringify(settingsData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update settings');
      }
      
      return response.json();
    },
  },

  // User Profile
  profile: {
    update: async (profileData) => {
      const csrftoken = getCookie('csrftoken');
      const response = await apiFetch(`${API_BASE_URL}/users/update-profile/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }
      
      return response.json();
    },

    updateWithImage: async (formData) => {
      const csrftoken = getCookie('csrftoken');
      const response = await apiFetch(`${API_BASE_URL}/users/update-profile/`, {
        method: 'PATCH',
        headers: {
          'X-CSRFToken': csrftoken,
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }
      
      return response.json();
    },

    changePassword: async (currentPassword, newPassword) => {
      const csrftoken = getCookie('csrftoken');
      const response = await apiFetch(`${API_BASE_URL}/users/change-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        credentials: 'include',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }
      
      return response.json();
    },
  },

  // Two-Factor Authentication
  twoFactorAuth: {
    enable: async () => {
      const csrftoken = getCookie('csrftoken');
      const response = await apiFetch(`${API_BASE_URL}/users/enable-2fa/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to enable 2FA');
      }
      
      return response.json();
    },

    verify: async (otp) => {
      const csrftoken = getCookie('csrftoken');
      const response = await apiFetch(`${API_BASE_URL}/users/verify-2fa/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        credentials: 'include',
        body: JSON.stringify({ otp }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify OTP');
      }
      
      return response.json();
    },

    disable: async (password) => {
      const csrftoken = getCookie('csrftoken');
      const response = await apiFetch(`${API_BASE_URL}/users/disable-2fa/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disable 2FA');
      }
      
      return response.json();
    },

    sendLoginOtp: async (userId) => {
      const response = await apiFetch(`${API_BASE_URL}/users/send-login-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send OTP');
      }
      
      return response.json();
    },
  },

  // Payment endpoints
  payments: {
    initiateDeposit: async (data) => {
      const csrftoken = getCookie('csrftoken');
      const response = await apiFetch(`${API_BASE_URL}/payment-requests/initiate-deposit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initiate deposit');
      }
      
      return response.json();
    },

    verifyDeposit: async (data) => {
      const csrftoken = getCookie('csrftoken');
      const response = await apiFetch(`${API_BASE_URL}/payment-requests/verify-deposit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify deposit');
      }
      
      return response.json();
    },
  },

  // ── Shop / E-commerce ───────────────────────────────────
  shop: {
    // Categories
    getCategories: async () => {
      const response = await apiFetch(`${API_BASE_URL}/shop/categories/`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },

    // Products
    getProducts: async (params = {}) => {
      const qs = new URLSearchParams();
      if (params.category) qs.set('category', params.category);
      if (params.search) qs.set('search', params.search);
      if (params.featured) qs.set('featured', '1');
      if (params.sort) qs.set('sort', params.sort);
      const url = `${API_BASE_URL}/shop/products/${qs.toString() ? '?' + qs.toString() : ''}`;
      const response = await apiFetch(url);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },

    getProduct: async (slug) => {
      const response = await apiFetch(`${API_BASE_URL}/shop/products/${slug}/`);
      if (!response.ok) throw new Error('Product not found');
      return response.json();
    },

    // Reviews
    addReview: async (slug, data) => {
      const csrftoken = getCookie('csrftoken');
      const response = await apiFetch(`${API_BASE_URL}/shop/products/${slug}/review/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) { const e = await response.json(); throw new Error(e.error || 'Failed to add review'); }
      return response.json();
    },

    // Cart
    getCart: async () => {
      const response = await apiFetch(`${API_BASE_URL}/shop/cart/`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch cart');
      return response.json();
    },

    addToCart: async (product_id, quantity = 1) => {
      const csrftoken = getCookie('csrftoken');
      const response = await apiFetch(`${API_BASE_URL}/shop/cart/items/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
        credentials: 'include',
        body: JSON.stringify({ product_id, quantity }),
      });
      if (!response.ok) { const e = await response.json(); throw new Error(e.error || 'Failed to add to cart'); }
      return response.json();
    },

    updateCartItem: async (item_id, quantity) => {
      const csrftoken = getCookie('csrftoken');
      const response = await apiFetch(`${API_BASE_URL}/shop/cart/items/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
        credentials: 'include',
        body: JSON.stringify({ item_id, quantity }),
      });
      if (!response.ok) { const e = await response.json(); throw new Error(e.error || 'Failed to update cart'); }
      return response.json();
    },

    removeCartItem: async (item_id) => {
      const csrftoken = getCookie('csrftoken');
      const response = await apiFetch(`${API_BASE_URL}/shop/cart/items/?item_id=${item_id}`, {
        method: 'DELETE',
        headers: { 'X-CSRFToken': csrftoken },
        credentials: 'include',
      });
      if (!response.ok) { const e = await response.json(); throw new Error(e.error || 'Failed to remove item'); }
      return response.json();
    },

    // Checkout
    checkout: async (data) => {
      const csrftoken = getCookie('csrftoken');
      const response = await apiFetch(`${API_BASE_URL}/shop/checkout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) { const e = await response.json(); throw new Error(e.error || 'Checkout failed'); }
      return response.json();
    },

    // Orders
    getOrders: async () => {
      const response = await apiFetch(`${API_BASE_URL}/shop/orders/`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },

    getOrder: async (id) => {
      const response = await apiFetch(`${API_BASE_URL}/shop/orders/${id}/`, { credentials: 'include' });
      if (!response.ok) throw new Error('Order not found');
      return response.json();
    },
  },
};

export default api;
