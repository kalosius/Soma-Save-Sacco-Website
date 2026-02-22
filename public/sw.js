// Service Worker for SomaSave Member Portal PWA
const CACHE_NAME = 'somasave-portal-v6';
const STATIC_CACHE = 'somasave-static-v6';
const DYNAMIC_CACHE = 'somasave-dynamic-v6';
const API_CACHE = 'somasave-api-v6';

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

  if (request.method !== 'GET') return;

  // Navigation requests (SPA) - try network first, fallback to cached index.html
  if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Update cached index.html for offline fallback
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

  // API calls - Network first with short cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone);
              setTimeout(() => cache.delete(request), 5 * 60 * 1000);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets - Stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
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
  console.log('📬 Push notification received:', event);
  
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
      console.log('📨 Notification data:', data);
      
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
      console.error('❌ Error parsing notification data:', e);
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
  
  console.log('✅ Notification displayed:', notificationData.title);
  event.waitUntil(promiseChain);
});

// Notification click handler - handles both notification click and action button clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event);
  
  event.notification.close();
  
  // Handle action button clicks
  if (event.action === 'close') {
    console.log('❌ User dismissed notification');
    return;
  }
  
  // Get the URL from notification data
  const urlToOpen = event.notification.data?.url || '/member-portal';
  
  console.log('🌐 Opening URL:', urlToOpen);
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open with the target URL
        for (const client of clientList) {
          if (client.url.includes('/member-portal') && 'focus' in client) {
            console.log('✅ Focusing existing window');
            return client.focus().then(client => {
              // Navigate to specific URL if different
              if (urlToOpen !== '/member-portal') {
                return client.navigate(urlToOpen);
              }
              return client;
            });
          }
        }
        
        // Open a new window if none exists
        console.log('🆕 Opening new window');
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close handler (optional analytics)
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});
