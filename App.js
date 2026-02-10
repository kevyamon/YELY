// App.js

import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import 'react-native-gesture-handler';
import { Provider as PaperProvider, Portal } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider, useDispatch, useSelector } from 'react-redux';

import AppNavigator from './src/navigation/AppNavigator';
import store from './src/store/store';
import { YelyTheme } from './src/theme/theme';

// Toast Global
import AppToast from './src/components/ui/AppToast';
import { hideToast, selectToast } from './src/store/slices/uiSlice';

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

  return (
    <>
      <NavigationContainer>
        <View style={styles.container}>
          <StatusBar
            style="light"
            backgroundColor={YelyTheme.colors.background}
            translucent
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
    <ReduxProvider store={store}>
      <PaperProvider theme={YelyTheme}>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </PaperProvider>
    </ReduxProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: YelyTheme.colors.background,
  },
});