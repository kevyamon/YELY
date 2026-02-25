// App.js
// POINT D'ENTRÉE - Câblage Redux, Providers & Silence de Production
// CSCSM Level: Bank Grade

// 🛡️ SÉCURITÉ : Silence Radio absolu en Production. 
if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.info = () => {};
  console.debug = () => {};
}

import NetInfo from '@react-native-community/netinfo';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';

import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Provider as PaperProvider, Portal } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider, useDispatch, useSelector } from 'react-redux';

import AppNavigator from './src/navigation/AppNavigator';
import store from './src/store/store';
import { YelyTheme } from './src/theme/theme';

import AppToast from './src/components/ui/AppToast';
import { hideToast, selectToast, showErrorToast, showSuccessToast } from './src/store/slices/uiSlice';

import useSocket from './src/hooks/useSocket';
import useSocketEvents from './src/hooks/useSocketEvents';

const AppContent = () => {
  const dispatch = useDispatch();
  const toast = useSelector(selectToast);
  
  // 🚀 ADAPTATION THEME RACINE
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  useSocket();
  useSocketEvents();

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
            style={isDarkMode ? 'light' : 'dark'}
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
      </Portal>
    </>
  );
};

export default function App() {
  return (
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