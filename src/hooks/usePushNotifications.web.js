// src/hooks/usePushNotifications.web.js
// GESTION FCM WEB - PWA & iOS Safari (Necessite iOS 16.4+ et Add to Home Screen)
// CSCSM Level: Bank Grade

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import ENV from '../config/env';
import { useUpdateFcmTokenMutation } from '../store/api/usersApiSlice';
import { selectIsAuthenticated } from '../store/slices/authSlice';

// Initialisation de l'instance Firebase Web (utilise tes variables d'environnement)
const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN,
  projectId: ENV.FIREBASE_PROJECT_ID,
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
let messaging;

try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn("[PUSH WEB] API Messaging non supportee sur ce navigateur (ex: navigation privee stricte).");
}

const usePushNotifications = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [updateFcmToken] = useUpdateFcmTokenMutation();
  const isRegistered = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !messaging || isRegistered.current) return;

    const registerWebPushAsync = async () => {
      try {
        // 1. Demande l'autorisation native du navigateur
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn("[PUSH WEB] Permission refusee par l'utilisateur.");
          return;
        }

        // 2. Recuperation du token via le VAPID Key (a ajouter dans ton env)
        const currentToken = await getToken(messaging, {
          vapidKey: ENV.FIREBASE_VAPID_KEY 
        });

        if (currentToken) {
          // 3. Envoi du token au backend via la mutation propre RTK Query
          await updateFcmToken({ fcmToken: currentToken }).unwrap();
          isRegistered.current = true;
        } else {
          console.warn("[PUSH WEB] Aucun token d'enregistrement disponible. Autorisez les notifications.");
        }
      } catch (error) {
        console.warn("[PUSH WEB] Erreur lors de l'enregistrement Web Push:", error);
      }
    };

    registerWebPushAsync();

    // ECOUTEUR : L'application web est OUVERTE (Foreground)
    const unsubscribe = onMessage(messaging, (payload) => {
      if (__DEV__) {
        console.log("[PUSH WEB] Notification recu en premier plan:", payload);
      }
      
      // En Web, si la page est ouverte, la notification systeme n'apparait pas automatiquement.
      // Nous forcons son affichage visuel via l'API native du navigateur :
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'Yely', {
          body: payload.notification?.body,
          icon: '/favicon.png'
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated, updateFcmToken]);
};

export default usePushNotifications;