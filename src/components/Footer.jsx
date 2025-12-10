import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900/50 scroll-reveal">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1 animate-fadeInUp stagger-1">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <div className="hover-scale">
                <img src="/icon-180x180.png" alt="SomaSave SACCO Logo" className="w-10 h-10 object-contain" />
              </div>
              <h2 className="text-lg font-bold">SomaSave SACCO</h2>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Your trusted partner in financial growth.
            </p>
          </div>
          
          <div className="animate-fadeInUp stagger-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link 
                  to="/about" 
                  className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transform hover:translate-x-1 inline-block transition-transform"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  to="/services" 
                  className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transform hover:translate-x-1 inline-block transition-transform"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link 
                  to="/member-portal" 
                  className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transform hover:translate-x-1 inline-block transition-transform"
                >
                  Member Portal
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="animate-fadeInUp stagger-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase">
              Support
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link 
                  to="/contact" 
                  className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transform hover:translate-x-1 inline-block transition-transform"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transform hover:translate-x-1 inline-block transition-transform"
                >
                  FAQs
                </a>
              </li>
              <li>
                <Link 
                  to="/privacy-policy" 
                  className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transform hover:translate-x-1 inline-block transition-transform"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-8 text-center animate-fadeIn">
          <p className="text-base text-gray-400 dark:text-gray-500">
            © 2025 SomaSave SACCO. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
