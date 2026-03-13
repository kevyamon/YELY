// src/hooks/usePushNotifications.web.js
// GESTION FCM WEB - PWA & iOS Safari (Necessite iOS 16.4+ et Add to Home Screen)
// CSCSM Level: Bank Grade

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import ENV from '../config/env';
import { navigate } from '../navigation/navigationRef';
import { useUpdateFcmTokenMutation } from '../store/api/usersApiSlice';
import { selectCurrentUser, selectIsAuthenticated } from '../store/slices/authSlice';

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
  const user = useSelector(selectCurrentUser);
  const [updateFcmToken] = useUpdateFcmTokenMutation();
  const isRegistered = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !messaging || isRegistered.current) return;

    const registerWebPushAsync = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn("[PUSH WEB] Permission refusee par l'utilisateur.");
          return;
        }

        const currentToken = await getToken(messaging, {
          vapidKey: ENV.FIREBASE_VAPID_KEY 
        });

        if (currentToken) {
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
        console.log("[PUSH WEB] Notification recue en premier plan:", payload);
      }
      
      if (Notification.permission === 'granted') {
        const webNotification = new Notification(payload.notification?.title || 'Yely', {
          body: payload.notification?.body,
          icon: '/favicon.png',
          data: payload.data
        });

        // LE MOTEUR DE DEEP LINKING WEB (Aiguillage au clic)
        webNotification.onclick = (event) => {
          event.preventDefault(); 
          webNotification.close();

          const type = payload.data?.type;
          if (!type) return;

          switch (type) {
            case 'NEW_REPORT':
              navigate('AdminReports');
              break;
            case 'REPORT_RESOLVED':
              navigate('Report');
              break;
            case 'NEW_PAYMENT_PROOF':
              navigate('ValidationCenter');
              break;
            case 'SUBSCRIPTION_APPROVED':
            case 'SUBSCRIPTION_REJECTED':
            case 'PROMO_UPDATE':
              navigate('Subscription');
              break;
            case 'NEW_RIDE_REQUEST':
            case 'SEARCH_TIMEOUT':
            case 'NEGOTIATION_TIMEOUT':
            case 'RIDE_CANCELLED':
            case 'DRIVER_FOUND':
            case 'PRICE_PROPOSAL':
            case 'PROPOSAL_ACCEPTED':
            case 'PROPOSAL_REJECTED':
            case 'DRIVER_ARRIVED':
            case 'RIDE_STARTED':
            case 'RIDE_COMPLETED':
              if (user?.role === 'driver') {
                navigate('DriverHome');
              } else if (user?.role === 'rider') {
                navigate('RiderHome');
              }
              break;
            default:
              navigate('Notifications');
              break;
          }
        };
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated, updateFcmToken, user]);
};

export default usePushNotifications;