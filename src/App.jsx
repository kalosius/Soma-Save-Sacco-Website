import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import LoanApplication from './pages/LoanApplication';
import MemberPortal from './pages/MemberPortal';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  const location = useLocation();
  const isMemberPortal = location.pathname === '/member-portal';

  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
        <Navbar />
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
        {!isMemberPortal && <Footer />}
        {!isMemberPortal && <WhatsAppButton />}
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
