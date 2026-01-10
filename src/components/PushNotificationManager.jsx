import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Push Notification Manager Component
 * Handles push notification subscription and permissions
 */
const PushNotificationManager = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if push notifications are supported
  const isPushSupported = () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  };

  // Convert base64 VAPID key to Uint8Array
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Get VAPID public key from backend
  const getVapidPublicKey = async () => {
    // You'll need to add this endpoint or hardcode the public key
    // For now, we'll use a placeholder - replace with your actual key
    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    return publicKey;
  };

  // Check current subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isPushSupported()) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (err) {
        console.error('Error checking subscription:', err);
      }
    };

    checkSubscription();
  }, []);

  // Subscribe to push notifications
  const subscribeToPush = async () => {
    if (!isPushSupported()) {
      setError('Push notifications are not supported in your browser');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        setError('Notification permission denied');
        setLoading(false);
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key
      const vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) {
        setError('VAPID public key not configured');
        setLoading(false);
        return;
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      // Send subscription to backend
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))),
        },
      };

      await api.post('/push-subscriptions/', subscriptionData);

      setIsSubscribed(true);
      console.log('Successfully subscribed to push notifications');
    } catch (err) {
      console.error('Error subscribing to push:', err);
      setError(err.message || 'Failed to subscribe to notifications');
    } finally {
      setLoading(false);
    }
  };

  // Unsubscribe from push notifications
  const unsubscribeFromPush = async () => {
    if (!isPushSupported()) return;

    setLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe locally
        await subscription.unsubscribe();

        // Notify backend
        await api.post('/push-subscriptions/unsubscribe/', {
          endpoint: subscription.endpoint,
        });

        setIsSubscribed(false);
        console.log('Successfully unsubscribed from push notifications');
      }
    } catch (err) {
      console.error('Error unsubscribing from push:', err);
      setError(err.message || 'Failed to unsubscribe');
    } finally {
      setLoading(false);
    }
  };

  // Don't render if push is not supported
  if (!isPushSupported()) {
    return null;
  }

  return (
    <div className="push-notification-manager">
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Push Notifications
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isSubscribed
              ? 'You will receive notifications for important updates'
              : 'Enable notifications to stay updated on your account activity'}
          </p>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
          )}
        </div>
        
        <div className="ml-4">
          {permission === 'denied' ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              Notifications blocked. Please enable in browser settings.
            </p>
          ) : (
            <button
              onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isSubscribed
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : isSubscribed ? (
                'Disable Notifications'
              ) : (
                'Enable Notifications'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PushNotificationManager;
