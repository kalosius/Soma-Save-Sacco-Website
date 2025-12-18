import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Profile({ user: initialUser, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(initialUser);
  const [formData, setFormData] = useState({
    first_name: initialUser?.first_name || '',
    last_name: initialUser?.last_name || '',
    email: initialUser?.email || '',
    phone_number: initialUser?.phone_number || '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profileImage, setProfileImage] = useState(null);

  // Update user state when initialUser changes
  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
      setFormData({
        first_name: initialUser?.first_name || '',
        last_name: initialUser?.last_name || '',
        email: initialUser?.email || '',
        phone_number: initialUser?.phone_number || '',
      });
    }
  }, [initialUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
        return;
      }
      setProfileImage(file);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      // Create form data to handle both text fields and image upload
      const updateData = { ...formData };
      
      // If profile image is selected, we need to use FormData
      let updatedUser;
      if (profileImage) {
        const formDataToSend = new FormData();
        Object.keys(formData).forEach(key => {
          if (formData[key]) {
            formDataToSend.append(key, formData[key]);
          }
        });
        formDataToSend.append('profile_image', profileImage);
        
        // Send as multipart/form-data
        updatedUser = await api.profile.updateWithImage(formDataToSend);
      } else {
        // Send as JSON
        updatedUser = await api.profile.update(updateData);
      }

      setUser(updatedUser);
      setProfileImage(null);
      setEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      if (onUpdate) {
        onUpdate(updatedUser);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone_number: user?.phone_number || '',
    });
    setProfileImage(null);
    setEditing(false);
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 animate-fadeInUp">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-gray-900 font-semibold hover:opacity-90 transition-all"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              Edit Profile
            </button>
          )}
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
          }`}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">
                {message.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <p className="font-semibold">{message.text}</p>
            </div>
          </div>
        )}

        {/* Profile Image */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <div 
              className="w-24 h-24 rounded-full bg-cover bg-center border-4 border-primary/20"
              style={{
                backgroundImage: profileImage 
                  ? `url('${URL.createObjectURL(profileImage)}')`
                  : user?.profile_image 
                    ? `url('${user.profile_image}')` 
                    : "url('https://ui-avatars.com/api/?name=" + encodeURIComponent((user?.first_name || '') + ' ' + (user?.last_name || '')) + "&background=00FF00&color=000&size=128')"
              }}
            />
            {editing && (
              <label className="absolute bottom-0 right-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-gray-900 cursor-pointer hover:opacity-90 transition-all">
                <span className="material-symbols-outlined text-lg">photo_camera</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {user?.first_name} {user?.last_name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Member #{user?.student_id || 'N/A'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Member since {new Date(user?.date_joined || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              First Name
            </label>
            {editing ? (
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
              />
            ) : (
              <p className="px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white">
                {user?.first_name || 'Not provided'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Last Name
            </label>
            {editing ? (
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
              />
            ) : (
              <p className="px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white">
                {user?.last_name || 'Not provided'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            {editing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
              />
            ) : (
              <p className="px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white">
                {user?.email || 'Not provided'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            {editing ? (
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
              />
            ) : (
              <p className="px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white">
                {user?.phone_number || 'Not provided'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Student ID
              <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">(Cannot be changed)</span>
            </label>
            <p className="px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white">
              {user?.student_id || 'Not provided'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              University
              <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">(Cannot be changed)</span>
            </label>
            <p className="px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white">
              {user?.university_name || 'Not provided'}
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Course/Program
              <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">(Cannot be changed)</span>
            </label>
            <p className="px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white">
              {user?.course_name || 'Not provided'}
            </p>
          </div>
        </div>

        {editing && (
          <div className="flex gap-4 mt-8">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg bg-primary text-gray-900 font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Account Security */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 animate-fadeInUp">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Account Security</h3>
        <div className="space-y-4">
          <button className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-primary/5 transition-all">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">lock</span>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">Change Password</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Update your password regularly</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
          </button>

          <button className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-primary/5 transition-all">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">shield</span>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
