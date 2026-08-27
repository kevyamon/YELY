// public/firebase-messaging-sw.js
// SERVICE WORKER FCM - Arrière-plan Web / PWA (Réception & Clic)
// CSCSM Level: Bank Grade

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCwMPVImCUPa3cfESlT5S2sb_-qS_aG9ao",
  authDomain: "yely-27b1f.firebaseapp.com",
  projectId: "yely-27b1f",
  storageBucket: "yely-27b1f.firebasestorage.app",
  messagingSenderId: "874118617681",
  appId: "1:874118617681:web:09af9772397c3de0377670"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 1. Réception en arrière-plan (Application fermée ou onglet inactif)
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Yély';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Nouvelle notification Yély',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    tag: payload.data?.notificationId || 'yely-notification',
    renotify: true,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 2. Gestion du clic sur la notification dans le navigateur
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si un onglet Yély est déjà ouvert, on lui redonne le focus
      for (let client of windowClients) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon, on ouvre une nouvelle fenêtre de l'application
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});