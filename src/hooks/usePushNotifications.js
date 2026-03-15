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

  // ETAT TAMPON : Sauvegarde la destination cliquée le temps que l'app s'initialise
  const [pendingRouting, setPendingRouting] = useState(null);

  // 1. GESTION DU TOKEN (Bloquée si non authentifié)
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

  // 2. INTERCEPTEUR DE CLIC GLOBAL (Ne doit JAMAIS être conditionné par l'authentification)
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(() => {});

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data && data.type) {
        // On capture l'événement immédiatement et on le met en attente
        setPendingRouting(data);
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  // 3. MOTEUR DE ROUTAGE DIFFÉRÉ (S'exécute uniquement quand le routeur est prêt)
  useEffect(() => {
    // On attend que le Redux soit peuplé et qu'il y ait une route en attente
    if (isAuthenticated && user?.role && pendingRouting) {
      
      // On introduit un micro-délai (500ms) pour laisser AppNavigator 
      // détruire le SplashScreen et monter physiquement l'écran DriverHome
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
            // REDIRECTION CORRIGÉE : Transmission du paramètre rideId
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

        // On vide l'état tampon pour ne pas boucler indéfiniment
        setPendingRouting(null); 
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user?.role, pendingRouting]);
};

export default usePushNotifications;