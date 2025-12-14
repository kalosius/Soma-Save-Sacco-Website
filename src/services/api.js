// API Base URL - use relative path to leverage Vite proxy
const API_BASE_URL = '/api';

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

    login: async (identifier, password) => {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ identifier, password }),
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
      const response = await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        credentials: 'include',
      });
      
      return response.json();
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
};

export default api;
