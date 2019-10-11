importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC_NAME = 'static-v8';
var CACHE_DYNAMIC_NAME = 'dynamic-v3';
var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/idb.js',
  '/src/js/promise.js', // Not necessary because older browsers neither support sw
  '/src/js/fetch.js', // Not necessary because older browsers neither support sw
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', event);
  event.waitUntil(caches.open(CACHE_STATIC_NAME)
    .then((cache) => {
      console.log('[Service Worker] Precaching app shell');
      // Put send the request and store data when the response is back
      cache.addAll(STATIC_FILES);
    })
  ); // Esperamos que esta operación termine antes de seguir
});

// Sólo se activará cuando el usuario cierre todas las pestañas vinculadas a la app y la abra de nuevo
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...', event);
  // Limpiamos las caches
  event.waitUntil(caches.keys().then((keyList) => {
    return Promise.all(keyList.map((key) => {
      if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
        console.log('[Service Worker] Removing old cache...', key);
        return caches.delete(key);
      }
    }));
  }));
  return self.clients.claim(); // Not necessary. Only makes it more robust
});

// First cache, then network
self.addEventListener('fetch', (event) => {
  var url = 'https://pwagram-48f41.firebaseio.com/posts.json';

  if (event.request.url.indexOf(url) > -1) {
    // "Cache then network". Buscamos en la red, y guardamos en la cache
    event.respondWith(fetch(event.request)
      .then((res) => {
        var cloned = res.clone();
        clearAllData('posts')
          .then(() => {
            return cloned.json()
          })
          .then((data) => {
            for (var key in data) {
              writeData('posts', data[key]);
            }
          });
        return res;
      })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    // "Cache only" strategy for static files.
    // Debemos asegurarnos de actualizar la versión de la caché si actualizamos algunos de estos archivos. Es opcional.
    event.respondWith(caches.match(event.request));
  } else {
    // "Cache with network fallback" strategy
    event.respondWith(caches.match(event.request)
      .then((res) => {
        if (res) {
          return res;
        } else {
          return fetch(event.request)
            .then((res) => {
              return caches.open(CACHE_DYNAMIC_NAME)
                .then((cache) => {
                  // trimCache(CACHE_DYNAMIC_NAME, 10);
                  // Put method, only store data, I must provide the request and the response
                  cache.put(event.request.url, res.clone());
                  return res;
                });
            })
            .catch((err) => {
              return caches.open(CACHE_STATIC_NAME)
                .then((cache) => {
                  if (event.request.headers.get('accept').includes('text/html')) {
                    return cache.match('/offline.html');
                  }
                })
            });
        }
      })
    );
  }
});

// First cache, if not cache, then network
// self.addEventListener('fetch', (event) => {
//   event.respondWith(caches.match(event.request)
//     .then((res) => {
//       if (res) {
//         return res;
//       } else {
//         return fetch(event.request)
//           .then((res) => {
//             return caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
//               // Put only store data, I must provide the request and the response
//               cache.put(event.request.url, res.clone());
//               return res;
//             });
//           })
//           .catch((err) => {
//             return caches.open(CACHE_STATIC_NAME).then((cache) => {
//               return cache.match('/offline.html');
//             })
//           });
//       }
//     })
//   );
// });

// First network, if it fails, then cache
// self.addEventListener('fetch', (event) => {
//   event.respondWith(fetch(event.request)
//     .then((res) => {
//       return caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
//         // Put only store data, I must provide the request and the response
//         cache.put(event.request.url, res.clone());
//         return res;
//       });
//     })
//     .catch((err) => {
//       return caches.match(event.request);
//     })
//   );
// });

// Cache only
// self.addEventListener('fetch', (event) => {
//   event.respondWith(caches.match(event.request))
// });

// Network only
// self.addEventListener('fetch', (event) => {
//   event.respondWith(fetch(event.request))
// });

function isInArray(url, arr) {
  arr.forEach((elem) => {
    if (elem === url) {
      return true;
    }
  });
  return false;
}

// function trimCache(cacheName, maxItems) {
//   caches.open(cacheName)
//     .then((cache) => {
//       return cache.keys()
//         .then((keys) => {
//           if (keys.length > maxItems) {
//             // Delete de oldest one
//             cache.delete(keys[0])
//               .then(trimCache(cacheName, maxItems));
//           }
//         });
//     });
// }

self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Syncing', event);
  if (event.tag === 'sync-new-posts') {
    console.log('[Service Worker] Syncing new post');
    event.waitUntil(
      readAllData('sync-posts')
        .then((data) => {
          for (var dt of data) {
            fetch('https://us-central1-pwagram-48f41.cloudfunctions.net/storePostData', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                id: dt.id,
                title: dt.title,
                location: dt.location,
                image: 'https://picsum.photos/id/577/536/354'
              })
            }).then((res) => {
              console.log('Data sent!', res);
              if (res.ok) {
                res.json()
                  .then((resData) => {
                    deleteItemFromData('sync-posts', resData.id)
                      .then(() => {
                        console.log('Item deleted');
                      });
                  })
              }
            }).catch((err) => {
              console.log(err);
            });
          }
        })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  var notification = event.notification;
  var action = event.action;

  console.log(notification);
  if (action === 'confirm') {
    console.log('Confirm was chosen');
  } else {
    console.log(action);
    event.waitUntil(
      clients.matchAll()
        .then((clients) => {
          var client= clients.find((c) => {
            return c.visibilityState === 'visible';
          });
          if (client !== undefined) {
            client.navigate(notification.data.url);
            client.focus();
          } else {
            clients.openWindow(notification.data.url);
          }
          notification.close();
        })
    );
  }
});

self.addEventListener('notificationclose', (event) => {
  var notification = event.notification;
  var action = event.action;

  console.log('Confirm was closed', event);
  console.log('Notification', notification);
  if (action === 'confirm') {
    console.log('Confirm was chosen');
  } else {
    console.log(action);
  }
  notification.close();
});

self.addEventListener('push', (event) => {
  console.log('Push notification was received', event);
  var data = {
    title: 'New',
    content: 'Something new happened',
    openUrl: '/'
  };
  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  var options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    vibrate: [100, 50, 200],
    badge: '/src/images/icons/app-icon-96x96.png',
    tag: 'push-notification',
    data: {
      url: data.openUrl
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
});
