import { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                                window.navigator.standalone === true;
    setIsStandalone(isInStandaloneMode);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Check if user dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = localStorage.getItem('pwa-install-dismissed-time');
    
    // Show again after 7 days
    if (dismissed && dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show manual instructions if not installed
    if (iOS && !isInStandaloneMode && !dismissed) {
      setTimeout(() => setShowPrompt(true), 3000); // Show after 3 seconds
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      console.log('PWA installation accepted');
    }

    // Clear the prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    localStorage.setItem('pwa-install-dismissed-time', Date.now().toString());
  };

  const handleNeverShow = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    localStorage.setItem('pwa-install-dismissed-time', (Date.now() + 365 * 24 * 60 * 60 * 1000).toString()); // 1 year
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn" onClick={handleDismiss} />

      {/* Install Prompt Card */}
      <div className="fixed bottom-0 left-0 right-0 lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:max-w-md lg:mx-auto z-50 animate-slideUpFade">
        <div className="bg-white dark:bg-gray-900 rounded-t-3xl lg:rounded-3xl shadow-2xl p-6 m-0 lg:m-4">
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>

          {/* Icon and Header */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-green-400 flex items-center justify-center shadow-lg">
              <img src="/icon-180x180.png" alt="SomaSave" className="w-16 h-16 rounded-xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Install SomaSave App
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Get quick access to your member portal with our app!
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-lg">offline_bolt</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Works Offline</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Access your account even without internet</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-lg">flash_on</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Lightning Fast</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Instant loading and smooth performance</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-lg">home_app_logo</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Home Screen Access</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">One tap to open from your home screen</p>
              </div>
            </div>
          </div>

          {/* Install Instructions */}
          {isIOS ? (
            /* iOS Instructions */
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
              <p className="font-semibold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">info</span>
                How to Install on iOS:
              </p>
              <ol className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  <span>Tap the <strong>Share</strong> button <span className="material-symbols-outlined text-sm align-middle">ios_share</span> in Safari</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  <span>Tap <strong>"Add"</strong> in the top right corner</span>
                </li>
              </ol>
            </div>
          ) : (
            /* Android/Chrome Button */
            <button
              onClick={handleInstallClick}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-green-400 text-gray-900 font-bold text-base hover:opacity-90 transition-all shadow-lg mb-3"
            >
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">download</span>
                Install App
              </span>
            </button>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Not Now
            </button>
            <button
              onClick={handleNeverShow}
              className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Never Show
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
