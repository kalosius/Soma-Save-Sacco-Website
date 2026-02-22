import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import initScrollReveal from './utils/scrollReveal';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for PWA and Push Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

// initialize auto scroll reveal animations across pages
try {
  // run after DOM is ready — call with small timeout to ensure React mounted
  window.addEventListener('load', () => {
    setTimeout(() => {
      initScrollReveal();
    }, 80);
  });
} catch (e) {
  console.warn('Scroll reveal init failed', e);
}
