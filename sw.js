const staticCacheName = 'restaurant-cache-v25';
const imgsCache = 'restaurant-imgs';
const allCaches = [
  staticCacheName,
  imgsCache
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache){
      return cache.addAll([
        'js/main.js',
        'css/styles.css'
      ]);
    })
  );
});

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
});

self.addEventListener('fetch', function(event) {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname.startsWith('/img/')) {
      event.respondWith(serveImg(event.request ));
      return;
    }
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

const serveImg = (request) => {
  const storageUrl = request.url.replace(/-\d*_?[a-zA-Z]+_?\d?x?.jpg$/, '');

  return caches.open(imgsCache).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkReponse) {
        cache.put(storageUrl, networkReponse.clone());
        return networkReponse;
      });
    });
  });
};
