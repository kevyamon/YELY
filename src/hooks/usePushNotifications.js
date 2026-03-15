// src/hooks/usePushNotifications.js
// GESTION FCM - Enregistrement, Synchronisation et Aiguillage Deep Link
// CSCSM Level: Bank Grade

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
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

  const [pendingRouting, setPendingRouting] = useState(null);

  // 1. GESTION DU TOKEN
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
          if (tokenData && tokenData.data) {
            await updateFcmToken({ fcmToken: tokenData.data }).unwrap();
          }
        } catch (error) {
          console.warn('[PUSH] Erreur Token:', error);
        }
      }
    };

    registerForPushNotificationsAsync();
  }, [isAuthenticated, updateFcmToken]);

  // 2. INTERCEPTEUR DE CLIC GLOBAL (AVEC GESTION DU DEMARRAGE A FROID)
  useEffect(() => {
    const checkColdBootNotification = async () => {
      try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (response?.notification?.request?.content?.data?.type) {
          setPendingRouting(response.notification.request.content.data);
        }
      } catch (error) {
        console.warn('[PUSH] Erreur lecture getLastNotificationResponseAsync', error);
      }
    };

    checkColdBootNotification();

    const notificationListener = Notifications.addNotificationReceivedListener(() => {});

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data && data.type) {
        setPendingRouting(data);
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  // 3. MOTEUR DE ROUTAGE DIFFERE
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
  }, [isAuthenticated, user?.role, pendingRouting]);
};

export default usePushNotifications;