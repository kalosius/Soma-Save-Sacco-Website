import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userProfileImage, setUserProfileImage] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if current page is an auth page
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname) || 
                      location.pathname.startsWith('/reset-password');

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = localStorage.getItem('isLoggedIn');
      const name = localStorage.getItem('userName');
      const userData = localStorage.getItem('userData');
      
      if (loggedIn === 'true') {
        setIsLoggedIn(true);
        setUserName(name || 'User');
        
        // Get profile image from userData
        if (userData) {
          try {
            const user = JSON.parse(userData);
            setUserProfileImage(user.profile_image);
          } catch (e) {
            console.error('Error parsing userData:', e);
          }
        }
      } else {
        setIsLoggedIn(false);
        setUserProfileImage(null);
      }
    };
    checkAuth();
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userData');
      setIsLoggedIn(false);
      closeMobileMenu();
      navigate('/login');
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm animate-fadeInDown shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-4 text-gray-900 dark:text-white animate-slideInLeft">
              <div className="hover-scale">
                <img src="/icon-180x180.png" alt="SomaSave SACCO Logo" className="w-10 h-10 object-contain" />
              </div>
              <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">SomaSave</h2>
            </Link>
            
            <div className="hidden md:flex flex-1 justify-center gap-9">
              {!isLoggedIn && (
                <>
                  <Link 
                    to="/" 
                    className="text-sm font-medium leading-normal hover:text-primary dark:text-gray-300 dark:hover:text-primary transform hover:scale-110 transition-all"
                  >
                    Home
                  </Link>
                  <Link 
                    to="/about" 
                    className="text-sm font-medium leading-normal hover:text-primary dark:text-gray-300 dark:hover:text-primary transform hover:scale-110 transition-all"
                  >
                    About Us
                  </Link>
                  <Link 
                    to="/services" 
                    className="text-sm font-medium leading-normal hover:text-primary dark:text-gray-300 dark:hover:text-primary transform hover:scale-110 transition-all"
                  >
                    Services
                  </Link>
                  <Link 
                    to="/shop" 
                    className="text-sm font-medium leading-normal hover:text-primary dark:text-gray-300 dark:hover:text-primary transform hover:scale-110 transition-all"
                  >
                    Shop
                  </Link>
                  <Link 
                    to="/contact" 
                    className="text-sm font-medium leading-normal hover:text-primary dark:text-gray-300 dark:hover:text-primary transform hover:scale-110 transition-all"
                  >
                    Contact
                  </Link>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2 animate-slideInRight">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 hover-scale"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <span className="material-symbols-outlined text-xl">dark_mode</span>
                ) : (
                  <span className="material-symbols-outlined text-xl">light_mode</span>
                )}
              </button>
              
              {isLoggedIn ? (
                <>
                  <Link to="/member-portal" className="hidden sm:block">
                    <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-primary text-gray-900 text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 hover-glow transition-all">
                      <span className="truncate">Dashboard</span>
                    </button>
                  </Link>
                  
                  {/* Profile Picture (Mobile - between theme toggle and menu) */}
                  <div 
                    className="md:hidden w-10 h-10 rounded-full bg-cover bg-center border-2 border-primary hover-scale cursor-pointer"
                    style={{
                      backgroundImage: userProfileImage 
                        ? `url('${userProfileImage}')` 
                        : `url('https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=00FF00&color=000&size=128')`
                    }}
                    onClick={() => navigate('/member-portal')}
                  />
                </>
              ) : (
                <>
                  <Link to="/login" className="hidden md:block">
                    <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
                      <span className="truncate">Login</span>
                    </button>
                  </Link>
                  <Link to="/register" className="hidden md:block">
                    <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-primary text-gray-900 text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 hover-glow transition-all">
                      <span className="truncate">Register</span>
                    </button>
                  </Link>
                </>
              )}

              {/* Mobile Menu Button - Hidden on Auth Pages */}
              {!isAuthPage && (
                <button
                  onClick={toggleMobileMenu}
                  className="md:hidden flex items-center justify-center w-10 h-10 text-gray-900 dark:text-white"
                  aria-label="Toggle menu"
                >
                  <span className="material-symbols-outlined text-3xl">
                    {isMobileMenuOpen ? 'close' : 'menu'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={closeMobileMenu}
        ></div>
      )}

      {/* Mobile Side Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <img src="/icon-180x180.png" alt="SomaSave SACCO Logo" className="w-8 h-8 object-contain" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Menu</h2>
            </div>
            <button
              onClick={closeMobileMenu}
              className="flex items-center justify-center w-10 h-10 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          {/* Mobile Menu Navigation */}
          <nav className="flex-1 overflow-y-auto py-6">
            <div className="flex flex-col gap-2 px-4">
              {isLoggedIn ? (
                /* Member Portal Navigation */
                <>
                  {/* User Profile Section */}
                  <div className="flex items-center gap-3 px-4 py-4 mb-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div 
                      className="w-12 h-12 rounded-full bg-cover bg-center border-2 border-primary"
                      style={{
                        backgroundImage: userProfileImage 
                          ? `url('${userProfileImage}')` 
                          : `url('https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=00FF00&color=000&size=128')`
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-white">{userName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Member Account</p>
                    </div>
                  </div>

                  {/* Portal Navigation Items */}
                  <Link
                    to="/member-portal"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                      isActivePath('/member-portal')
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="material-symbols-outlined">dashboard</span>
                    <span>Overview</span>
                  </Link>
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      navigate('/member-portal', { state: { tab: 'savings' } });
                    }}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <span className="material-symbols-outlined">savings</span>
                    <span>My Savings</span>
                  </button>
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      navigate('/member-portal', { state: { tab: 'loans' } });
                    }}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <span className="material-symbols-outlined">payments</span>
                    <span>My Loans</span>
                  </button>
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      navigate('/member-portal', { state: { tab: 'transactions' } });
                    }}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <span className="material-symbols-outlined">receipt_long</span>
                    <span>Transactions</span>
                  </button>
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      navigate('/member-portal', { state: { tab: 'profile' } });
                    }}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <span className="material-symbols-outlined">person</span>
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      navigate('/member-portal', { state: { tab: 'settings' } });
                    }}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <span className="material-symbols-outlined">settings</span>
                    <span>Settings</span>
                  </button>
                  
                  {/* Divider */}
                  <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
                  
                  <Link
                    to="/loan-application"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <span className="material-symbols-outlined">request_quote</span>
                    <span>Loan Application</span>
                  </Link>
                </>
              ) : (
                /* Public Navigation */
                <>
                  <Link
                    to="/"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                      isActivePath('/')
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="material-symbols-outlined">home</span>
                    <span>Home</span>
                  </Link>
                  <Link
                    to="/about"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                      isActivePath('/about')
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="material-symbols-outlined">info</span>
                    <span>About Us</span>
                  </Link>
                  <Link
                    to="/services"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                      isActivePath('/services')
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="material-symbols-outlined">account_balance</span>
                    <span>Services</span>
                  </Link>
                  <Link
                    to="/shop"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                      isActivePath('/shop')
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="material-symbols-outlined">storefront</span>
                    <span>Shop</span>
                  </Link>
                  <Link
                    to="/contact"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                      isActivePath('/contact')
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="material-symbols-outlined">mail</span>
                    <span>Contact</span>
                  </Link>
                  <Link
                    to="/loan-application"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                      isActivePath('/loan-application')
                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                        : 'text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="material-symbols-outlined">request_quote</span>
                    <span>Loan Application</span>
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Mobile Menu Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
            {isLoggedIn ? (
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-full h-12 px-6 bg-red-600 text-white text-base font-bold hover:bg-red-700 transition-colors"
              >
                <span className="material-symbols-outlined">logout</span>
                <span>Logout</span>
              </button>
            ) : (
              <>
                <Link to="/login" onClick={closeMobileMenu}>
                  <button className="w-full flex items-center justify-center gap-2 rounded-full h-12 px-6 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-base font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <span className="material-symbols-outlined">login</span>
                    <span>Login</span>
                  </button>
                </Link>
                <Link to="/register" onClick={closeMobileMenu}>
                  <button className="w-full flex items-center justify-center gap-2 rounded-full h-12 px-6 bg-primary text-gray-900 text-base font-bold hover:opacity-90 transition-all">
                    <span className="material-symbols-outlined">person_add</span>
                    <span>Register</span>
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
