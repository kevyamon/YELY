// App.js
// POINT D'ENTREE - Cablage Redux, Providers & Observabilite Sentry
// STANDARD: Industriel / Bank Grade

import * as Sentry from '@sentry/react-native';

// Importation declenchant la validation immediate de l'environnement (Fail-Fast)
import ENV from './src/config/env';

// DECLARATION TACHE DE FOND (A executer avant tout rendu React)
import './src/tasks/backgroundLocationTask';

// 1. INITIALISATION DE LA SUPERVISION SILENCIEUSE
Sentry.init({
  dsn: ENV.SENTRY_DSN || '',
  debug: false, 
  tracesSampleRate: __DEV__ ? 1.0 : 0.2, 
  environment: ENV.APP_ENV
});

// 2. SILENCE STRICT DE PRODUCTION
if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = (error, isFatal) => {
    Sentry.captureException(new Error(error));
  };
  console.info = () => {};
  console.debug = () => {};
}

import NetInfo from '@react-native-community/netinfo';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Provider as PaperProvider, Portal } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Provider as ReduxProvider, useDispatch, useSelector } from 'react-redux';

import AppNavigator from './src/navigation/AppNavigator';
import store from './src/store/store';
import THEME from './src/theme/theme';

import AppToast from './src/components/ui/AppToast';
import GlobalSkeleton from './src/components/ui/GlobalSkeleton';
import { hideToast, selectLoading, selectToast, showErrorToast, showSuccessToast } from './src/store/slices/uiSlice';

import usePushNotifications from './src/hooks/usePushNotifications';
import useSocket from './src/hooks/useSocket';
import useSocketEvents from './src/hooks/useSocketEvents';

// 3. COMPOSANT DE REPLI EN CAS DE CRASH FATAL (Evite l'ecran blanc)
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

  useSocket();
  useSocketEvents();
  usePushNotifications();

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

  return (
    <>
      <NavigationContainer>
        <View style={styles.container}>
          <StatusBar
            style="dark"
            backgroundColor="transparent"
            translucent={true}
          />
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
        
        <GlobalSkeleton visible={loading.visible} message={loading.message} />
      </Portal>
    </>
  );
};

const App = () => {
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
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.background,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.background,
    padding: 20,
  },
  fallbackTitle: {
    color: THEME.COLORS.primary,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  fallbackText: {
    color: THEME.COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 14,
  },
  fallbackButton: {
    backgroundColor: THEME.COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: THEME.BORDERS.radius.md,
  },
  fallbackButtonText: {
    color: THEME.COLORS.background,
    fontWeight: 'bold',
    fontSize: 16,
  }
});