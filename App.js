import * as Sentry from '@sentry/react-native';
import * as NativeSplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';

NativeSplashScreen.preventAutoHideAsync().catch(() => {});

import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Appearance, Platform, StyleSheet, Text, TouchableOpacity, View, useColorScheme, ActivityIndicator } from 'react-native';
import * as SystemUI from 'expo-system-ui';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider, Portal } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Provider as ReduxProvider, useDispatch, useSelector } from 'react-redux';

import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import store from './src/store/store';
import THEME, { updateThemeColors } from './src/theme/theme';

import AppToast from './src/components/ui/AppToast';
import FacebookFollowModal from './src/components/ui/FacebookFollowModal';
import ForceUpdateModal from './src/components/ui/ForceUpdateModal';
import GlobalSkeleton from './src/components/ui/GlobalSkeleton';
import PwaIOSInstallGuide from './src/components/ui/PwaIOSInstallGuide';
import SessionRecoveryOverlay from './src/components/ui/SessionRecoveryOverlay';
import ThemeChangeModal from './src/components/ui/ThemeChangeModal';

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

const customNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: THEME.COLORS.background,
    card: THEME.COLORS.background,
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

  const toast = useSelector(selectToast);
  const loading = useSelector(selectLoading);
  const appUpdate = useSelector(selectAppUpdate);

  useAppStartup();
  useSocketEvents();
  usePushNotifications();
  usePwaAutoUpdate(); 

  return (
    <>
      <NavigationContainer ref={navigationRef} linking={linking} theme={customNavigationTheme} documentTitle={{ formatter: () => 'Yely' }}>
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

const App = () => {
  const [themeChanged, setThemeChanged] = useState(false);
  const [isDownloadingOta, setIsDownloadingOta] = useState(false);
  const initialTheme = useRef(Appearance.getColorScheme());
  const colorScheme = useColorScheme();

  // Mettre à jour dynamiquement les couleurs du thème au démarrage et à chaque changement de thème système
  useEffect(() => {
    updateThemeColors(colorScheme);
    if (Platform.OS !== 'web') {
      SystemUI.setBackgroundColorAsync(colorScheme === 'dark' ? '#000000' : '#F8F9FA').catch(() => {});
    }
  }, [colorScheme]);

  useEffect(() => {
    const initApp = async () => {
      // 🚀 MISE A JOUR OTA SYSTEM - ULTRA-FLUIDE
      if (Platform.OS !== 'web') {
        try {
          // Si la vérification réseau prend plus de 2.2s, on démarre direct pour éviter l'attente
          const checkPromise = Updates.checkForUpdateAsync();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('TIMEOUT')), 2200)
          );
          
          const update = await Promise.race([checkPromise, timeoutPromise]);
          
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
    const subscription = Appearance.addChangeListener(async (preferences) => {
      updateThemeColors(preferences.colorScheme);
      if (Platform.OS !== 'web') {
        await SystemUI.setBackgroundColorAsync(preferences.colorScheme === 'dark' ? '#000000' : '#F8F9FA').catch(() => {});
      }
      if (preferences.colorScheme !== initialTheme.current) {
        try {
          // On s'assure que le fond natif est noir pour éviter le flash blanc au reload lors du changement de thème
          if (Platform.OS !== 'web') {
            await SystemUI.setBackgroundColorAsync(preferences.colorScheme === 'dark' ? '#000000' : '#F8F9FA').catch(() => {});
          }
          await Updates.reloadAsync();
        } catch (error) {
          setThemeChanged(true);
        }
      }
    });
    return () => subscription.remove();
  }, []);

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