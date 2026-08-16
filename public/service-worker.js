// public/service-worker.js
// SERVICE WORKER ULTRA-ROBUSTE PWA - OFFLINE APP SHELL & RESILIENCE RESEAU
// STANDARD: Bank Grade / Zero Ecran Noir

const CACHE_NAME = 'yely-pwa-v1.6.1';

// Ressources prioritaires du Shell d'application à pré-mettre en cache
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/splash-center.png'
];

// ─── 1. INSTALLATION & PRE-CACHING DU SHELL ──────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_RESOURCES).catch((err) => {
        console.warn('[SW] Pré-cache partiel ignoré:', err);
      });
    })
  );
});

// ─── GESTION DES MESSAGES DU CLIENT (SKIP_WAITING) ───────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'SKIP_WAITING' || event.data === 'skipWaiting')) {
    self.skipWaiting();
  }
});

// ─── 2. ACTIVATION & NETTOYAGE DES ANCIENS CACHES ────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('yely-pwa-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ─── 3. STRATÉGIE DE REQUÊTES INTELLIGENTE ──────────────────────────────────
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET ou extensions de navigateur
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // A. BYPASS RÉSEAU STRICT (Network-Only) : API, WebSocket, Auth & Services Tiers
  // Garantit que toutes les données temps réel sont TOUJOURS fraîches sans mise en cache
  const isApiOrBackend = 
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('onrender.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('socket.io') ||
    url.hostname.includes('cloudinary.com') ||
    url.hostname.includes('accounts.google.com');

  if (isApiOrBackend) {
    // Laisser passer directement au réseau sans toucher au cache
    return;
  }

  // B. NAVIGATION HTML (Network-First avec Fallback Cache immédiat pour SPA)
  if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          return fallback || new Response('Offline', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // C. ASSETS STATIQUES (JS Bundles, CSS, Images, Fonts) - Stale-While-Revalidate
  // L'application se lance instantanément depuis le cache en <10ms tout en se rafraîchissant en arrière-plan
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // Si réseau absent et pas dans le cache, le catch évite un crash
          return null;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// ─── 4. GESTION DES NOTIFICATIONS PUSH D'ARRIÈRE-PLAN (FCM) ───────────────────
try {
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
} catch (fcmError) {
  console.warn('[SW FCM] Initialisation FCM en arrière-plan ignorée en mode hors-ligne:', fcmError);
}
