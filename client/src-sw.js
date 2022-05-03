const { offlineFallback, warmStrategyCache } = require('workbox-recipes');
const { CacheFirst } = require('workbox-strategies'); // strategy that hits the chache first and then goes to the server if the asset is not cached
const { registerRoute } = require('workbox-routing'); // defines the routes upon which to use a cache. Takes in URLs and a cache strategy. Remember that URLs can also be calls to assets not just pages
const { CacheableResponsePlugin } = require('workbox-cacheable-response'); // Used for filtering matches based on status code, header, or both
const { ExpirationPlugin } = require('workbox-expiration'); // Used to limit entries in cache, remove entries after a certain period of time
const { precacheAndRoute } = require('workbox-precaching/precacheAndRoute');

precacheAndRoute(self.__WB_MANIFEST);

const pageCache = new CacheFirst({
  cacheName: 'page-cache',
  plugins: [
    new CacheableResponsePlugin({
      statuses: [0, 200],
    }),
    new ExpirationPlugin({
      maxAgeSeconds: 30 * 24 * 60 * 60,
    }),
  ],
});

warmStrategyCache({
  urls: ['/index.html', '/'],
  strategy: pageCache,
});

// Caches page navigations and then uses the pageCache callback which is setup with a cache first strategy. The call will first hit the cache, and only go to the network if the asset is not there
registerRoute(({ request }) => request.mode === 'navigate', pageCache);


// Set up asset cache
registerRoute(
  // Here we define the callback function that will filter the requests we want to cache (in this case, JS, CSS and worker files)
  ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
  new CacheFirst({
    // Name of the cache storage.
    cacheName: 'jate-asset-cache',
    plugins: [
      // This plugin will cache responses with these headers to a maximum-age of 30 days
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache images with a Cache First strategy
registerRoute(
  // Check to see if the request's destination is style for an image
  ({ request }) => request.destination === 'image',
  // Use a Cache First caching strategy
  new CacheFirst({
    // Put all cached files in a cache named 'images'
    cacheName: 'jate-image-cache',
    plugins: [
      // Ensure that only requests that result in a 200 status are cached
      new CacheableResponsePlugin({
        statuses: [200],
      }),
      // Don't cache more than 20 items, and expire them after 30 days
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
      }),
    ],
  }),
);