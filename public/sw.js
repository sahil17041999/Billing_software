// Grocery Billing POS - Progressive Web App Service Worker
const CACHE_NAME = 'grocery-pos-v2.0';
const STATIC_ASSETS = [
  '/assets/css/admin-theme.css',
  '/assets/css/icons/tabler-icons/tabler-icons.css',
  '/assets/images/logos/favicon.png',
  '/assets/images/profile/user-1.jpg',
  '/manifest.json'
];

// Install Event - Pre-cache Static Shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        // Continue even if some assets are missing
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean Up Old Caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network First with Cache Fallback for Static Assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and API/data routes from aggressive caching to preserve fresh financial transactions
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api') || url.pathname.includes('logout')) {
    return;
  }

  // Network-first for dynamic HTML views, Stale-while-revalidate for static CSS/JS
  if (url.pathname.startsWith('/assets/') || url.pathname === '/manifest.json') {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  } else {
    // Network first for HTML pages
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  }
});
