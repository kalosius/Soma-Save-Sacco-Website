// Service Worker for SomaSave Member Portal PWA — PERFORMANCE OPTIMIZED
const CACHE_NAME = 'somasave-portal-v15';
const STATIC_CACHE = 'somasave-static-v15';
const DYNAMIC_CACHE = 'somasave-dynamic-v15';
const API_CACHE = 'somasave-api-v15';

// Only pre-cache truly static files — NOT SPA routes
// Pre-caching /member-portal, /login etc. was causing install failures
const PRECACHE_URLS = [
  '/icon-180x180.png',
  '/manifest.json'
];

// Install event - cache only essential static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Don't block install if pre-caching fails
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up ALL old caches aggressively
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (!currentCaches.includes(cache)) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
    // NOTE: Removed SW_UPDATED broadcast — it caused infinite reload loops.
    // The controllerchange event in main.jsx handles reload when appropriate.
  );
});

// Fetch event - ultra-fast caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Skip caching for external resources and analytics
  if (!url.origin.includes(self.location.origin) && !url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2?|ttf|ico)$/)) {
    return;
  }

  // Navigation requests (SPA) - NETWORK FIRST, cache only for offline fallback
  // CRITICAL: Must always fetch latest HTML so JS chunk hashes match the deployed files
  if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // API calls — Network first with fast cache fallback
  // Dashboard stats: cache for 15 seconds for instant tab switches
  if (url.pathname.startsWith('/api/')) {
    const isDashboard = url.pathname.includes('dashboard/stats');
    event.respondWith(
      fetch(request).then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // Hashed static assets (JS/CSS with content hash) - Cache first, immutable
  if (url.pathname.match(/\.[a-f0-9]{8,}\.(js|css)$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Fonts - Cache first (very stable)
  if (url.pathname.match(/\.(woff2?|ttf|eot)$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Images - Cache first with network fallback
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Everything else - Stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

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

// Push notification event handler
self.addEventListener('push', (event) => {
  let notificationData = {
    title: '🔔 SomaSave SACCO',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    image: null,
    url: '/member-portal'
  };
  
  // Parse notification data from backend
  if (event.data) {
    try {
      const data = event.data.json();
      
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        image: data.image || null,
        url: data.url || notificationData.url,
        data: data.data || {}
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }
  
  // Enhanced notification options for professional appearance
  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: 'somasave-' + Date.now(), // Unique tag to show multiple notifications
    requireInteraction: false, // Allow auto-dismiss on mobile for better UX
    vibrate: [300, 100, 300, 100, 300], // Strong vibration pattern for attention
    silent: false, // CRITICAL: Ensure notification makes sound (NOT silenced)
    renotify: true, // Alert user even if similar notification exists
    timestamp: Date.now(), // Show when notification was sent
    actions: [
      {
        action: 'open',
        title: '📱 Open App',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: '✕ Dismiss',
        icon: '/icon-192x192.png'
      }
    ],
    data: {
      url: notificationData.url,
      timestamp: Date.now(),
      ...notificationData.data
    }
  };
  
  // Add image if provided (shows large image in notification)
  if (notificationData.image) {
    notificationOptions.image = notificationData.image;
  }
  
  // Show notification with all options
  const promiseChain = self.registration.showNotification(
    notificationData.title,
    notificationOptions
  );
  
  event.waitUntil(promiseChain);
});

// Notification click handler - handles both notification click and action button clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked');
  
  event.notification.close();
  
  // Handle action button clicks
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/member-portal';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/member-portal') && 'focus' in client) {
            return client.focus().then(client => {
              if (urlToOpen !== '/member-portal') {
                return client.navigate(urlToOpen);
              }
              return client;
            });
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('notificationclose', () => {});
