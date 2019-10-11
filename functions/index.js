/* eslint-disable promise/no-nesting */
/* eslint-disable promise/always-return */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({
  origin: true
});
const webPush = require('web-push');

var serviceAccount = require("./pwagram-firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pwagram-48f41.firebaseio.com/'
});

exports.storePostData = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    admin.database().ref('posts').push({
      id: request.body.id,
      title: request.body.title,
      location: request.body.location,
      image: request.body.image
    }).then(() => {
      webPush.setVapidDetails('mailto:libattistella@gmail.com', 
        'BNTzVSsh55EBd86h36gxkDISdWCZPxXRzvhFADsT5cGrGTp3nvByUU8CX3yJOsm6zt7_ieqtw6mXD2Z7a0npMwE',
        'SFIGmuPb-WOIGTvKde23PDvN-wizXbxfWfNKoobyBM0');
      return admin.database().ref('subscriptions').once('value');
    }).then((subs) => {
      subs.forEach((sub) => {
        // var puchConfig = sub.val(); //Es lo mismo
        var pushConfig = {
          endpoint: sub.val().endpoint,
          keys: {
            auth: sub.val().keys.auth,
            p256dh: sub.val().keys.p256dh
          }
        };
        webPush.sendNotification(pushConfig, JSON.stringify({
          title: 'New Post!',
          content: 'New post added',
          openUrl: '/help'
        })).catch((err) => {
          console.log(err);
        });
      })
      response.status(201).json({
        message: 'Data stored!',
        id: request.body.id
      });
    }).catch((err) => {
      response.status(500).json({
        error: err
      });
    });
  });
});
