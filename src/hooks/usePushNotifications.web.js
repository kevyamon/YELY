// src/hooks/usePushNotifications.web.js
// GESTION FCM WEB - PWA & iOS Safari (Necessite iOS 16.4+ et Add to Home Screen)
// CSCSM Level: Bank Grade

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useEffect, useRef, useState } from 'react';
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

  // ETAT TAMPON : Capture le clic avant que le routeur ne soit forcement pret
  const [pendingRouting, setPendingRouting] = useState(null);

  // 1. GESTION DU TOKEN ET ECOUTEUR FOREGROUND
  useEffect(() => {
    // Si non authentifie ou messaging inaccessible, on s'arrete
    if (!isAuthenticated || !messaging) return;

    // Evite l'enregistrement multiple si deja fait dans cette session
    if (!isRegistered.current) {
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
          }
        } catch (error) {
          console.warn("[PUSH WEB] Erreur lors de l'enregistrement Web Push:", error);
        }
      };
      registerWebPushAsync();
    }

    // ECOUTEUR : L'application web est OUVERTE (Foreground)
    const unsubscribe = onMessage(messaging, (payload) => {
      if (Notification.permission === 'granted') {
        const webNotification = new Notification(payload.notification?.title || 'Yely', {
          body: payload.notification?.body,
          icon: '/favicon.png',
          data: payload.data
        });

        // Capture du clic
        webNotification.onclick = (event) => {
          event.preventDefault(); 
          webNotification.close();

          const data = payload.data;
          if (data && data.type) {
            // Placement dans l'etat tampon plutot que tentative immediate de navigation
            setPendingRouting(data);
          }
        };
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated, updateFcmToken]); // On a retire 'user' pour eviter de relancer le hook a chaque modif du profil

  // 2. MOTEUR DE ROUTAGE DIFFERE (S'execute uniquement quand Redux et le routeur sont prets)
  useEffect(() => {
    if (isAuthenticated && user?.role && pendingRouting) {
      
      const timer = setTimeout(() => {
        const { type, rideId } = pendingRouting;
        const currentRole = user.role;

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
            // REDIRECTION CORRIGEE : Transmission du parametre rideId
            if (currentRole === 'driver') {
              navigate('DriverHome', { rideId });
            } else if (currentRole === 'rider') {
              navigate('RiderHome', { rideId });
            }
            break;
          default:
            navigate('Notifications');
            break;
        }

        // On vide l'etat tampon
        setPendingRouting(null);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user?.role, pendingRouting]);

};

export default usePushNotifications;