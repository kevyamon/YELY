// src/hooks/usePushNotifications.web.js
// GESTION FCM WEB / PWA - Enregistrement Service Worker, Synchronisation et Aiguillage
// CSCSM Level: Bank Grade

import Constants from 'expo-constants';
import { getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { navigate } from '../navigation/navigationRef';
import { useUpdateFcmTokenMutation } from '../store/api/usersApiSlice';
import { selectCurrentUser, selectIsAuthenticated, updateSubscriptionStatus } from '../store/slices/authSlice';
import { setAppUpdate, showToast } from '../store/slices/uiSlice';

const firebaseConfig = {
  apiKey: "AIzaSyCwMPVImCUPa3cfESlT5S2sb_-qS_aG9ao",
  authDomain: "yely-27b1f.firebaseapp.com",
  projectId: "yely-27b1f",
  storageBucket: "yely-27b1f.firebasestorage.app",
  messagingSenderId: "874118617681",
  appId: "1:874118617681:web:09af9772397c3de0377670"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

const isVersionOutdated = (current, latest) => {
  if (!current || !latest) return false;
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);
  
  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const c = currentParts[i] || 0;
    const l = latestParts[i] || 0;
    if (l > c) return true; 
    if (c > l) return false; 
  }
  return false; 
};

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
          console.warn('[WEB PUSH] Les notifications Push ne sont pas supportées par ce navigateur.');
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('[WEB PUSH] Permission de notification refusée par l\'utilisateur.');
          return;
        }

        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const messaging = getMessaging(app);

        const currentToken = await getToken(messaging, {
          serviceWorkerRegistration: registration,
        });

        if (currentToken) {
          console.log('[WEB PUSH] Token FCM Web généré avec succès');
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
        console.warn('[WEB PUSH] Erreur enregistrement FCM Web :', error);
      }
    };

    registerWebPush();
  }, [isAuthenticated, updateFcmToken, dispatch]);

  useEffect(() => {
    if (isAuthenticated && user?.role && pendingRouting) {
      const timer = setTimeout(() => {
        const { type, rideId, latestVersion, mandatoryUpdate, updateUrl, isOta, reason, reportId, notificationId } = pendingRouting;
        const currentRole = user.role;
        const currentAppVersion = Constants.expoConfig?.version || '1.2.0';

        switch (type) {
          case 'SYSTEM_UPDATE':
            dispatch(setAppUpdate({
              isAvailable: isVersionOutdated(currentAppVersion, latestVersion),
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
              
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.location.href = finalUrl;
              } else {
                Linking.canOpenURL(finalUrl).then(supported => {
                  if (supported) {
                    Linking.openURL(finalUrl);
                  }
                }).catch(() => {});
              }
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
          default:
            navigate('Notifications');
            break;
        }

        setPendingRouting(null); 
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user?.role, pendingRouting, dispatch]);
};

export default usePushNotifications;