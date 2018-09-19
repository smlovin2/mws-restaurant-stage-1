const staticCacheName = 'restaurant-cache-v26';
const imgsCache = 'restaurant-imgs';
const leafletCache = 'leaflet-cache';
const fontsCache = 'fonts-cache';
const allCaches = [
  staticCacheName,
  imgsCache,
  leafletCache,
  fontsCache
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache){
      return cache.addAll([
        'index.html',
        'js/main.js',
        'js/restaurant_info.js',
        'js/dbhelper.js',
        'js/imghelper.js',
        'js/idb.js',
        'css/styles.css',
        'css/responsive.css'
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
    if (requestUrl.pathname.startsWith('/restaurant.html')) {
      event.respondWith(
        caches.match(event.request).then(function(response) {
          if (response) return response;

          return fetch(event.request).then(function(response) {
            caches.open(staticCacheName).then(function(cache) {
              cache.put(event.request, response.clone());
              return response;
            });
          });
        })
      );
    }
    if (requestUrl.pathname.startsWith('/img/')) {
      event.respondWith(serveImg(event.request ));
      return;
    }
  }

  if (requestUrl.pathname.includes('leaflet')) {
    event.respondWith(serveLeaflet(event.request));
    return;
  }
  if (requestUrl.pathname.includes('font')) {
    event.respondWith(serveFont(event.request));
    return;
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

const serveLeaflet = (request) => {
  return caches.open(leafletCache).then(function(cache) {
    return cache.match(request).then(function(response) {
      if (response) return response;
      return fetch(request).then(function(networkReponse) {
        cache.put(request, networkReponse.clone());
        return networkReponse;
      });
    });
  });
};

const serveFont = (request) => {
  return caches.open(fontsCache).then(function(cache) {
    return cache.match(request).then(function(response) {
      if (response) return response;
      return fetch(request).then(function(networkReponse) {
        cache.put(request, networkReponse.clone());
        return networkReponse;
      });
    });
  });
};
