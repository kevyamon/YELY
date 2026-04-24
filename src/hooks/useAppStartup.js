import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import ENV from '../config/env';
import socketService from '../services/socketService';
import { apiSlice } from '../store/slices/apiSlice';
import {
    forceSilentRefresh,
    selectCurrentUser,
    selectIsAuthenticated,
    selectToken,
    updatePromoMode
} from '../store/slices/authSlice';
import {
    selectToast,
    setAppUpdate,
    showErrorToast,
    showSuccessToast
} from '../store/slices/uiSlice';
import store from '../store/store';

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

const useAppStartup = () => {
  const dispatch = useDispatch();
  const toast = useSelector(selectToast);
  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentAppVersion = Constants.expoConfig?.version || '1.2.0';
  const isSuperAdmin = user?.role === 'superadmin';
  const appState = useRef(AppState.currentState);

  const checkSystemStatus = useCallback(async () => {
    try {
      const apiUrl = ENV.API_URL || process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/health/config`);
      if (response.ok) {
        const payload = await response.json();
        const data = payload.data || payload; 
        dispatch(setAppUpdate({
          isAvailable: isSuperAdmin ? false : isVersionOutdated(currentAppVersion, data.latestVersion),
          latestVersion: data.latestVersion || currentAppVersion,
          mandatoryUpdate: data.mandatoryUpdate,
          updateUrl: data.updateUrl || 'https://download-yely.onrender.com',
          isOta: data.isOta 
        }));
        if (data.hasOwnProperty('isGlobalFreeAccess')) {
          dispatch(updatePromoMode({
            isGlobalFreeAccess: data.isGlobalFreeAccess,
            promoMessage: data.promoMessage
          }));
        }
      }
    } catch (error) {
      console.warn("[APP_INIT] Verification de la configuration echouee:", error);
    }
  }, [dispatch, currentAppVersion, isSuperAdmin]);

  useEffect(() => {
    checkSystemStatus();
  }, [checkSystemStatus]);

  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect(token);
      checkSystemStatus(); 
    } else if (!isAuthenticated) {
      socketService.disconnect();
    }
  }, [isAuthenticated, checkSystemStatus]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        dispatch(forceSilentRefresh()).then(() => {
          const currentToken = store.getState().auth.token;
          if (currentToken) {
            dispatch(apiSlice.util.invalidateTags(['User', 'Subscription', 'SystemConfig', 'MapSettings', 'Stats', 'Ride']));
          }
        });
        checkSystemStatus(); 
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [dispatch, checkSystemStatus]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        dispatch(showErrorToast({
          title: "PAS DE CONNEXION",
          message: "Veuillez activer vos donnees mobiles ou le Wi-Fi."
        }));
      } else if (state.isConnected && toast.visible && toast.title === "PAS DE CONNEXION") {
        dispatch(showSuccessToast({ 
          title: "Connexion retablie", 
          message: "Vous etes de nouveau en ligne." 
        }));
        checkSystemStatus(); 
      }
    });
    return () => unsubscribe();
  }, [dispatch, toast, checkSystemStatus]);
};

export default useAppStartup;