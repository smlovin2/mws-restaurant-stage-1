const staticCacheName = 'restaurant-cache-v25';
const imgsCache = 'restaurant-imgs';
const allCaches = [
  staticCacheName,
  imgsCache
];

self.addEventListener('install', function(event) {
  event.waitUntil(
      caches.open(staticCacheName).then(function(cache){})
  );
})

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('restaurant-') &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
})

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) return response;
      return fetch(event.request).then(function(response) {
        caches.open(staticCacheName).then(function(cache) {
          cache.put(event.request, response);
        });
        return response.clone();
      });
    })
  )
})
