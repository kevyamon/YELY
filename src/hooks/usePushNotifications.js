// src/hooks/usePushNotifications.js
// GESTION FCM - Enregistrement et synchronisation du token Push (Avec Listeners Actifs)
// CSCSM Level: Bank Grade

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { useUpdateFcmTokenMutation } from '../store/api/usersApiSlice';
import { selectIsAuthenticated } from '../store/slices/authSlice';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const usePushNotifications = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [updateFcmToken] = useUpdateFcmTokenMutation();
  
  const notificationListener = useRef();
  const responseListener = useRef();

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
          // Recuperation du token natif Firebase (FCM)
          const tokenData = await Notifications.getDevicePushTokenAsync();
          const fcmToken = tokenData.data;

          if (fcmToken) {
            // Utilisation de l'architecture RTK Query propre
            await updateFcmToken({ fcmToken }).unwrap();
          }
          
        } catch (error) {
          console.warn('[PUSH] Erreur lors de la recuperation/envoi du token:', error);
        }
      }
    };

    registerForPushNotificationsAsync();

    // ECOUTEUR 1 : L'application est OUVERTE et recoit une notification
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      // Tu pourras ajouter ici des dispatch Redux pour rafraichir des listes
      // ex: dispatch(apiSlice.util.invalidateTags(['Ride', 'Report']))
    });

    // ECOUTEUR 2 : L'utilisateur CLIQUE sur la notification (App en arriere-plan ou fermee)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      // Ici, nous pourrons implementer le "Deep Linking" ou la navigation conditionnelle.
      // Par exemple : if (data.type === 'NEW_RIDE_REQUEST') navigate('DriverHome')
      if (__DEV__) {
        console.log('[PUSH] Interaction utilisateur avec la notification. Data:', data);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isAuthenticated, updateFcmToken]);
};

export default usePushNotifications;