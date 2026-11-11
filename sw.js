/* NWUFPA Matrice 4T trial scoring. Versioned cache: rater-scoring-v2026-11-11-3 */
const CACHE_NAME = "rater-scoring-v2026-11-11-3";
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.all(PRECACHE.map(function (url) {
        return cache.add(url).catch(function () { return null; });
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

function purgeOldCaches() {
  return caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) {
      return key !== CACHE_NAME;
    }).map(function (key) {
      return caches.delete(key);
    }));
  });
}

self.addEventListener("activate", function (event) {
  event.waitUntil(
    purgeOldCaches().then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("message", function (event) {
  if (!event.data || event.data.type !== "purge-old-caches") return;
  event.waitUntil(
    purgeOldCaches().then(function () {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ ok: true, cache: CACHE_NAME });
      }
    })
  );
});

function isPageRequest(request) {
  if (request.mode === "navigate") return true;
  var accept = request.headers.get("accept") || "";
  return request.destination === "document" || accept.indexOf("text/html") !== -1;
}

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (isPageRequest(event.request)) {
    event.respondWith(
      fetch(event.request).then(function (response) {
        if (response && response.ok) {
          var copyReq = response.clone();
          var copyIndex = response.clone();
          var copyRoot = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, copyReq);
            cache.put("./index.html", copyIndex);
            cache.put("./", copyRoot);
          });
        }
        return response;
      }).catch(function () {
        return caches.match(event.request).then(function (cached) {
          return cached || caches.match("./index.html") || caches.match("./");
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        if (response && response.ok) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return response;
      });
    })
  );
});
