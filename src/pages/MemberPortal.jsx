import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import api from '../services/api';
import MySavings from '../components/MySavings';
import MyLoans from '../components/MyLoans';
import Transactions from '../components/Transactions';
import Profile from '../components/Profile';
import Settings from '../components/Settings';
import DepositModal from '../components/DepositModal';
import AutoPushPrompt from '../components/AutoPushPrompt';
import Shop from '../components/Shop';

export default function MemberPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { formatCurrency, t } = useSettings();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  // PWA install prompt removed on login - do not auto-show install UI here

  // Handle navigation from mobile menu
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
      // Clear the state to avoid re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Check if user is logged in
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      if (!isLoggedIn) {
        navigate('/login', { replace: true });
        return;
      }
      
      try {
        setLoading(true);
        const data = await api.auth.getDashboardStats();
        setDashboardData(data);
        
        // Save user data to localStorage for navbar profile picture
        if (data.user) {
          localStorage.setItem('userData', JSON.stringify(data.user));
        }
        
        setError('');
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        const statusMsg = err.status ? ` (status ${err.status})` : '';
        const detail = err.response ? ' — ' + (err.response.detail || JSON.stringify(err.response)) : '';
        setError((err.message || 'Failed to load dashboard data') + statusMsg + detail);
        // If unauthorized, redirect to login
        if (err.status === 401 || err.message.includes('authenticated') || err.message.includes('401')) {
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('userName');
          navigate('/login', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);
  
  // Check authentication when component becomes visible (e.g., back button)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
          navigate('/login', { replace: true });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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
    { id: 'overview', label: t('overview'), icon: 'dashboard' },
    { id: 'savings', label: t('savings'), icon: 'savings' },
    { id: 'loans', label: t('loans'), icon: 'payments' },
    { id: 'transactions', label: t('transactions'), icon: 'receipt_long' },
    { id: 'shop', label: 'Shop', icon: 'storefront' },
    { id: 'profile', label: t('profile'), icon: 'person' },
    { id: 'settings', label: t('settings'), icon: 'settings' }
  ];

  const handleDepositClick = () => {
    setShowDepositModal(true);
  };

  const handleDepositSuccess = (response) => {
    // Refresh dashboard data after successful deposit
    window.location.reload();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      await api.auth.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Ensure local storage is cleared
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userData');
      
      // Small delay for visual feedback, then redirect
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 800);
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
    <>
      {/* Auto Push Notification Prompt - Shows once on first visit */}
      <AutoPushPrompt />
      
      {/* PWA install prompt intentionally not rendered on login/member portal */}
      
      {/* Logout Loading Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4 animate-fadeInUp">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin">logout</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Logging Out...</h3>
            <p className="text-gray-600 dark:text-gray-400">Please wait</p>
          </div>
        </div>
      )}
      
      <main className="flex-1 bg-background-light dark:bg-background-dark">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
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
                <span className="font-semibold">{t('logout')}</span>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {activeTab === 'overview' && (
              <>
                {/* MOBILE VERSION - Compact Design */}
                <div className="space-y-3 lg:hidden">
                  {/* Welcome Header - Compact */}
                  <div className="rounded-xl bg-gradient-to-r from-primary to-green-400 p-4 sm:p-6 shadow-lg animate-fadeInUp">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                      Yo! {displayName}
                    </h1>
                    <p className="text-gray-800 text-xs sm:text-sm">
                      Here's your account overview
                    </p>
                  </div>

                  {/* Balances Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Balances
                        <span className="material-symbols-outlined text-lg cursor-pointer hover:rotate-180 transition-transform">sync</span>
                      </h2>
                      <button className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        View all
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {/* Total Savings Card */}
                    <div className="rounded-xl border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5 p-3 sm:p-4 hover-lift cursor-pointer">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-base sm:text-lg text-gray-900">account_balance_wallet</span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-gray-900 dark:text-white">SAVINGS</span>
                      </div>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1 truncate">
                        {formatCurrency(stats.total_savings)}
                      </p>
                      <p className="text-[10px] sm:text-xs font-semibold text-primary">
                        GROWTH: {stats.savings_growth}
                      </p>
                    </div>

                    {/* Active Loans Card */}
                    <div className="rounded-xl border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5 p-3 sm:p-4 hover-lift cursor-pointer">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-base sm:text-lg text-gray-900">trending_up</span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-gray-900 dark:text-white">LOANS</span>
                      </div>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
                        {stats.active_loans_count}
                      </p>
                      <p className="text-[10px] sm:text-xs font-semibold text-primary">
                        STATUS: {stats.active_loans_count > 0 ? 'ACTIVE' : 'NONE'}
                      </p>
                    </div>

                    {/* Dividends Card */}
                    <div className="rounded-xl border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5 p-3 sm:p-4 hover-lift cursor-pointer">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-base sm:text-lg text-gray-900">star</span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-gray-900 dark:text-white">DIVIDENDS</span>
                      </div>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1 truncate">
                        {formatCurrency(stats.dividends)}
                      </p>
                      <p className="text-[10px] sm:text-xs font-semibold text-primary">
                        YEAR: {new Date().getFullYear()}
                      </p>
                    </div>

                    {/* Member Status Card */}
                    <div className="rounded-xl border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5 p-3 sm:p-4 hover-lift cursor-pointer">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-base sm:text-lg text-gray-900">verified</span>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-gray-900 dark:text-white">MEMBER</span>
                      </div>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
                        #{user.student_id || 'N/A'}
                      </p>
                      <p className="text-[10px] sm:text-xs font-semibold text-primary">
                        STATUS: ACTIVE
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-center">
                    Showing balances as of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                {/* Quick Access Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Quick Access</h2>
                    <button className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      View all
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <Link to="/loan-application">
                      <button className="w-full bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-xl p-3 sm:p-4 transition-all hover-lift">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-white text-lg sm:text-xl">request_quote</span>
                          </div>
                          <span className="font-bold text-white text-left text-xs sm:text-sm">Loan Application</span>
                        </div>
                      </button>
                    </Link>
                    
                    <button 
                      onClick={handleDepositClick}
                      className="w-full bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-xl p-3 sm:p-4 transition-all hover-lift"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-white text-lg sm:text-xl">savings</span>
                        </div>
                        <span className="font-bold text-white text-left text-xs sm:text-sm">Make Deposit</span>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab('transactions')}
                      className="w-full bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-xl p-3 sm:p-4 transition-all hover-lift"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-white text-lg sm:text-xl">receipt_long</span>
                        </div>
                        <span className="font-bold text-white text-left text-xs sm:text-sm">Transactions</span>
                      </div>
                    </button>
                    
                    <Link to="/contact">
                      <button className="w-full bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-xl p-3 sm:p-4 transition-all hover-lift">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-white text-lg sm:text-xl">support_agent</span>
                          </div>
                          <span className="font-bold text-white text-left text-xs sm:text-sm">Support</span>
                        </div>
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Recent Activity */}
                {recent_transactions && recent_transactions.length > 0 && (
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">Recent Activity</h2>
                    <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                      {recent_transactions.slice(0, 5).map((transaction, index) => (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${
                            index !== recent_transactions.slice(0, 5).length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 ${
                              transaction.amount.startsWith('+') || !transaction.amount.startsWith('-') 
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30' 
                                : 'bg-red-100 text-red-600 dark:bg-red-900/30'
                            }`}>
                              <span className="material-symbols-outlined text-base sm:text-lg">{transaction.icon}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm truncate">{transaction.type}</p>
                              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">{transaction.date}</p>
                            </div>
                          </div>
                          <p className={`text-xs sm:text-base font-bold flex-shrink-0 ml-2 ${
                            transaction.amount.startsWith('+') || !transaction.amount.startsWith('-')
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {transaction.amount.startsWith('-') 
                              ? '-' + formatCurrency(transaction.amount.substring(1))
                              : '+' + formatCurrency(transaction.amount.startsWith('+') ? transaction.amount.substring(1) : transaction.amount)
                            }
                          </p>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setActiveTab('transactions')}
                      className="w-full mt-3 py-3 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                      View All Transactions
                    </button>
                  </div>
                )}
                </div>

                {/* DESKTOP VERSION - Original Large Cards */}
                <div className="hidden lg:block space-y-6">
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
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('totalSavings')}</h3>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(stats.total_savings)}
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
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('activeLoans')}</h3>
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
                        {t('dividends')} ({new Date().getFullYear()})
                      </h3>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(stats.dividends)}
                      </p>
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 animate-fadeInUp">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('recentTransactions')}</h2>
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
                              {transaction.amount.startsWith('-') 
                                ? '-' + formatCurrency(transaction.amount.substring(1))
                                : '+' + formatCurrency(transaction.amount.startsWith('+') ? transaction.amount.substring(1) : transaction.amount)
                              }
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
                      <button 
                        onClick={handleDepositClick}
                        className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-primary/5 transition-all"
                      >
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
              </>
            )}

            {activeTab !== 'overview' && (
              <>
                {activeTab === 'savings' && (
                  <MySavings user={user} accounts={accounts} />
                )}
                
                {activeTab === 'loans' && (
                  <MyLoans user={user} />
                )}
                
                {activeTab === 'transactions' && (
                  <Transactions user={user} recent_transactions={recent_transactions} />
                )}
                
                {activeTab === 'profile' && (
                  <Profile 
                    user={user} 
                    onUpdate={(updatedUser) => {
                      setDashboardData(prev => ({
                        ...prev,
                        user: updatedUser
                      }));
                    }} 
                  />
                )}
                
                {activeTab === 'settings' && (
                  <Settings user={user} />
                )}
                
                {activeTab === 'shop' && (
                  <Shop user={user} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
      </main>
      
      {/* Mobile Bottom Navigation - Only visible on small screens */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 border-t border-gray-200 dark:border-gray-800 z-50 safe-bottom backdrop-blur-md">
        <div className="grid grid-cols-3 h-16 max-w-md mx-auto">
          {navItems
            .filter(item => ['overview', 'shop', 'profile'].includes(item.id))
            .map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 transition-all ${
                  activeTab === item.id
                    ? 'text-primary'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                aria-label={item.label}
                type="button"
              >
                <span className={`material-symbols-outlined text-[22px] transition-transform ${
                  activeTab === item.id ? 'scale-110' : ''
                }`}>{item.icon}</span>
                <span className={`text-[11px] font-semibold ${
                  activeTab === item.id ? 'text-primary' : ''
                }`}>{item.label}</span>
              </button>
            ))}
        </div>
      </nav>
      
      {/* Copyright Footer - hidden on mobile where bottom nav shows */}
      <footer className="hidden lg:block bg-white dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-base text-gray-400 dark:text-gray-500">
            © 2025 SomaSave SACCO. All rights reserved.
          </p>
        </div>
      </footer>
      
      {/* Deposit Modal */}
      <DepositModal 
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        user={dashboardData?.user}
        onSuccess={handleDepositSuccess}
      />
    </>
  );
}
