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
  console.log('beforeinstallprompt fired', event);
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
        swReg.showNotification('Successfully subscribed!', options);
      })
  }
}

var configurePushSubscription = () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  var reg;
  navigator.serviceWorker.ready
    .then((swReg) => {
      reg = swReg;
      return swReg.pushManager.getSubscription();
    })
    .then((sub) => {
      if (sub === null) {
        //Create a new subscription
        var vapidPublickey = 'BDqW4B_UhDaNpgq_XowY3wzeC8A1_yqFuiKIy4rBs-UOorpwee_oyj-CgvrsPYocefXs_rHgLoCuqxEa5aLDp6s';
        var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublickey);
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPublicKey
        });
      } else {
        // We have a subscription
      }
    }).then((sub) => {
      return fetch('https://pwagram-48f41.firebaseio.com/subscription.json', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(sub)
      })
    }).then((res) => {
      if (res.ok) {
        displayConfirmNotification();
      }
    }).catch((err) => {
      console.log(err);
    });
}

var askForPermission = () => {
  Notification.requestPermission((result) => {
    console.log('User choise', result);
    if (result !== 'granted') {
      console.log('Notification persmission denied');
    } else {
      // Hide buttons
      // displayConfirmNotification();
      configurePushSubscription();
    }
  });
}

if ('Notification' in window && 'serviceWorker' in navigator) {
  for (let btn of enableNotifButtons) {
    btn.style.display = 'inline-block';
    btn.addEventListener('click', askForPermission);
  }
}