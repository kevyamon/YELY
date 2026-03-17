// App.js
// POINT D'ENTREE - Cablage Redux, Providers, Sentry & Intelligence PWA/Update
// STANDARD: Industriel / Bank Grade

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import * as NativeSplashScreen from 'expo-splash-screen';

NativeSplashScreen.preventAutoHideAsync().catch(() => {});

import ENV from './src/config/env';
import './src/tasks/backgroundLocationTask';

import NetInfo from '@react-native-community/netinfo';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Appearance, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Provider as PaperProvider, Portal } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Provider as ReduxProvider, useDispatch, useSelector } from 'react-redux';

import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import store from './src/store/store';
import THEME from './src/theme/theme';

import AppToast from './src/components/ui/AppToast';
import ForceUpdateModal from './src/components/ui/ForceUpdateModal';
import GlobalSkeleton from './src/components/ui/GlobalSkeleton';
import PwaIOSInstallGuide from './src/components/ui/PwaIOSInstallGuide';
import ThemeChangeModal from './src/components/ui/ThemeChangeModal';

import { apiSlice } from './src/store/slices/apiSlice';
import { forceSilentRefresh, updatePromoMode } from './src/store/slices/authSlice';
import { hideToast, selectAppUpdate, selectLoading, selectToast, setAppUpdate, showErrorToast, showSuccessToast } from './src/store/slices/uiSlice';

import usePushNotifications from './src/hooks/usePushNotifications';
import usePwaAutoUpdate from './src/hooks/usePwaAutoUpdate';
import useSocket from './src/hooks/useSocket';
import useSocketEvents from './src/hooks/useSocketEvents';

// FONCTION UTILITAIRE : Comparaison stricte de versions (SemVer)
// Retourne TRUE si "latest" est strictement superieur a "current"
const isVersionOutdated = (current, latest) => {
  if (!current || !latest) return false;
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);
  
  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const c = currentParts[i] || 0;
    const l = latestParts[i] || 0;
    if (l > c) return true; // Le serveur a une version plus recente
    if (c > l) return false; // L'app est plus recente que le serveur (ex: test en dev)
  }
  return false; // Versions identiques
};

const GlobalErrorFallback = ({ error, resetError }) => (
  <SafeAreaView style={styles.fallbackContainer}>
    <Text style={styles.fallbackTitle}>Oups ! Erreur inattendue</Text>
    <Text style={styles.fallbackText}>
      L'application a rencontre un probleme. Nos equipes techniques ont ete automatiquement alertes.
    </Text>
    <TouchableOpacity onPress={resetError} style={styles.fallbackButton}>
      <Text style={styles.fallbackButtonText}>Redemarrer Yely</Text>
    </TouchableOpacity>
  </SafeAreaView>
);

const AppContent = () => {
  const dispatch = useDispatch();
  const toast = useSelector(selectToast);
  const loading = useSelector(selectLoading);
  const appUpdate = useSelector(selectAppUpdate);
  
  const currentAppVersion = Constants.expoConfig?.version || '1.2.0';

  const socket = useSocket();
  const appState = useRef(AppState.currentState);
  
  useSocketEvents();
  usePushNotifications();
  usePwaAutoUpdate(); 

  const checkSystemStatus = useCallback(async () => {
    try {
      const apiUrl = ENV.API_URL || process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/health/config`);
      
      if (response.ok) {
        const data = await response.json();
        
        // CORRECTION : On utilise isVersionOutdated au lieu de !==
        dispatch(setAppUpdate({
          isAvailable: isVersionOutdated(currentAppVersion, data.latestVersion),
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
  }, [dispatch, currentAppVersion]);

  useEffect(() => {
    checkSystemStatus();
  }, [checkSystemStatus]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.info("[APP_LIFECYCLE] Retour au premier plan. Resynchronisation totale...");
        dispatch(forceSilentRefresh()).then(() => {
          dispatch(apiSlice.util.invalidateTags(['User', 'Subscription', 'SystemConfig', 'MapSettings', 'Stats', 'Ride']));
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
      }
    });
    return () => unsubscribe();
  }, [dispatch, toast]);

  useEffect(() => {
    if (socket) {
      socket.on('APP_VERSION_UPDATED', (data) => {
        dispatch(setAppUpdate({
          isAvailable: isVersionOutdated(currentAppVersion, data.latestVersion),
          latestVersion: data.latestVersion,
          mandatoryUpdate: data.mandatoryUpdate,
          updateUrl: data.updateUrl,
          isOta: data.isOta 
        }));
      });
    }
    return () => {
      if (socket) socket.off('APP_VERSION_UPDATED');
    };
  }, [socket, currentAppVersion, dispatch]);

  return (
    <>
      <NavigationContainer ref={navigationRef} documentTitle={{ formatter: () => 'Yely' }}>
        <View style={styles.container}>
          <StatusBar style="dark" backgroundColor="transparent" translucent={true} />
          <AppNavigator />
        </View>
      </NavigationContainer>

      <Portal>
        <AppToast
          visible={toast.visible}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onHide={() => dispatch(hideToast())}
        />
        
        <GlobalSkeleton visible={loading.visible} fullScreen={true} />
        
        <ForceUpdateModal 
          visible={appUpdate.isAvailable}
          latestVersion={appUpdate.latestVersion}
          mandatoryUpdate={appUpdate.mandatoryUpdate}
          updateUrl={appUpdate.updateUrl}
          isOta={appUpdate.isOta} 
        />

        <PwaIOSInstallGuide />
      </Portal>
    </>
  );
};

const App = () => {
  const [themeChanged, setThemeChanged] = useState(false);
  const initialTheme = useRef(Appearance.getColorScheme());

  useEffect(() => {
    const subscription = Appearance.addChangeListener((preferences) => {
      setThemeChanged(preferences.colorScheme !== initialTheme.current);
    });
    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider store={store}>
        <PaperProvider>
          <SafeAreaProvider>
            <Sentry.ErrorBoundary fallback={GlobalErrorFallback}>
              <AppContent />
              {themeChanged && <ThemeChangeModal />}
            </Sentry.ErrorBoundary>
          </SafeAreaProvider>
        </PaperProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
};

export default Sentry.wrap(App);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  fallbackContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.COLORS.background, padding: 20 },
  fallbackTitle: { color: THEME.COLORS.primary, fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  fallbackText: { color: THEME.COLORS.textPrimary, textAlign: 'center', marginBottom: 30, fontSize: 14 },
  fallbackButton: { backgroundColor: THEME.COLORS.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  fallbackButtonText: { color: THEME.COLORS.background, fontWeight: 'bold', fontSize: 16 }
});