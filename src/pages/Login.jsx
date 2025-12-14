import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });

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
      const response = await api.auth.login(formData.identifier, formData.password);
      
      // Store user data in localStorage
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', response.user.first_name + ' ' + response.user.last_name);
      localStorage.setItem('userEmail', response.user.email);
      localStorage.setItem('userData', JSON.stringify(response.user));
      
      alert(`Welcome back, ${response.user.first_name}!`);
      navigate('/member-portal');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 bg-background-light dark:bg-background-dark flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 h-14 rounded-full bg-primary text-gray-900 text-base font-bold hover:opacity-90 hover-glow transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">login</span>
                  <span>Login to My Account</span>
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
}
