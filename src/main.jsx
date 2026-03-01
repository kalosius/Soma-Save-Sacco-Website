import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Render the app FIRST - everything else is deferred
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for PWA and Push Notifications (non-blocking)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Check for updates every 60 seconds
      setInterval(() => registration.update(), 60000);
    }).catch(() => {});

    // When a new SW takes over, reload to get fresh content
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    // Listen for SW_UPDATED message from new service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      }
    });
  });
}

// Defer scroll reveal initialization until idle
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    import('./utils/scrollReveal').then(({ default: initScrollReveal }) => {
      try { initScrollReveal(); } catch (e) {}
    });
  });
} else {
  setTimeout(() => {
    import('./utils/scrollReveal').then(({ default: initScrollReveal }) => {
      try { initScrollReveal(); } catch (e) {}
    });
  }, 300);
}
