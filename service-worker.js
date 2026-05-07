const CACHE_NAME = "split-facil-cache-v7";

const APP_STATIC_RESOURCES = [ //los archivos que queremos guardar para que la app cargue offline
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./storage.js",
  "./manifest.json",
  "./assets/icons/android/icon-192x192.png",
  "./assets/icons/android/icon-512x512.png"
];

self.addEventListener("install", event => { //espera a que se guarden los archivos en el cache antes de finalizar la instalación del Service Worker
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_STATIC_RESOURCES);
    })
  );
});

self.addEventListener("activate", event => { //espera a que se eliminen los caches antiguos antes de finalizar la activación del Service Worker
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

self.addEventListener("fetch", event => { //intenta responder con el recurso cacheado, y si no está, lo busca en la red
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});