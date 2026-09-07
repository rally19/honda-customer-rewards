/**
 * Honda Customer Rewards - Service Worker
 * CV Anugerah Perdana
 */

const CACHE_NAME = 'honda-rewards-v1.0.1';
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
    OFFLINE_URL,
    '/site.webmanifest',
    '/favicon.ico',
    '/icons/pwa-192x192.png',
    '/icons/pwa-512x512.png',
    '/icons/pwa-maskable-512x512.png',
    '/apple-touch-icon.png',
    '/images/logo/anper_sartika_logo_white.png',
    '/images/logo/anper_sartika_logo_white_1x1.png',
    '/images/logo/anper_logo_red.png',
    '/images/logo/honda_logo_red.png',
    '/images/logo/honda_logo_white.png',
];

// 1. INSTALL: Precache offline fallback shell and key assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// 2. ACTIVATE: Cleanup stale caches and take immediate control
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. FETCH: Smart caching strategy
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Only intercept GET requests
    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    // Only handle http and https schemes (ignore chrome-extension, etc.)
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Skip API, authentication endpoints, and internal dev servers
    if (
        url.pathname.startsWith('/api') ||
        url.pathname.startsWith('/sanctum') ||
        url.pathname.startsWith('/logout') ||
        url.port === '5173' // Vite HMR port if applicable
    ) {
        return;
    }

    // A. Navigation requests (HTML page loads / Inertia initial visits)
    // Strategy: Network-first, fallback to /offline.html
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .catch(() => {
                    return caches.match(OFFLINE_URL);
                })
        );
        return;
    }

    // B. Static Assets: Build JS/CSS, images, fonts, icons
    // Strategy: Stale-While-Revalidate
    const isStaticAsset = (
        url.pathname.startsWith('/build/') ||
        url.pathname.startsWith('/icons/') ||
        url.pathname.startsWith('/images/') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.woff2') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.ico')
    );

    if (isStaticAsset) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                const fetchPromise = fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        });
                    }
                    return networkResponse;
                }).catch(() => cachedResponse);

                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // Default: Network with cache fallback
    event.respondWith(
        fetch(request).catch(() => caches.match(request))
    );
});

// 4. MESSAGE: Support manual update triggers from client UI
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
