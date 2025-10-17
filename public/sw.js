/**
 * Service Worker for erland.me
 *
 * Provides offline support, faster repeat visits, and better PWA experience.
 * Uses cache-first strategy for static assets and network-first for HTML.
 *
 * Cache Strategy:
 * - Static assets (CSS, JS, fonts, images): Cache First with fallback
 * - HTML pages: Network First with cache fallback
 * - API/external: Network Only
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `erland-me-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// Assets to precache on install
const PRECACHE_ASSETS = ['/', '/offline/', '/assets/profile/avatar.webp'];

// Cache duration in seconds
const CACHE_MAX_AGE = {
  html: 60 * 60 * 24, // 24 hours
  static: 60 * 60 * 24 * 30, // 30 days
  images: 60 * 60 * 24 * 7, // 7 days
};

/**
 * Install event - precache critical assets
 */
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Precaching assets');
        return cache.addAll(
          PRECACHE_ASSETS.map(url => new Request(url, { cache: 'reload' }))
        );
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Precache failed:', err))
  );
});

/**
 * Activate event - cleanup old caches
 */
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(
              name => name.startsWith('erland-me-') && name !== CACHE_NAME
            )
            .filter(
              name => name.startsWith('runtime-') && name !== RUNTIME_CACHE
            )
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

/**
 * Fetch event - handle network requests with caching strategies
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (analytics, ads, etc)
  if (url.origin !== location.origin) {
    return;
  }

  // Skip admin/preview routes
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/_')) {
    return;
  }

  event.respondWith(handleFetch(request));
});

/**
 * Main fetch handler with routing logic
 */
async function handleFetch(request) {
  const url = new URL(request.url);

  // HTML pages: Network First
  if (
    request.headers.get('accept')?.includes('text/html') ||
    url.pathname.endsWith('/')
  ) {
    return networkFirstStrategy(request);
  }

  // Static assets: Cache First
  if (isStaticAsset(url)) {
    return cacheFirstStrategy(request);
  }

  // Images: Cache First with expiry
  if (isImage(url)) {
    return cacheFirstStrategy(request, CACHE_MAX_AGE.images);
  }

  // Default: Network First
  return networkFirstStrategy(request);
}

/**
 * Cache First Strategy
 * Try cache first, fallback to network, update cache
 */
async function cacheFirstStrategy(request, maxAge = CACHE_MAX_AGE.static) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    // Check if cache is still fresh
    const cachedDate = new Date(cached.headers.get('sw-cached-date') || 0);
    const now = new Date();
    const age = (now - cachedDate) / 1000;

    if (age < maxAge) {
      // Serve from cache
      return cached;
    }
  }

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const responseToCache = response.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-date', new Date().toISOString());

      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });

      cache.put(request, modifiedResponse);
    }

    return response;
  } catch (error) {
    // Network failed, serve stale cache if available
    if (cached) {
      return cached;
    }

    // No cache available, show offline page for HTML
    if (request.headers.get('accept')?.includes('text/html')) {
      const offlineResponse = await cache.match('/offline/');
      if (offlineResponse) return offlineResponse;
    }

    throw error;
  }
}

/**
 * Network First Strategy
 * Try network first, fallback to cache
 */
async function networkFirstStrategy(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);

    // Cache successful HTML responses
    if (response.ok && request.headers.get('accept')?.includes('text/html')) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Network failed, try cache
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    // Show offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      const offlineResponse = await cache.match('/offline/');
      if (offlineResponse) return offlineResponse;
    }

    throw error;
  }
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(url) {
  const staticExtensions = [
    '.css',
    '.js',
    '.woff',
    '.woff2',
    '.ttf',
    '.otf',
    '.eot',
  ];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

/**
 * Check if URL is an image
 */
function isImage(url) {
  const imageExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
    '.avif',
    '.ico',
  ];
  return imageExtensions.some(ext => url.pathname.endsWith(ext));
}

/**
 * Message handler for SW updates
 */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data === 'CACHE_URLS') {
    event.waitUntil(
      caches
        .open(RUNTIME_CACHE)
        .then(cache => cache.addAll(event.data.urls || []))
    );
  }
});
