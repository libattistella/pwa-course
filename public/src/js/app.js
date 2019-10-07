var deferredPrompt;
var enableNotifButtons = document.querySelectorAll('.enable-notifications');

// Si mi navegador no soporta promesas, uso polyfills
if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => {
      console.log('ServiceWorker registered');
    })
    .catch();
}

window.addEventListener('beforeinstallprompt', (event) => {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

var displayConfirmNotification = () => {
  if ('serviceWorker' in navigator) {
    var options = {
      body: 'You successfully subscribed to our Notification service',
      icon: '/src/images/icons/app-icon-96x96.png',
      image: '/src/images/sf-boat.jpg',
      dir: 'ltr', // Default
      lang: 'en-US',
      vibrate: [100, 50, 200],
      badge: '/src/images/icons/app-icon-96x96.png',
      tag: 'confirm-notification',
      renotify: true,
      actions: [
        { action: 'confirm', title: 'OK', icon: '/src/images/icons/app-icon-96x96.png' },
        { action: 'cancel', title: 'CANCEL', icon: '/src/images/icons/app-icon-96x96.png' }
      ]
    };
    navigator.serviceWorker.ready
      .then((swReg) => {
        swReg.showNotification('Successfully subscribed! (from SW)', options);
      })
  }
}

var askForPermission = () => {
  Notification.requestPermission((result) => {
    console.log('User choise', result);
    if (result !== 'granted') {
      console.log('Notification persmission denied');
    } else {
      // Hide buttons
      displayConfirmNotification();
    }
  });
}

if ('Notification' in window) {
  for (let btn of enableNotifButtons) {
    btn.style.display = 'inline-block';
    btn.addEventListener('click', askForPermission);
  }
}