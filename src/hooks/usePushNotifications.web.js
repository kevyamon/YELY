// src/hooks/usePushNotifications.web.js
// GESTION FCM WEB / PWA - Enregistrement Service Worker, VAPID Key & Routage
// CSCSM Level: Bank Grade (Strict <= 325 lignes)

import Constants from 'expo-constants';
import { getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { navigate } from '../navigation/navigationRef';
import { useUpdateFcmTokenMutation } from '../store/api/usersApiSlice';
import { selectCurrentUser, selectIsAuthenticated, updateSubscriptionStatus } from '../store/slices/authSlice';
import { setAppUpdate, showToast } from '../store/slices/uiSlice';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCwMPVImCUPa3cfESlT5S2sb_-qS_aG9ao",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "yely-27b1f.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "yely-27b1f",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "yely-27b1f.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "874118617681",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:874118617681:web:09af9772397c3de0377670"
};

const VAPID_KEY = process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY || "BCMkZJ1lOzLkwC62r7P2nCFS2d7ttStRx4eTATE4PN7IMbONF31VBTWXbNwiGAu_S-CKv6wPOfNpfwIVfFmom0s";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

const usePushNotifications = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const [updateFcmToken] = useUpdateFcmTokenMutation();
  const [pendingRouting, setPendingRouting] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;

    const registerWebPush = async () => {
      try {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
          console.warn('[WEB PUSH] Les notifications Push ne sont pas supportées sur ce navigateur.');
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('[WEB PUSH] Permission refusée par l\'utilisateur.');
          return;
        }

        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;

        const messaging = getMessaging(app);

        // Clé VAPID obligatoire pour la génération du Token FCM Web
        const currentToken = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (currentToken) {
          console.log('[WEB PUSH] Token FCM Web généré avec succès.');
          await updateFcmToken({ fcmToken: currentToken }).unwrap();
        }

        // Réception en premier plan (Foreground)
        onMessage(messaging, (payload) => {
          if (payload.notification) {
            dispatch(showToast({
              type: 'info',
              title: payload.notification.title || 'Notification Yély',
              message: payload.notification.body || ''
            }));
          }
          if (payload.data && payload.data.type) {
            setPendingRouting(payload.data);
          }
        });

      } catch (error) {
        console.warn('[WEB PUSH] Erreur enregistrement FCM Web :', error.message);
      }
    };

    registerWebPush();
  }, [isAuthenticated, updateFcmToken, dispatch]);

  // Routage Deep Linking Web
  useEffect(() => {
    if (isAuthenticated && user?.role && pendingRouting) {
      const timer = setTimeout(() => {
        const { type, rideId, orderId, reportId, notificationId, latestVersion, mandatoryUpdate, updateUrl, isOta, reason } = pendingRouting;
        const currentRole = user.role;
        const currentAppVersion = Constants.expoConfig?.version || '1.7';

        switch (type) {
          case 'SYSTEM_UPDATE':
            dispatch(setAppUpdate({
              isAvailable: latestVersion !== currentAppVersion,
              latestVersion: latestVersion,
              mandatoryUpdate: mandatoryUpdate === 'true',
              updateUrl: updateUrl,
              isOta: isOta === 'true'
            }));
            if (updateUrl) {
              let finalUrl = updateUrl.trim();
              if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                finalUrl = `https://${finalUrl}`;
              }
              Linking.openURL(finalUrl).catch(err => console.warn('[PUSH] Erreur redirection:', err));
            }
            break;

          case 'SUBSCRIPTION_REJECTED':
            dispatch(updateSubscriptionStatus({ isPending: false, isRejected: true, rejectionReason: reason || null }));
            break;

          case 'SUBSCRIPTION_APPROVED':
            dispatch(updateSubscriptionStatus({ isPending: false, isRejected: false, isActive: true }));
            break;

          case 'NEW_REPORT':
            navigate('AdminReports');
            break;

          case 'REPORT_RESOLVED':
            navigate('Notifications', { reportId, notificationId });
            break;

          case 'NEW_PAYMENT_PROOF':
            navigate('ValidationCenter');
            break;

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
            if (currentRole === 'driver') {
              navigate('DriverHome', { rideId });
            } else if (currentRole === 'rider') {
              navigate('RiderHome', { rideId });
            }
            break;

          case 'NEW_ORDER':
            navigate('SellerOrders', { orderId });
            break;

          case 'ORDER_UPDATE':
            navigate('OrderTracking', { orderId });
            break;

          default:
            navigate('Notifications');
            break;
        }

        setPendingRouting(null);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user?.role, pendingRouting, dispatch]);
};

export default usePushNotifications;