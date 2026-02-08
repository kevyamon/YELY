import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';

// Imports corrects
import AppNavigator from './src/navigation/AppNavigator';
import store from './src/store/store'; // Utilise l'export default du store
import { YelyTheme } from './src/theme/theme';

export default function App() {
  return (
    <ReduxProvider store={store}>
      <PaperProvider theme={YelyTheme}>
        <View style={styles.container}>
          <StatusBar style="light" backgroundColor={YelyTheme.colors.background} />
          {/* AppNavigator contient déjà le NavigationContainer, on l'appelle directement */}
          <AppNavigator />
        </View>
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