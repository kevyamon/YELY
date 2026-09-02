// App.js
// RACINE DE L'APPLICATION MOBILE & PWA YELY
// STANDARD: Industriel / Bank Grade / NASA Resilience (< 325 lignes, Sans Emojis)

import * as Sentry from '@sentry/react-native';
import * as NativeSplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { applyThemeUpdate } from './src/theme/themeEngine';

if (typeof NativeSplashScreen?.preventAutoHideAsync === 'function') {
  NativeSplashScreen.preventAutoHideAsync().catch(() => {});
}

import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { Component, useEffect, useMemo } from 'react';
import { Platform, StyleSheet, View, useColorScheme, Appearance, AppState, LogBox } from 'react-native';

LogBox.ignoreLogs(['SafeAreaView has been deprecated']);
import * as SystemUI from 'expo-system-ui';
import * as NavigationBar from 'expo-navigation-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider, Portal } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider, useDispatch, useSelector } from 'react-redux';

import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import store from './src/store/store';
import THEME from './src/theme/theme';

import AppToast from './src/components/ui/AppToast';
import FacebookFollowModal from './src/components/ui/FacebookFollowModal';
import UpdateModal from './src/components/ui/UpdateModal';
import MaintenanceOverlay from './src/components/ui/MaintenanceOverlay';
import GlobalSkeleton from './src/components/ui/GlobalSkeleton';
import GlobalErrorFallback from './src/components/ui/GlobalErrorFallback';
import PwaIOSInstallGuide from './src/components/ui/PwaIOSInstallGuide';
import SessionRecoveryOverlay from './src/components/ui/SessionRecoveryOverlay';

import useAppStartup from './src/hooks/useAppStartup';
import useAppUpdates from './src/hooks/useAppUpdates';
import usePushNotifications from './src/hooks/usePushNotifications';
import usePwaAutoUpdate from './src/hooks/usePwaAutoUpdate';
import useSocketEvents from './src/hooks/useSocketEvents';
import { unlockWebAudio } from './src/utils/soundHelper';

import { hideToast, selectLoading, selectToast } from './src/store/slices/uiSlice';
import { logout, selectCurrentUser } from './src/store/slices/authSlice';

import './src/tasks/backgroundLocationTask';

class UniversalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, componentStack: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ componentStack: errorInfo?.componentStack || '' });
    if (typeof Sentry?.captureException === 'function') {
      Sentry.captureException(error);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, componentStack: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <GlobalErrorFallback
          error={this.state.error}
          componentStack={this.state.componentStack}
          resetError={this.handleReset}
        />
      );
    }
    return this.props.children;
  }
}

const linking = {
  prefixes: ['http://localhost:19006', 'https://yely-backend-yzw4.onrender.com', 'https://yely.io', 'yely://'],
  config: {
    screens: {
      Home: 'home', RiderHome: 'rider-home', DriverHome: 'driver-home', SellerHome: 'seller-home',
      MarketplaceHub: 'marketplace', ProductList: 'products', ProductDetails: 'product/:productId',
      SellerProfile: 'store/:sellerId', Cart: 'cart', Checkout: 'checkout', OrderTracking: 'order-tracking/:orderId',
      ClientOrders: 'client-orders', SellerDashboard: 'seller-dashboard', SellerOrders: 'seller-orders',
      ManageProducts: 'manage-products', LedgerHistory: 'ledger-history', Profile: 'profile', Menu: 'menu',
      Pancarte: 'pancarte', History: 'history', Report: 'report', Notifications: 'notifications',
      Subscription: 'subscription', WaitSubscription: 'wait-subscription', PaymentFailure: 'payment-failure',
      Landing: 'landing', Login: 'login', Register: 'register', ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password', PrivacyPolicy: 'privacy-policy', TermsOfService: 'terms-of-service',
      AdminDashboard: 'admin-dashboard', UsersManagement: 'users-management', SubscriptionManagement: 'subscription-management',
      AdminRides: 'admin-rides', AdminMarketplace: 'admin-marketplace', FinanceConfig: 'finance-config',
      SystemConfig: 'system-config', AdminJournal: 'admin-journal', AdminReports: 'admin-reports',
      MapManagement: 'map-management',
    },
  },
};

const AppContent = () => {
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();

  const user = useSelector(selectCurrentUser);
  const toast = useSelector(selectToast);
  const loading = useSelector(selectLoading);

  const isAuthorizedAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  const { updateState, maintenanceState, handleApplyUpdate, handleDismiss, checkStoreUpdates } = useAppUpdates();

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
        if (savedRoute?.name) {
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

        <MaintenanceOverlay
          visible={maintenanceState.isMaintenance && !isAuthorizedAdmin}
          message={maintenanceState.message}
          updateAvailable={maintenanceState.updateAvailable}
          storeUrl={maintenanceState.storeUrl}
          onCheckStatus={checkStoreUpdates}
          onLogout={() => dispatch(logout())}
        />

        <UpdateModal
          visible={updateState.visible && (!maintenanceState.isMaintenance || isAuthorizedAdmin)}
          type={updateState.type}
          title={updateState.title}
          message={updateState.message}
          isForced={updateState.isForced}
          onUpdate={handleApplyUpdate}
          onDismiss={handleDismiss}
        />

        <FacebookFollowModal />
        <PwaIOSInstallGuide />
      </Portal>
    </>
  );
};

const App = () => {
  const colorScheme = useColorScheme();

  applyThemeUpdate(colorScheme);

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
    if (Platform.OS === 'web') {
      unlockWebAudio();
    }
  }, []);

  useEffect(() => {
    const initApp = async () => {
      try {
        const isThemeReload = await AsyncStorage.getItem('theme_reload');
        if (isThemeReload === 'true') {
          await AsyncStorage.removeItem('theme_reload');
        }
      } catch (e) {
      } finally {
        if (typeof NativeSplashScreen?.hideAsync === 'function') {
          await NativeSplashScreen.hideAsync().catch(() => {});
        }
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    let lastTheme = colorScheme;

    const handleThemeChange = async (newTheme) => {
      try {
        if (navigationRef.current) {
          const currentRoute = navigationRef.current.getCurrentRoute();
          if (currentRoute?.name) {
            await AsyncStorage.setItem('theme_reload_route', JSON.stringify({
              name: currentRoute.name,
              params: currentRoute.params,
            }));
            await AsyncStorage.setItem('theme_reload', 'true');
            if (typeof window !== 'undefined') {
              window.location.reload();
            } else {
              Updates.reloadAsync().catch(() => {});
            }
          }
        }
      } catch (error) {
        console.warn("[Theme Change Sync] Failed:", error.message);
      }
    };
    
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider store={store}>
        <PaperProvider>
          <SafeAreaProvider>
            <UniversalErrorBoundary>
              <AppContent />
            </UniversalErrorBoundary>
          </SafeAreaProvider>
        </PaperProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
};

export default Sentry.wrap(App);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
});