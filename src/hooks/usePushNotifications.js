// src/hooks/usePushNotifications.js
// GESTION FCM - Enregistrement, Synchronisation et Aiguillage Deep Link
// CSCSM Level: Bank Grade

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { navigate } from '../navigation/navigationRef';
import { useUpdateFcmTokenMutation } from '../store/api/usersApiSlice';
import { selectCurrentUser, selectIsAuthenticated } from '../store/slices/authSlice';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const usePushNotifications = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const [updateFcmToken] = useUpdateFcmTokenMutation();
  
  const notificationListener = useRef();
  const responseListener = useRef();

  // 1. GESTION DE L'ENREGISTREMENT
  useEffect(() => {
    if (!isAuthenticated) return;

    const registerForPushNotificationsAsync = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('yely_rides', {
          name: 'Yely Courses',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D4AF37',
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.warn('[PUSH] Permission refusee par l\'utilisateur.');
          return;
        }

        try {
          const tokenData = await Notifications.getDevicePushTokenAsync();
          const fcmToken = tokenData.data;

          if (fcmToken) {
            await updateFcmToken({ fcmToken }).unwrap();
          }
        } catch (error) {
          console.warn('[PUSH] Erreur lors de la recuperation/envoi du token:', error);
        }
      }
    };

    registerForPushNotificationsAsync();
  }, [isAuthenticated, updateFcmToken]);

  // 2. GESTION DES ECOUTEURS (Anti-Memory Leak)
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Notification reçue pendant que l'app est ouverte
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      const type = data?.type;

      if (!type) return;

      // On lit le rôle capturé de manière stable
      const currentRole = user?.role;

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
          if (currentRole === 'driver') {
            navigate('DriverHome');
          } else if (currentRole === 'rider') {
            navigate('RiderHome');
          }
          break;
        default:
          navigate('Notifications');
          break;
      }
    });

    return () => {
      if (notificationListener.current && typeof notificationListener.current.remove === 'function') {
        notificationListener.current.remove();
      }
      if (responseListener.current && typeof responseListener.current.remove === 'function') {
        responseListener.current.remove();
      }
    };
  }, [user?.role]); // LA CORRECTION EST ICI : On écoute uniquement le changement de rôle, pas le GPS ou le reste
};

export default usePushNotifications;