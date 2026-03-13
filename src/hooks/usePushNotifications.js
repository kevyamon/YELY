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

  // 1. GESTION DE L'ENREGISTREMENT (Requiert l'authentification)
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
          // RETOUR AU TOKEN FCM NATIF STRICT
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

  // 2. GESTION DES ECOUTEURS (Independant de l'auth pour le Deep Linking en Cold Start)
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Optionnel : Invalider des tags RTK Query ici si necessaire
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      const type = data.type;

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
    });

    return () => {
      if (notificationListener.current && typeof notificationListener.current.remove === 'function') {
        notificationListener.current.remove();
      }
      if (responseListener.current && typeof responseListener.current.remove === 'function') {
        responseListener.current.remove();
      }
    };
  }, [user]); 
};

export default usePushNotifications;