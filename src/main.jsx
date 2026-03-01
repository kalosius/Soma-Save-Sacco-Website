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
    // Track if we already have a controller (existing SW) before registering
    const hadController = !!navigator.serviceWorker.controller;

    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Check for updates every 5 minutes (not 60s to reduce load)
      setInterval(() => registration.update(), 300000);
    }).catch(() => {});

    // Only reload on controller change if we HAD a previous SW
    // This prevents reload loops on first visit
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !refreshing) {
        refreshing = true;
        window.location.reload();
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
