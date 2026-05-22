import * as Sentry from '@sentry/react-native';
import * as NativeSplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { applyThemeUpdate } from './src/theme/themeEngine';

NativeSplashScreen.preventAutoHideAsync().catch(() => {});

import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useMemo } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, useColorScheme, ActivityIndicator, Appearance, AppState } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import * as NavigationBar from 'expo-navigation-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider, Portal } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Provider as ReduxProvider, useDispatch, useSelector } from 'react-redux';

import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import store from './src/store/store';
import THEME from './src/theme/theme';

import AppToast from './src/components/ui/AppToast';
import FacebookFollowModal from './src/components/ui/FacebookFollowModal';
import ForceUpdateModal from './src/components/ui/ForceUpdateModal';
import GlobalSkeleton from './src/components/ui/GlobalSkeleton';
import PwaIOSInstallGuide from './src/components/ui/PwaIOSInstallGuide';
import SessionRecoveryOverlay from './src/components/ui/SessionRecoveryOverlay';

import useAppStartup from './src/hooks/useAppStartup';
import usePushNotifications from './src/hooks/usePushNotifications';
import usePwaAutoUpdate from './src/hooks/usePwaAutoUpdate';
import useSocketEvents from './src/hooks/useSocketEvents';

import { hideToast, selectAppUpdate, selectLoading, selectToast } from './src/store/slices/uiSlice';

import './src/tasks/backgroundLocationTask';

const linking = {
  prefixes: [
    'http://localhost:19006',
    'https://yely-backend-production-ac7b.up.railway.app',
    'https://yely.io',
    'yely://',
  ],
  config: {
    screens: {
      Home: 'home',
      RiderHome: 'rider-home',
      DriverHome: 'driver-home',
      SellerHome: 'seller-home',
      MarketplaceHub: 'marketplace',
      ProductList: 'products',
      ProductDetails: 'product/:productId',
      SellerProfile: 'seller/:sellerId',
      Cart: 'cart',
      Checkout: 'checkout',
      OrderTracking: 'order-tracking/:orderId',
      ClientOrders: 'client-orders',
      SellerDashboard: 'seller-dashboard',
      SellerOrders: 'seller-orders',
      ManageProducts: 'manage-products',
      LedgerHistory: 'ledger-history',
      Profile: 'profile',
      Menu: 'menu',
      Pancarte: 'pancarte',
      History: 'history',
      Report: 'report',
      Notifications: 'notifications',
      Subscription: 'subscription',
      WaitSubscription: 'wait-subscription',
      PaymentFailure: 'payment-failure',
      Landing: 'landing',
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
      PrivacyPolicy: 'privacy-policy',
      TermsOfService: 'terms-of-service',
      AdminDashboard: 'admin-dashboard',
      ValidationCenter: 'validation-center',
      UsersManagement: 'users-management',
      AdminRides: 'admin-rides',
      AdminMarketplace: 'admin-marketplace',
      FinanceConfig: 'finance-config',
      SystemConfig: 'system-config',
      AdminJournal: 'admin-journal',
      AdminReports: 'admin-reports',
      MapManagement: 'map-management',
    },
  },
};

const GlobalErrorFallback = ({ error, resetError }) => (
  <SafeAreaView style={styles.fallbackContainer}>
    <Text style={styles.fallbackTitle}>Oups ! Erreur inattendue</Text>
    <Text style={styles.fallbackText}>
      L'application a rencontre un probleme. Nos equipes techniques ont ete automatiquement alertees.
    </Text>
    <TouchableOpacity onPress={resetError} style={styles.fallbackButton}>
      <Text style={styles.fallbackButtonText}>Redemarrer Yely</Text>
    </TouchableOpacity>
  </SafeAreaView>
);

