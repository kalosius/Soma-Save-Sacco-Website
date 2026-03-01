import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { useEffect, lazy, Suspense, startTransition } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';

// Lazy load ALL pages for fastest initial bundle
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const Contact = lazy(() => import('./pages/Contact'));
const LoanApplication = lazy(() => import('./pages/LoanApplication'));
const MemberPortal = lazy(() => import('./pages/MemberPortal'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Prefetch critical routes after initial paint
const prefetchRoutes = () => {
  // Prefetch login/register immediately (most likely next navigation)
  import('./pages/Login');
  import('./pages/Register');
  // Prefetch member portal slightly later
  setTimeout(() => {
    import('./pages/MemberPortal');
  }, 1000);
};

// Minimal loading skeleton - renders instantly with no layout shift
const PageSkeleton = () => (
  <div className="flex-1 flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Prefetch critical routes once on first mount
  useEffect(() => {
    // Use requestIdleCallback for non-blocking prefetch
    if ('requestIdleCallback' in window) {
      requestIdleCallback(prefetchRoutes);
    } else {
      setTimeout(prefetchRoutes, 200);
    }
  }, []);

  return null;
}

function App() {
  const location = useLocation();
  const isMemberPortal = location.pathname === '/member-portal';
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname) || 
                      location.pathname.startsWith('/reset-password');

  return (
    <ThemeProvider>
      <div className={`flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 ${isMemberPortal ? 'lg:h-screen lg:overflow-hidden' : ''}`}>
        <Navbar />
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/loan-application" element={<LoanApplication />} />
            <Route path="/member-portal" element={<MemberPortal />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
          </Routes>
        </Suspense>
        {!isMemberPortal && !isAuthPage && <Footer />}
        {!isMemberPortal && !isAuthPage && <WhatsAppButton />}
      </div>
    </ThemeProvider>
  );
}

function AppWrapper() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <SettingsProvider>
          <Router>
            <ScrollToTop />
            <App />
          </Router>
        </SettingsProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default AppWrapper;
