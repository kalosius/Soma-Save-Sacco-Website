import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function MemberPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [userName, setUserName] = useState('');

  // Check authentication on mount
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      // Redirect to register page if not logged in
      navigate('/register');
      return;
    }
    const name = localStorage.getItem('userName') || 'Student';
    setUserName(name);
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

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    navigate('/login');
  };

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
                    backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC7OvQ-HnJ-MWncEQ5HO6C45M1YsnI71INxJAEez6dOSgFogfQy41F4vQLanuy04EYWjAxWvNVqS_-_utl6nCRCP2XGIXL9WUtiyZJSlirjN0HxjE1M97kj21cau-hNpQBCAFKdFLrpASbDBjDJd5MW-OTt3Kgft-HceTd2mcuunTSb59dTrAAQCuOBQe6MjYvE4jravHHAaJbnZV0C0tkUlyy_FBzcMXyeZz7pqHJJ5A6aFFwKskE1g-eYqxd8RyP3I7DXB6uQ3tji')"
                  }}
                />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">John Doe</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Member #SS123456</p>
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
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back, {userName}!</h1>
                  <p className="text-gray-600 dark:text-gray-400">Here's an overview of your student account activity.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 hover-lift animate-scaleIn stagger-1 cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 text-primary hover-scale">
                        <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">+12.5%</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Total Savings</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">UGX 12,450,000</p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 hover-lift animate-scaleIn stagger-2 cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 text-primary hover-scale">
                        <span className="material-symbols-outlined text-2xl">trending_up</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">Active</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Active Loans</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">1</p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 hover-lift animate-scaleIn stagger-3 cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 text-primary hover-scale">
                        <span className="material-symbols-outlined text-2xl">star</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">Earned</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Dividends (2024)</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">UGX 245,000</p>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 animate-fadeInUp">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Transactions</h2>
                  <div className="space-y-4">
                    {[
                      { type: 'Savings Deposit', amount: '+500,000', date: 'Dec 15, 2024', icon: 'add_circle' },
                      { type: 'Loan Repayment', amount: '-350,000', date: 'Dec 10, 2024', icon: 'remove_circle' },
                      { type: 'Dividend Payment', amount: '+45,000', date: 'Dec 5, 2024', icon: 'star' },
                      { type: 'Savings Deposit', amount: '+250,000', date: 'Nov 30, 2024', icon: 'add_circle' }
                    ].map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                            transaction.amount.startsWith('+') ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            <span className="material-symbols-outlined text-xl">{transaction.icon}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{transaction.type}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.date}</p>
                          </div>
                        </div>
                        <p className={`text-lg font-bold ${
                          transaction.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          UGX {transaction.amount}
                        </p>
                      </div>
                    ))}
                  </div>
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
