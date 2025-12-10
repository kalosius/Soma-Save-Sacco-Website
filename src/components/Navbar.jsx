import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm animate-fadeInDown shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-4 text-gray-900 dark:text-white animate-slideInLeft">
            <div className="hover-scale">
              <img src="/icon-180x180.png" alt="SomaSave SACCO Logo" className="w-10 h-10 object-contain" />
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">SomaSave SACCO</h2>
          </Link>
          
          <div className="hidden md:flex flex-1 justify-center gap-9">
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
              to="/contact" 
              className="text-sm font-medium leading-normal hover:text-primary dark:text-gray-300 dark:hover:text-primary transform hover:scale-110 transition-all"
            >
              Contact
            </Link>
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
            
            <button className="hidden sm:flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-background-light dark:bg-background-dark border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-100 dark:hover:bg-gray-800 hover-scale transition-colors">
              <span className="truncate">Login</span>
            </button>
            <Link to="/member-portal">
              <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-primary text-gray-900 text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 hover-glow transition-all">
                <span className="truncate">Member Portal</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
