const CACHE_NAME = "split-facil-cache-v9";

const APP_STATIC_RESOURCES = [ //los archivos que queremos guardar para que la app cargue offline
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./storage.js",
  "./manifest.json",
  "./service-worker.js",
  "./assets/icons/android/icon-192x192.png",
  "./assets/icons/android/icon-512x512.png",
  "./assets/icons/android/people.png",
  "./assets/icons/android/plus.png",
  "./assets/icons/android/list.png"
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

importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js");

firebase.initializeApp({
  apiKey: "AIzaSyDirok3GW5brio0Vl0pyQclT-TUU8_m4CU",
  authDomain: "split-facil-de5e1.firebaseapp.com",
  projectId: "split-facil-de5e1",
  storageBucket: "split-facil-de5e1.firebasestorage.app",
  messagingSenderId: "408953668792",
  appId: "1:408953668792:web:c0321795768b45d51f204d"
});

const messaging = firebase.messaging();

// Esto se ejecuta cuando llega una notificación y la app está en SEGUNDO PLANO (minimizada o cerrada)
messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: "./assets/icons/android/icon-192x192.png"
  });
});