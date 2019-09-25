self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', event);
  event.waitUntil(caches.open('static').then((cache) => {
    console.log('[Service Worker] Precaching app shell');
    // cache.add('/');
    // cache.add('/index.html');
    // cache.add('/src/js/app.js');
    cache.addAll([
      '/',
      '/index.html',
      '/src/js/app.js',
      '/src/js/feed.js',
      '/src/js/promise.js', // Not necessary because older browsers neither support sw
      '/src/js/fetch.js', // Not necessary because older browsers neither support sw
      '/src/js/material.min.js',
      '/src/css/app.css',
      '/src/css/feed.css',
      '/src/images/main-image.jpg',
      'https://fonts.googleapis.com/css?family=Roboto:400,700',
      'https://fonts.googleapis.com/icon?family=Material+Icons',
      'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
    ])
  })); // Esperamos que esta operación termine antes de seguir
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...', event);
  return self.clients.claim(); // Not necessary. Only makes it more robust
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((res) => {
    if (res) {
      return res;
    } else {
      return fetch(event.request);
    }
  }));
});