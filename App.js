// App.js

import NetInfo from '@react-native-community/netinfo';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

// CORRECTION MOBILE : Import du GestureHandlerRootView
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Provider as PaperProvider, Portal } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider, useDispatch, useSelector } from 'react-redux';

import AppNavigator from './src/navigation/AppNavigator';
import store from './src/store/store';
import { YelyTheme } from './src/theme/theme';

// Toast Global
import AppToast from './src/components/ui/AppToast';
import { hideToast, selectToast, showErrorToast, showSuccessToast } from './src/store/slices/uiSlice';

// Socket.io — Système nerveux temps réel
import useSocket from './src/hooks/useSocket';
import useSocketEvents from './src/hooks/useSocketEvents';

// Composant interne qui a accès au Redux store
const AppContent = () => {
  const dispatch = useDispatch();
  const toast = useSelector(selectToast);

  // Brancher le socket (connexion/déconnexion automatique)
  useSocket();

  // Brancher les événements métier (courses, notifs, GPS, etc.)
  useSocketEvents();

  // 📡 ÉCOUTEUR RÉSEAU GLOBAL
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        dispatch(showErrorToast({
          title: "PAS DE CONNEXION",
          message: "Veuillez activer vos données mobiles ou le Wi-Fi."
        }));
      } else if (state.isConnected && toast.visible && toast.title === "PAS DE CONNEXION") {
        dispatch(showSuccessToast({ 
          title: "Connexion rétablie", 
          message: "Vous êtes de nouveau en ligne." 
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

      {/* Toast global — rendu via Portal au-dessus de tout */}
      <Portal>
        <AppToast
          visible={toast.visible}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onHide={() => dispatch(hideToast())}
        />
      </Portal>
    </>
  );
};

export default function App() {
  return (
    // CORRECTION MOBILE : On englobe TOUTE l'application ici
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider store={store}>
        <PaperProvider theme={YelyTheme}>
          <SafeAreaProvider>
            <AppContent />
          </SafeAreaProvider>
        </PaperProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: YelyTheme.colors.background,
  },
});