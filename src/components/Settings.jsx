import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import api from '../services/api';
import PushNotificationManager from './PushNotificationManager';

export default function Settings({ user }) {
  const { theme, toggleTheme } = useTheme();
  const { settings: globalSettings, updateSettings: updateGlobalSettings, loadSettings } = useSettings();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    transactionAlerts: true,
    loanReminders: true,
    marketingEmails: false,
    language: 'en',
    currency: 'UGX',
    twoFactorAuth: false,
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // 2FA state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFAMode, setTwoFAMode] = useState(''); // 'enable' or 'disable'
  const [otpInput, setOtpInput] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState(1); // 1: initial, 2: OTP entry

  // Load user settings on component mount
  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      setLoadingSettings(true);
      const data = await api.settings.get();
      
      // Map backend field names to frontend state
      setSettings({
        emailNotifications: data.email_notifications,
        smsNotifications: data.sms_notifications,
        transactionAlerts: data.transaction_alerts,
        loanReminders: data.loan_reminders,
        marketingEmails: data.marketing_emails,
        language: data.language,
        currency: data.currency,
        twoFactorAuth: data.two_factor_auth,
      });
    } catch (err) {
      console.error('Failed to load settings:', err);
      setMessage({ type: 'error', text: 'Failed to load settings.' });
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleToggle = (setting) => {
    // Special handling for 2FA - requires OTP verification
    if (setting === 'twoFactorAuth') {
      if (settings.twoFactorAuth) {
        // Disabling 2FA - show password modal
        setTwoFAMode('disable');
        setShow2FAModal(true);
        setTwoFAStep(1);
      } else {
        // Enabling 2FA - send OTP
        setTwoFAMode('enable');
        setShow2FAModal(true);
        setTwoFAStep(1);
      }
      return;
    }
    
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSelect = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      // Map frontend state to backend field names
      const settingsData = {
        email_notifications: settings.emailNotifications,
        sms_notifications: settings.smsNotifications,
        transaction_alerts: settings.transactionAlerts,
        loan_reminders: settings.loanReminders,
        marketing_emails: settings.marketingEmails,
        language: settings.language,
        currency: settings.currency,
        two_factor_auth: settings.twoFactorAuth,
      };
      
      const response = await api.settings.update(settingsData);
      
      // Update global settings context
      updateGlobalSettings({
        language: settings.language,
        currency: settings.currency,
      });
      
      // Reload settings to ensure sync
      await loadSettings();
      
      setMessage({ type: 'success', text: response.message || 'Settings saved successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to save settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' });
      return;
    }
    
    // Check for letter and number
    if (!/[A-Za-z]/.test(passwordData.newPassword)) {
      setMessage({ type: 'error', text: 'Password must contain at least one letter' });
      return;
    }
    
    if (!/\d/.test(passwordData.newPassword)) {
      setMessage({ type: 'error', text: 'Password must contain at least one number' });
      return;
    }
    
    try {
      setPasswordLoading(true);
      setMessage({ type: '', text: '' });
      
      const response = await api.profile.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      setMessage({ type: 'success', text: response.message || 'Password changed successfully!' });
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (err) {
      console.error('Failed to change password:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      setTwoFALoading(true);
      setMessage({ type: '', text: '' });
      
      const response = await api.twoFactorAuth.enable();
      
      setMessage({ type: 'success', text: response.message || 'OTP sent to your email' });
      setTwoFAStep(2); // Move to OTP entry step
    } catch (err) {
      console.error('Failed to enable 2FA:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to enable 2FA' });
      setShow2FAModal(false);
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!otpInput || otpInput.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit OTP' });
      return;
    }
    
    try {
      setTwoFALoading(true);
      setMessage({ type: '', text: '' });
      
      const response = await api.twoFactorAuth.verify(otpInput);
      
      // Update local settings
      setSettings(prev => ({
        ...prev,
        twoFactorAuth: true
      }));
      
      setMessage({ type: 'success', text: response.message || '2FA enabled successfully!' });
      setShow2FAModal(false);
      setOtpInput('');
      setTwoFAStep(1);
      
      // Reload settings to ensure sync
      await loadUserSettings();
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (err) {
      console.error('Failed to verify OTP:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to verify OTP' });
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      setMessage({ type: 'error', text: 'Password is required to disable 2FA' });
      return;
    }
    
    try {
      setTwoFALoading(true);
      setMessage({ type: '', text: '' });
      
      const response = await api.twoFactorAuth.disable(disablePassword);
      
      // Update local settings
      setSettings(prev => ({
        ...prev,
        twoFactorAuth: false
      }));
      
      setMessage({ type: 'success', text: response.message || '2FA disabled successfully!' });
      setShow2FAModal(false);
      setDisablePassword('');
      setTwoFAStep(1);
      
      // Reload settings to ensure sync
      await loadUserSettings();
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (err) {
      console.error('Failed to disable 2FA:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to disable 2FA' });
    } finally {
      setTwoFALoading(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 animate-fadeInUp">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage your account preferences and settings</p>

        {message.text && (
          <div className={`mt-6 p-4 rounded-lg ${
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
      </div>

      {/* Appearance */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 animate-fadeInUp">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Appearance</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">dark_mode</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Dark Mode</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Current theme: {theme === 'dark' ? 'Dark' : 'Light'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                theme === 'dark' ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">language</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Language</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred language</p>
              </div>
            </div>
            <select
              value={settings.language}
              onChange={(e) => handleSelect('language', e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
            >
              <option value="en">English</option>
              <option value="sw">Swahili</option>
              <option value="lg">Luganda</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">payments</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Currency</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Display currency</p>
              </div>
            </div>
            <select
              value={settings.currency}
              onChange={(e) => handleSelect('currency', e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
            >
              <option value="UGX">UGX (Ugandan Shilling)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 animate-fadeInUp">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Notifications</h3>
        
        {/* Push Notifications Manager */}
        <div className="mb-6">
          <PushNotificationManager />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">email</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Email Notifications</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates via email</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('emailNotifications')}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.emailNotifications ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                settings.emailNotifications ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">sms</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">SMS Notifications</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates via SMS</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('smsNotifications')}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.smsNotifications ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                settings.smsNotifications ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">notifications</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Transaction Alerts</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get notified of all transactions</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('transactionAlerts')}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.transactionAlerts ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                settings.transactionAlerts ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">event</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Loan Reminders</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reminders for loan payments</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('loanReminders')}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.loanReminders ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                settings.loanReminders ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">campaign</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Marketing Emails</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive promotional content</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('marketingEmails')}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.marketingEmails ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                settings.marketingEmails ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 animate-fadeInUp">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Security</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">shield</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add extra security to your account</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('twoFactorAuth')}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.twoFactorAuth ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <button 
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-primary/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">lock</span>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">Change Password</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Update your password</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
          </button>

          <button className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-primary/5 transition-all">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">devices</span>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">Active Sessions</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage your logged-in devices</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
          </button>
        </div>
      </div>

      {/* App Installation */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 animate-fadeInUp">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">App Installation</h3>
        
        <div className="space-y-4">
          <button 
            onClick={() => {
              // Trigger PWA install prompt
              window.dispatchEvent(new CustomEvent('show-pwa-install'));
            }}
            className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">install_mobile</span>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">Install SomaSave App</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get quick access from your home screen</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
          
          <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-lg p-4">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-primary">info</span>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Why install?</p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Faster access to your portal</li>
                  <li>• Works offline</li>
                  <li>• App-like experience</li>
                  <li>• No app store required</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 animate-fadeInUp">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Privacy & Data</h3>
        
        <div className="space-y-4">
          <button className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary hover:bg-primary/5 transition-all">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">download</span>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">Download Your Data</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Export your account data</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
          </button>

          <button className="w-full flex items-center justify-between p-4 rounded-lg border border-red-200 dark:border-red-800 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-red-600">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">delete</span>
              <div className="text-left">
                <p className="font-semibold">Delete Account</p>
                <p className="text-sm">Permanently delete your account</p>
              </div>
            </div>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-8 animate-fadeInUp">
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full px-6 py-4 rounded-lg bg-primary text-gray-900 font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-8 animate-fadeInUp">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                  placeholder="Enter new password"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Must be 8+ characters with letters and numbers
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 px-4 py-3 rounded-lg bg-primary text-gray-900 font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-8 animate-fadeInUp">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {twoFAMode === 'enable' ? 'Enable' : 'Disable'} Two-Factor Authentication
              </h3>
              <button
                onClick={() => {
                  setShow2FAModal(false);
                  setOtpInput('');
                  setDisablePassword('');
                  setTwoFAStep(1);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {twoFAMode === 'enable' && (
              <>
                {twoFAStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                      Two-factor authentication adds an extra layer of security to your account. 
                      When enabled, you'll need to enter a code sent to your email whenever you log in.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex gap-3">
                        <span className="material-symbols-outlined text-blue-600">info</span>
                        <div>
                          <p className="font-semibold text-blue-900 dark:text-blue-300">Important</p>
                          <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                            Make sure you have access to your email ({user?.email}) before enabling 2FA.
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleEnable2FA}
                      disabled={twoFALoading}
                      className="w-full px-4 py-3 rounded-lg bg-primary text-gray-900 font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {twoFALoading ? 'Sending OTP...' : 'Send Verification Code'}
                    </button>
                  </div>
                )}

                {twoFAStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                      We've sent a 6-digit verification code to your email. Enter it below to enable 2FA.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-2xl tracking-widest focus:outline-none focus:border-primary"
                        placeholder="000000"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center">
                        Code expires in 10 minutes
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleEnable2FA}
                        disabled={twoFALoading}
                        className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        {twoFALoading ? 'Resending...' : 'Resend Code'}
                      </button>
                      <button
                        onClick={handleVerify2FA}
                        disabled={twoFALoading || otpInput.length !== 6}
                        className="flex-1 px-4 py-3 rounded-lg bg-primary text-gray-900 font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        {twoFALoading ? 'Verifying...' : 'Verify & Enable'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {twoFAMode === 'disable' && (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Enter your password to disable two-factor authentication.
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-yellow-600">warning</span>
                    <div>
                      <p className="font-semibold text-yellow-900 dark:text-yellow-300">Warning</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                        Disabling 2FA will make your account less secure.
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                    placeholder="Enter your password"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShow2FAModal(false);
                      setDisablePassword('');
                    }}
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDisable2FA}
                    disabled={twoFALoading || !disablePassword}
                    className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
                  >
                    {twoFALoading ? 'Disabling...' : 'Disable 2FA'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