const AppContent = () => {
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();

  const toast = useSelector(selectToast);
  const loading = useSelector(selectLoading);
  const appUpdate = useSelector(selectAppUpdate);

  const navigationTheme = useMemo(() => ({
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colorScheme === 'dark' ? '#000000' : '#F8F9FA',
      card: colorScheme === 'dark' ? '#000000' : '#F8F9FA',
      text: colorScheme === 'dark' ? '#F8F9FA' : '#1A1A1A',
      border: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    },
  }), [colorScheme]);

  useAppStartup();
  useSocketEvents();
  usePushNotifications();
  usePwaAutoUpdate(); 

  const handleNavigationReady = async () => {
    try {
      const savedRouteStr = await AsyncStorage.getItem('theme_reload_route');
      if (savedRouteStr) {
        await AsyncStorage.removeItem('theme_reload_route');
        const savedRoute = JSON.parse(savedRouteStr);
        if (savedRoute && savedRoute.name) {
          setTimeout(() => {
            navigationRef.current?.navigate(savedRoute.name, savedRoute.params);
          }, 50);
        }
      }
    } catch (error) {
      console.warn("[Theme Route Recovery] Failed:", error.message);
    }
  };

  return (
    <>
      <NavigationContainer 
        ref={navigationRef} 
        linking={linking} 
        theme={navigationTheme} 
        documentTitle={{ formatter: () => 'Yely' }}
        onReady={handleNavigationReady}
      >
        <View style={styles.container}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor="transparent" translucent={true} />
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
        <SessionRecoveryOverlay />
        <ForceUpdateModal 
          visible={appUpdate.isAvailable}
          latestVersion={appUpdate.latestVersion}
          mandatoryUpdate={appUpdate.mandatoryUpdate}
          updateUrl={appUpdate.updateUrl}
          isOta={appUpdate.isOta} 
        />
        <FacebookFollowModal />
        <PwaIOSInstallGuide />
      </Portal>
    </>
  );
};

const OtaDownloadScreen = () => (
  <View style={styles.otaContainer}>
    <Text style={styles.otaTitle}>Mise à jour en cours</Text>
    <ActivityIndicator size="large" color="#D4AF37" style={styles.otaSpinner} />
    <Text style={styles.otaSubtitle}>Yely se refait une beauté. Veuillez patienter quelques instants...</Text>
  </View>
);

const triggerBackgroundOtaCheck = async () => {
  if (Platform.OS === 'web') return;
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      // Téléchargement silencieux en tâche de fond pour le prochain démarrage
      await Updates.fetchUpdateAsync();
      console.info("[OTA Background] Nouvelle mise à jour téléchargée avec succès pour le prochain démarrage.");
    }
  } catch (error) {
    console.warn("[OTA Background Check] Échec silencieux:", error.message);
  }
};

