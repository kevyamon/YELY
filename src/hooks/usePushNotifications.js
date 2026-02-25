// src/hooks/usePushNotifications.js
// GESTION FCM - Enregistrement et synchronisation du token Push
// CSCSM Level: Bank Grade

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectToken } from '../store/slices/authSlice';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const usePushNotifications = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authToken = useSelector(selectToken);

  useEffect(() => {
    if (!isAuthenticated || !authToken) return;

    const registerForPushNotificationsAsync = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('yely_rides', {
          name: 'Yely Courses',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D4AF37', // Champagne Gold
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
          console.warn('[PUSH] Permission refusée par l\'utilisateur.');
          return;
        }

        try {
          // Obtention du Token FCM Brut pour Firebase Admin (Backend)
          const tokenData = await Notifications.getDevicePushTokenAsync();
          const fcmToken = tokenData.data;

          // Envoi au backend (Utilisation de fetch pur pour éviter une dépendance RTK Query circulaire)
          const API_URL = process.env.EXPO_PUBLIC_API_URL || '';
          await fetch(`${API_URL}/auth/fcm-token`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ fcmToken })
          });
          
        } catch (error) {
          console.warn('[PUSH] Erreur lors de la récupération/envoi du token:', error);
        }
      }
    };

    registerForPushNotificationsAsync();
  }, [isAuthenticated, authToken]);
};

export default usePushNotifications;