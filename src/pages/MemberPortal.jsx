import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function MemberPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await api.auth.getDashboardStats();
        setDashboardData(data);
        setError('');
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try logging in again.');
        // If unauthorized, redirect to login
        if (err.message.includes('authenticated')) {
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('userName');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  useEffect(() => {
    const scrollRevealElements = document.querySelectorAll('.scroll-reveal');
    
    const scrollReveal = () => {
      scrollRevealElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementTop < windowHeight * 0.85) {
          element.classList.add('revealed');
        }
      });
    };
    
    window.addEventListener('scroll', scrollReveal);
    window.addEventListener('load', scrollReveal);
    scrollReveal();
    
    return () => {
      window.removeEventListener('scroll', scrollReveal);
      window.removeEventListener('load', scrollReveal);
    };
  }, []);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'savings', label: 'My Savings', icon: 'savings' },
    { id: 'loans', label: 'My Loans', icon: 'payments' },
    { id: 'transactions', label: 'Transactions', icon: 'receipt_long' },
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'settings', label: 'Settings', icon: 'settings' }
  ];

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userName');
      navigate('/login');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <main className="flex-1 bg-background-light dark:bg-background-dark flex items-center justify-center min-h-screen">
        <div className="text-center">
          <span className="material-symbols-outlined animate-spin text-6xl text-primary mb-4">progress_activity</span>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  // Show error state
  if (error || !dashboardData) {
    return (
      <main className="flex-1 bg-background-light dark:bg-background-dark flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-8">
          <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 rounded-full bg-primary text-gray-900 font-bold hover:opacity-90 transition-all"
          >
            Return to Login
          </button>
        </div>
      </main>
    );
  }

  const { user, stats, recent_transactions, accounts } = dashboardData;
  const displayName = user.first_name || user.username;

  return (
    <main className="flex-1 bg-background-light dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 sticky top-8">
              <div className="text-center mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                <div 
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-cover bg-center hover-scale cursor-pointer"
                  style={{
                    backgroundImage: user.profile_image 
                      ? `url('${user.profile_image}')` 
                      : "url('https://ui-avatars.com/api/?name=" + encodeURIComponent(user.first_name + ' ' + user.last_name) + "&background=00FF00&color=000&size=128')"
                  }}
                />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {user.first_name} {user.last_name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Member #{user.student_id || 'N/A'}
                </p>
              </div>
              
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === item.id
                        ? 'bg-primary text-gray-900'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span className="font-semibold">{item.label}</span>
                  </button>
                ))}
              </nav>
              
              <button
                onClick={handleLogout}
                className="mt-4 w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <span className="material-symbols-outlined">logout</span>
                <span className="font-semibold">Logout</span>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Welcome Header */}
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 animate-fadeInUp">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Welcome Back, {displayName}!
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Here's an overview of your student account activity.
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 hover-lift animate-scaleIn stagger-1 cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 text-primary hover-scale">
                        <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">{stats.savings_growth}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Total Savings</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      UGX {parseFloat(stats.total_savings).toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 hover-lift animate-scaleIn stagger-2 cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 text-primary hover-scale">
                        <span className="material-symbols-outlined text-2xl">trending_up</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {stats.active_loans_count > 0 ? 'Active' : 'None'}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Active Loans</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.active_loans_count}</p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 hover-lift animate-scaleIn stagger-3 cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 text-primary hover-scale">
                        <span className="material-symbols-outlined text-2xl">star</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">Earned</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Dividends ({new Date().getFullYear()})
                    </h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      UGX {parseFloat(stats.dividends).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 animate-fadeInUp">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Transactions</h2>
                  {recent_transactions && recent_transactions.length > 0 ? (
                    <div className="space-y-4">
                      {recent_transactions.map((transaction, index) => (
                        <div key={index} className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                              transaction.amount.startsWith('+') || !transaction.amount.startsWith('-') 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-red-100 text-red-600'
                            }`}>
                              <span className="material-symbols-outlined text-xl">{transaction.icon}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{transaction.type}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.date}</p>
                            </div>
                          </div>
                          <p className={`text-lg font-bold ${
                            transaction.amount.startsWith('+') || !transaction.amount.startsWith('-')
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            UGX {transaction.amount.startsWith('-') ? transaction.amount.substring(1) : '+' + transaction.amount}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-600 mb-2">receipt_long</span>
                      <p className="text-gray-600 dark:text-gray-400">No transactions yet</p>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 animate-fadeInUp">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link to="/loan-application">
                      <button className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-primary/5 transition-all">
                        <span className="material-symbols-outlined text-primary text-2xl">payments</span>
                        <span className="font-semibold text-gray-900 dark:text-white">Apply for Loan</span>
                      </button>
                    </Link>
                    <button className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-primary/5 transition-all">
                      <span className="material-symbols-outlined text-primary text-2xl">savings</span>
                      <span className="font-semibold text-gray-900 dark:text-white">Make Deposit</span>
                    </button>
                    <Link to="/contact">
                      <button className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-primary/5 transition-all">
                        <span className="material-symbols-outlined text-primary text-2xl">support_agent</span>
                        <span className="font-semibold text-gray-900 dark:text-white">Contact Support</span>
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'overview' && (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-12 text-center animate-fadeIn">
                <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-600 mb-4">construction</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{navItems.find(item => item.id === activeTab)?.label}</h2>
                <p className="text-gray-600 dark:text-gray-400">This section is under development.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
