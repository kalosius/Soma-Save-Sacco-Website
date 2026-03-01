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
    navigator.serviceWorker.register('/sw.js').catch(() => {});
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
