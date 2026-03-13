// public/firebase-messaging-sw.js
// SERVICE WORKER FCM - Arriere-plan Web / PWA iOS
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

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'Notification Yely';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/favicon.png', 
    badge: '/favicon.png',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});