// Service Worker for SomaSave Member Portal PWA
const CACHE_NAME = 'somasave-portal-v2';
const STATIC_CACHE = 'somasave-static-v2';
const DYNAMIC_CACHE = 'somasave-dynamic-v2';
const API_CACHE = 'somasave-api-v2';

const MEMBER_PORTAL_URLS = [
  '/',
  '/member-portal',
  '/login',
  '/register',
  '/icon-180x180.png',
  '/manifest.json'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching member portal files');
      return cache.addAll(MEMBER_PORTAL_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  const currentCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (!currentCaches.includes(cache)) {
            console.log('Service Worker: Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated and ready!');
      return self.clients.claim();
    })
  );
});

// Fetch event - stale-while-revalidate for ultra-fast loads
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API calls - Network first with short cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses for 5 minutes
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone);
              // Auto-expire API cache after 5 minutes
              setTimeout(() => {
                cache.delete(request);
              }, 5 * 60 * 1000);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets - Stale-while-revalidate (instant loads!)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached version immediately
      const fetchPromise = fetch(request).then((networkResponse) => {
        // Update cache in background
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          const cacheName = url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2?)$/) 
            ? STATIC_CACHE 
            : DYNAMIC_CACHE;
          caches.open(cacheName).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      // Return cached response immediately, or wait for network
      return cachedResponse || fetchPromise;
    })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
