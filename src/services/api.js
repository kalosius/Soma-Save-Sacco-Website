// API Base URL - production Railway backend
const API_BASE_URL = 'https://soma-save-sacco-website-production.up.railway.app/api';

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
      const response = await fetch(`${API_BASE_URL}/auth/register/`, {
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
        error.response = { data }; // Attach the full error data
        throw error;
      }
      
      return data;
    },

    login: async (identifier, password, otp = null) => {
      const body = { identifier, password };
      if (otp) {
        body.otp = otp;
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
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
      
      // Log cookies after login
      console.log('=== After Login ===');
      console.log('All cookies:', document.cookie);
      console.log('Session ID:', getCookie('sessionid'));
      console.log('CSRF Token:', getCookie('csrftoken'));
      
      // Test if session works immediately
      try {
        const testResponse = await fetch(`${API_BASE_URL}/auth/user/`, {
          credentials: 'include',
        });
        console.log('Immediate auth test:', testResponse.ok ? 'SUCCESS' : 'FAILED');
        if (!testResponse.ok) {
          console.error('Auth test failed with status:', testResponse.status);
        }
      } catch (err) {
        console.error('Auth test error:', err);
      }
      
      console.log('==================');
      
      return data;
    },

    logout: async () => {
      const csrftoken = getCookie('csrftoken');
      try {
        const response = await fetch(`${API_BASE_URL}/auth/logout/`, {
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
        
        // Don't manually clear cookies - let the server handle it
        // The backend will expire the session cookie properly
        
        return response.ok ? await response.json() : { success: true };
      } catch (error) {
        // Even if logout fails on server, clear local data
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userData');
        throw error;
      }
    },

    getCurrentUser: async () => {
      const response = await fetch(`${API_BASE_URL}/auth/user/`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      
      return response.json();
    },

    getDashboardStats: async () => {
      const csrftoken = getCookie('csrftoken');
      const sessionid = getCookie('sessionid');
      
      console.log('=== Frontend Debug ===');
      console.log('CSRF Token:', csrftoken);
      console.log('Session ID:', sessionid);
      console.log('All cookies:', document.cookie);
      console.log('====================');
      
      const response = await fetch(`${API_BASE_URL}/dashboard/stats/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(csrftoken && { 'X-CSRFToken': csrftoken }),
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Dashboard stats error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch dashboard data');
      }
      
      return response.json();
    },

    requestPasswordReset: async (email) => {
      const response = await fetch(`${API_BASE_URL}/auth/password-reset/`, {
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
      const response = await fetch(`${API_BASE_URL}/auth/password-reset-confirm/`, {
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

  // Universities
  universities: {
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/universities/`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch universities');
      }
      
      return response.json();
    },
  },

  // Courses
  courses: {
    getAll: async (universityId = null) => {
      const url = universityId 
        ? `${API_BASE_URL}/courses/?university=${universityId}`
        : `${API_BASE_URL}/courses/`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      return response.json();
    },
  },

  // Accounts
  accounts: {
    getMy: async () => {
      const response = await fetch(`${API_BASE_URL}/accounts/`, {
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
      const response = await fetch(`${API_BASE_URL}/deposits/`, {
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
      const response = await fetch(`${API_BASE_URL}/loans/`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch loans');
      }
      
      return response.json();
    },

    apply: async (loanData) => {
      const csrftoken = getCookie('csrftoken');
      const response = await fetch(`${API_BASE_URL}/loans/`, {
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
      const response = await fetch(`${API_BASE_URL}/users/settings/`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      return response.json();
    },

    update: async (settingsData) => {
      const csrftoken = getCookie('csrftoken');
      const response = await fetch(`${API_BASE_URL}/users/settings/`, {
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
      const response = await fetch(`${API_BASE_URL}/users/update-profile/`, {
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
      const response = await fetch(`${API_BASE_URL}/users/update-profile/`, {
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
      const response = await fetch(`${API_BASE_URL}/users/change-password/`, {
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
      const response = await fetch(`${API_BASE_URL}/users/enable-2fa/`, {
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
      const response = await fetch(`${API_BASE_URL}/users/verify-2fa/`, {
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
      const response = await fetch(`${API_BASE_URL}/users/disable-2fa/`, {
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
      const response = await fetch(`${API_BASE_URL}/users/send-login-otp/`, {
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
};

export default api;
