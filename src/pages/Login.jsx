import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Here you would normally authenticate with your backend
    console.log('Login submitted:', formData);
    
    // Simulate successful login
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', 'John Doe'); // This would come from the backend
    
    alert('Login successful! Welcome back.');
    navigate('/member-portal');
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Email Address or Student ID
              </label>
              <input
                type="text"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="samuel@university.ac.ug"
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
              className="w-full flex items-center justify-center gap-2 h-14 rounded-full bg-primary text-gray-900 text-base font-bold hover:opacity-90 hover-glow transition-all shadow-lg"
            >
              <span className="material-symbols-outlined">login</span>
              <span>Login to My Account</span>
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