const App = () => {
  const [isDownloadingOta, setIsDownloadingOta] = useState(false);
  const colorScheme = useColorScheme();

  // Mettre à jour synchrone le thème et toutes les feuilles de style au rendu
  applyThemeUpdate(colorScheme);

  // Mettre à jour dynamiquement les couleurs du système (StatusBar, NavigationBar, SystemUI)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      SystemUI.setBackgroundColorAsync(colorScheme === 'dark' ? '#000000' : '#F8F9FA').catch(() => {});
      
      const navBarColor = colorScheme === 'dark' ? '#000000' : '#F8F9FA';
      const navBarStyle = colorScheme === 'dark' ? 'light' : 'dark';
      NavigationBar.setBackgroundColorAsync(navBarColor).catch(() => {});
      NavigationBar.setButtonStyleAsync(navBarStyle).catch(() => {});
    }
  }, [colorScheme]);

  useEffect(() => {
    const initApp = async () => {
      // 🚀 MISE A JOUR OTA SYSTEM - ULTRA-FLUIDE
      if (Platform.OS !== 'web') {
        try {
          // Si le démarrage est un simple reload de changement de thème, on démarre instantanément sans requêtes réseau
          const isThemeReload = await AsyncStorage.getItem('theme_reload');
          if (isThemeReload === 'true') {
            await AsyncStorage.removeItem('theme_reload');
            await NativeSplashScreen.hideAsync();
            return;
          }

          // Cooldown de 6 heures sur la vérification OTA bloquante au boot
          const lastOtaCheckStr = await AsyncStorage.getItem('last_ota_check');
          const lastOtaCheck = lastOtaCheckStr ? Number(lastOtaCheckStr) : 0;
          const timeSinceLastCheck = Date.now() - lastOtaCheck;

          if (timeSinceLastCheck < 6 * 60 * 60 * 1000) {
            // Moins de 6 heures se sont écoulées, on démarre instantanément
            await NativeSplashScreen.hideAsync();
            
            // Lancement de la vérification et du téléchargement OTA en tâche de fond
            triggerBackgroundOtaCheck();
            return;
          }

          // Si la vérification réseau prend plus de 2.2s, on démarre direct pour éviter l'attente
          const checkPromise = Updates.checkForUpdateAsync();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('TIMEOUT')), 2200)
          );
          
          const update = await Promise.race([checkPromise, timeoutPromise]);
          
          // Sauvegarde de la date de la dernière vérification réussie
          await AsyncStorage.setItem('last_ota_check', String(Date.now()));

          if (update.isAvailable) {
            // Une mise à jour est disponible ! On affiche l'écran de chargement haut de gamme
            setIsDownloadingOta(true);
            await NativeSplashScreen.hideAsync();
            
            // Téléchargement du nouveau bundle
            await Updates.fetchUpdateAsync();
            
            // On s'assure que le fond natif est noir pour éviter le flash blanc au reload
            await SystemUI.setBackgroundColorAsync('#000000').catch(() => {});
            await Updates.reloadAsync();
            return;
          }
        } catch (error) {
          console.warn("[OTA Startup Check] Pas d'OTA ou verification ignoree:", error.message);
        }
      }

      // Démarrage instantané en masquant le splash natif
      await NativeSplashScreen.hideAsync();
    };
    initApp();
  }, []);

  useEffect(() => {
    let lastTheme = colorScheme;

    const handleThemeChange = async (newTheme) => {
      try {
        if (navigationRef.current) {
          const currentRoute = navigationRef.current.getCurrentRoute();
          if (currentRoute && currentRoute.name) {
            await AsyncStorage.setItem('theme_reload_route', JSON.stringify({
              name: currentRoute.name,
              params: currentRoute.params,
            }));
          }
        }
      } catch (e) {
        console.warn("[Theme Save Route] Failed:", e.message);
      }

      try {
        if (Platform.OS === 'web') {
          window.location.reload();
        } else {
          await AsyncStorage.setItem('theme_reload', 'true');
          await SystemUI.setBackgroundColorAsync(newTheme === 'dark' ? '#000000' : '#F8F9FA').catch(() => {});
          await Updates.reloadAsync();
        }
      } catch (e) {
        console.warn("[Theme Reload Action] Failed:", e.message);
      }
    };
    
    // Vérification de changement de thème au retour au premier plan (Foreground)
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === 'active') {
        const currentTheme = Appearance.getColorScheme();
        if (currentTheme !== lastTheme) {
          lastTheme = currentTheme;
          await handleThemeChange(currentTheme);
        }
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    // Écouteur de changement de thème en temps réel (quand l'application est active)
    const appearanceSub = Appearance.addChangeListener(async (preferences) => {
      if (preferences.colorScheme !== lastTheme) {
        lastTheme = preferences.colorScheme;
        await handleThemeChange(preferences.colorScheme);
      }
    });

    return () => {
      appStateSub.remove();
      appearanceSub.remove();
    };
  }, [colorScheme]);

  if (isDownloadingOta) {
    return <OtaDownloadScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider store={store}>
        <PaperProvider>
          <SafeAreaProvider>
            <Sentry.ErrorBoundary fallback={GlobalErrorFallback}>
              <AppContent />
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
  fallbackButtonText: { color: THEME.COLORS.background, fontWeight: 'bold', fontSize: 16 },
  otaContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  otaTitle: {
    color: '#D4AF37',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  otaSpinner: {
    marginVertical: 30,
  },
  otaSubtitle: {
    color: 'rgba(248, 249, 250, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});