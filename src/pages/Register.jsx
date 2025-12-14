import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Toast from '../components/Toast';

export default function Register() {
  const navigate = useNavigate();
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    university: '',
    course: '',
    yearOfStudy: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Fetch universities on component mount
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await api.universities.getAll();
        setUniversities(response);
      } catch (err) {
        console.error('Failed to fetch universities:', err);
      }
    };
    fetchUniversities();
  }, []);

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
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Validate all required fields
    if (!formData.fullName || !formData.email || !formData.phone || 
        !formData.studentId || !formData.university || !formData.course || !formData.yearOfStudy) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Prepare data for API
      const registrationData = {
        username: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirm_password: formData.confirmPassword,
        phone_number: formData.phone.trim(),
        student_id: formData.studentId.trim(),
        university: parseInt(formData.university),
        course: formData.course.trim(),
        year_of_study: parseInt(formData.yearOfStudy),
      };

      console.log('Sending registration data:', { ...registrationData, password: '***', confirm_password: '***' });

      const response = await api.auth.register(registrationData);
      
      // Store user data in localStorage
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userName', formData.fullName);
      localStorage.setItem('userEmail', formData.email);
      
      // Show success toast
      setToast({
        message: `Registration successful! Welcome to SomaSave SACCO, ${formData.fullName}. Redirecting to login...`,
        type: 'success'
      });
      
      // Navigate after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      // Handle different types of errors
      if (err.response?.data) {
        // Backend validation errors
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          // Format field-specific errors
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]) => {
              const fieldName = field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
              const message = Array.isArray(messages) ? messages[0] : messages;
              return `${fieldName}: ${message}`;
            })
            .join('\n');
          setError(errorMessages || 'Registration failed. Please check your information.');
          setToast({
            message: errorMessages || 'Registration failed. Please check your information.',
            type: 'error'
          });
        } else {
          setError(errorData.toString());
          setToast({
            message: errorData.toString(),
            type: 'error'
          });
        }
      } else {
        const errorMsg = err.message || 'Registration failed. Please check your connection and try again.';
        setError(errorMsg);
        setToast({
          message: errorMsg,
          type: 'error'
        });
      }
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 bg-background-light dark:bg-background-dark py-12 px-4 sm:px-6 lg:px-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeInUp">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3">
            Join SomaSave SACCO
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Register as a student member and start your financial journey today
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Login here</Link>
          </p>
        </div>

        {/* Registration Form */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 shadow-lg animate-fadeInUp">
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 mt-0.5">error</span>
                <div className="flex-1">
                  {error.split('\n').map((line, idx) => (
                    <p key={idx} className="text-red-600 dark:text-red-400 text-sm">{line}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Stephen Lubega"
                    className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+256 700 000000"
                    className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-gray-900 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Stephen@university.ac.ug"
                    className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Academic Information Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">school</span>
                Academic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Student ID *
                  </label>
                  <input
                    type="text"
                    name="studentId"
                    required
                    value={formData.studentId}
                    onChange={handleChange}
                    placeholder="2021/BCS/001/PS"
                    className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    University *
                  </label>
                  <select
                    name="university"
                    required
                    value={formData.university}
                    onChange={handleChange}
                    className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-gray-900 dark:text-white"
                  >
                    <option value="">Select your university</option>
                    {universities.map((uni) => (
                      <option key={uni.id} value={uni.id}>{uni.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Course/Program *
                  </label>
                  <input
                    type="text"
                    name="course"
                    required
                    value={formData.course}
                    onChange={handleChange}
                    placeholder="Bachelor of Computer Science"
                    className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Year of Study *
                  </label>
                  <select
                    name="yearOfStudy"
                    required
                    value={formData.yearOfStudy}
                    onChange={handleChange}
                    className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-gray-900 dark:text-white"
                  >
                    <option value="">Select year</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                    <option value="5">Year 5+</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Account Security Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">lock</span>
                Account Security
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <input
                type="checkbox"
                required
                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label className="text-sm text-gray-600 dark:text-gray-400">
                I agree to the <Link to="/privacy-policy" className="text-primary font-semibold hover:underline">Terms and Conditions</Link> and confirm that I am a currently enrolled university student in Uganda. *
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 h-14 rounded-full bg-primary text-gray-900 text-base font-bold hover:opacity-90 hover-glow transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">person_add</span>
                  <span>Create My Account</span>
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-500">
              Need help? <Link to="/contact" className="text-primary font-semibold hover:underline">Contact us</Link>
            </p>
          </form>
        </div>

        {/* Benefits Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeInUp">
          <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50">
            <span className="material-symbols-outlined text-primary text-2xl">verified_user</span>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Secure & Verified</p>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50">
            <span className="material-symbols-outlined text-primary text-2xl">flash_on</span>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Instant Approval</p>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50">
            <span className="material-symbols-outlined text-primary text-2xl">support_agent</span>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">24/7 Support</p>
          </div>
        </div>
      </div>
    </main>
  );
}
