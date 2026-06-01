const CACHE_NAME = 'ml-tlv-v3';
const OFFLINE_URL = '/offline.html';

// Assets to pre-cache on install
const PRE_CACHE = [
  OFFLINE_URL,
  '/logo_v3.png',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
];

// Install: Pre-cache offline page and core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRE_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first strategy with offline fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-HTTP(S) requests (like chrome-extension://, data:, etc.)
  if (!request.url.startsWith('http')) return;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API routes, Clerk, analytics, and external font CDNs
  const url = new URL(request.url);
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('clerk') ||
    url.hostname.includes('google') ||
    url.hostname.includes('clarity') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('sentry')
  ) {
    return;
  }

  // For navigation requests (HTML pages): Network first, fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful page responses
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          // Try cache first, then offline page
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // For static assets (images, CSS, JS, fonts): Cache first, network fallback
  if (
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|css|js|woff2?|ttf)$/) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        }).catch(() => {
          // Return nothing for failed static assets
          return new Response('', { status: 408, statusText: 'Offline' });
        });
      })
    );
    return;
  }
});

// Push: Handle incoming notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/logo_v3.png',
      image: data.image || null,
      badge: '/favicon.ico',
      data: {
        url: data.url || '/'
      },
      vibrate: [100, 50, 100],
      actions: [
        { action: 'open', title: 'פתח באתר' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (e) {
    console.error('Push handling error:', e);
  }
});

// Notification Click: Open the URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open with this URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

