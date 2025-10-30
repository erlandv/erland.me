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

/**
 * Simple logging abstraction for service worker
 * Consistent with centralized logger utility pattern
 */
const logger = (() => {
  const PREFIX = '[SW]';

  // Service workers are only active in production-like contexts
  // so we always log info/debug for visibility during development
  const isDevMode =
    self.location.hostname === 'localhost' ||
    self.location.hostname === '127.0.0.1';

  return {
    info: (message, ...args) => {
      if (isDevMode) {
        console.log(`${PREFIX} ℹ️`, message, ...args);
      }
    },
    warn: (message, ...args) => {
      console.warn(`${PREFIX} ⚠️`, message, ...args);
    },
    error: (message, error, ...args) => {
      console.error(`${PREFIX} ❌`, message, ...args);
      if (error) {
        console.error('Error:', error);
      }
    },
    debug: (message, ...args) => {
      if (isDevMode) {
        console.debug(`${PREFIX} 🔍`, message, ...args);
      }
    },
  };
})();

// Bump this value to force clients to refresh caches when deploying breaking changes.
// Increment manually (e.g., 'v2' or a timestamp/sha) on deploy.
const CACHE_VERSION = 'v2';
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
  logger.info('Installing service worker...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        logger.info('Precaching assets');
        return cache.addAll(
          PRECACHE_ASSETS.map(url => new Request(url, { cache: 'reload' }))
        );
      })
      .then(() => self.skipWaiting())
      .catch(err => logger.error('Precache failed', err))
  );
});

/**
 * Activate event - cleanup old caches
 */
self.addEventListener('activate', event => {
  logger.info('Activating service worker...');

  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const cachesToDelete = cacheNames.filter(name => {
        const isAppCache = name.startsWith('erland-me-') && name !== CACHE_NAME;
        const isRuntimeCache =
          name.startsWith('runtime-') && name !== RUNTIME_CACHE;
        return isAppCache || isRuntimeCache;
      });

      await Promise.all(
        cachesToDelete.map(name => {
          logger.info('Deleting old cache:', name);
          return caches.delete(name);
        })
      );

      await self.clients.claim();
    })()
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
  // First check all caches (including the precache `CACHE_NAME`).
  // `caches.match` searches across all cache stores.
  const cached = await caches.match(request);

  if (cached) {
    // Check if cache is still fresh (may be precached without our header)
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

    // Cache successful responses (store in runtime cache)
    if (response.ok) {
      const responseToCache = response.clone();

      // Read body to make a fresh Response we can modify headers on.
      const buffer = await responseToCache.arrayBuffer();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-date', new Date().toISOString());

      const modifiedResponse = new Response(buffer, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers,
      });

      const runtimeCache = await caches.open(RUNTIME_CACHE);
      runtimeCache.put(request, modifiedResponse);
    }

    return response;
  } catch (error) {
    // Network failed, serve stale cache if available
    if (cached) {
      return cached;
    }

    // No cache available, show offline page for HTML
    if (request.headers.get('accept')?.includes('text/html')) {
      const offlineResponse = await caches.match('/offline/');
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

    // Cache successful HTML responses into runtime cache
    if (response.ok && request.headers.get('accept')?.includes('text/html')) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Network failed, try any cache (including precache)
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Show offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      const offlineResponse = await caches.match('/offline/');
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
  const data = event.data;
  if (data === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (data && data.type === 'CACHE_URLS' && Array.isArray(data.urls)) {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then(cache => cache.addAll(data.urls))
    );
  }
});
