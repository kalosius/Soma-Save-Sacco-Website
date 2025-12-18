import { useState, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Toast from '../components/Toast';

const Login = memo(function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const loginData = {
        identifier: formData.identifier,
        password: formData.password,
        ...(requires2FA && otpInput && { otp: otpInput })
      };
      
      const response = await api.auth.login(loginData.identifier, loginData.password, loginData.otp);
      
      // Check if 2FA is required
      if (response.requires_2fa) {
        setRequires2FA(true);
        setUserId(response.user_id);
        setUserEmail(response.email);
        setToast({
          message: response.message || 'OTP sent to your email',
          type: 'success'
        });
        setLoading(false);
        return;
      }
      
      // Store user data in localStorage
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', response.user.first_name + ' ' + response.user.last_name);
      localStorage.setItem('userEmail', response.user.email);
      localStorage.setItem('userData', JSON.stringify(response.user));
      
      // Show success toast
      setToast({
        message: `Welcome back, ${response.user.first_name}! Redirecting to dashboard...`,
        type: 'success'
      });
      
      // Navigate after a short delay
      setTimeout(() => {
        navigate('/member-portal');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      setToast({
        message: err.message || 'Login failed. Please try again.',
        type: 'error'
      });
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.twoFactorAuth.sendLoginOtp(userId);
      
      setToast({
        message: response.message || 'OTP resent to your email',
        type: 'success'
      });
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
      setToast({
        message: err.message || 'Failed to resend OTP',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 bg-background-light dark:bg-background-dark flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeInUp">
          <div className="flex justify-center mb-4">
            <img src="/icon-180x180.png" alt="SomaSave SACCO Logo" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3">
            Welcome Back
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Login to access your SomaSave account
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Don't have an account? <Link to="/register" className="text-primary font-semibold hover:underline">Register here</Link>
          </p>
        </div>

        {/* Login Form */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 shadow-lg animate-fadeInUp">
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {!requires2FA ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Email Address or Student ID
                  </label>
                  <input
                    type="text"
                    name="identifier"
                    required
                    value={formData.identifier}
                    onChange={handleChange}
                    placeholder="samuel@university.ac.ug or 2021/BCS/001/PS"
                    className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-sm text-primary font-semibold hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-blue-600">shield</span>
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-300">Two-Factor Authentication</p>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                        A verification code has been sent to {userEmail}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-gray-900 dark:text-white text-center text-2xl tracking-widest"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                    Code expires in 10 minutes
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="w-full text-sm text-primary font-semibold hover:underline disabled:opacity-50"
                >
                  Didn't receive the code? Resend
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequires2FA(false);
                    setOtpInput('');
                    setUserId(null);
                    setUserEmail('');
                  }}
                  className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                >
                  ← Back to login
                </button>
              </>
            )}

            <button
              type="submit"
              disabled={loading || (requires2FA && otpInput.length !== 6)}
              className="w-full flex items-center justify-center gap-2 h-14 rounded-full bg-primary text-gray-900 text-base font-bold hover:opacity-90 hover-glow transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  <span>{requires2FA ? 'Verifying...' : 'Logging in...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">{requires2FA ? 'verified_user' : 'login'}</span>
                  <span>{requires2FA ? 'Verify & Login' : 'Login to My Account'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Need help? <Link to="/contact" className="text-primary font-semibold hover:underline">Contact support</Link>
          </p>
        </div>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-500">
          <span className="material-symbols-outlined text-xl">lock</span>
          <span className="text-sm">Secure login powered by SomaSave</span>
        </div>
      </div>
    </main>
  );
});

export default Login;
