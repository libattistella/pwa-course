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

var askForPermission = () => {
  Notification.requestPermission((result) => {
    console.log('User choise', result);
    if (result !== 'granted') {
      console.log('Notification persmission denied');
    } else {
      // Hide buttons
    }
  });
}

if ('Notification' in window) {
  for (let btn of enableNotifButtons) {
    btn.style.display = 'inline-block';
    btn.addEventListener('click', askForPermission);
  }
}