// src/hooks/usePushNotifications.web.js
// GESTION FCM - Enregistrement, Synchronisation et Aiguillage Deep Link
// CSCSM Level: Bank Grade

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { navigate } from '../navigation/navigationRef';
import { useUpdateFcmTokenMutation } from '../store/api/usersApiSlice';
import { selectCurrentUser, selectIsAuthenticated, updateSubscriptionStatus } from '../store/slices/authSlice';
import { setAppUpdate } from '../store/slices/uiSlice';

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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const usePushNotifications = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const [updateFcmToken] = useUpdateFcmTokenMutation();

  const [pendingRouting, setPendingRouting] = useState(null);

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
              
              if (Platform.OS === 'web') {
                window.location.href = finalUrl;
              } else {
                Linking.canOpenURL(finalUrl).then(supported => {
                  if (supported) {
                    Linking.openURL(finalUrl);
                  }
                }).catch(err => console.warn('[PUSH] Erreur redirection mise a jour:', err));
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