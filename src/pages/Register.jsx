import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
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

  const universities = [
    'Makerere University',
    'Kyambogo University',
    'Mbarara University of Science and Technology',
    'Gulu University',
    'Busitema University',
    'Kampala International University',
    'Uganda Christian University',
    'Islamic University in Uganda',
    'Ndejje University',
    'Uganda Martyrs University',
    'Mountains of the Moon University',
    'Kabale University',
    'Soroti University',
    'Lira University',
    'Other'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    // Here you would normally send the data to your backend
    console.log('Registration submitted:', formData);
    
    // Simulate successful registration
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', formData.fullName);
    
    alert('Registration successful! Welcome to SomaSave SACCO.');
    navigate('/member-portal');
  };

  return (
    <main className="flex-1 bg-background-light dark:bg-background-dark py-12 px-4 sm:px-6 lg:px-8">
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
                      <option key={uni} value={uni}>{uni}</option>
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
              className="w-full flex items-center justify-center gap-2 h-14 rounded-full bg-primary text-gray-900 text-base font-bold hover:opacity-90 hover-glow transition-all shadow-lg"
            >
              <span className="material-symbols-outlined">person_add</span>
              <span>Create My Account</span>
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
