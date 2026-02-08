import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import 'react-native-gesture-handler';
import { Button, Provider as PaperProvider, Text } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux'; // On importe le cerveau
import { store } from './src/store'; // On importe la mémoire
import { YelyTheme } from './src/theme/theme';

export default function App() {
  return (
    <ReduxProvider store={store}>
      <PaperProvider theme={YelyTheme}>
        <NavigationContainer>
          <View style={styles.container}>
            <StatusBar style="light" />
            
            <Text variant="headlineMedium" style={styles.title}>YÉLY</Text>
            <Text variant="bodyLarge" style={styles.subtitle}>Luxe Nocturne & Transparence</Text>

            <Button 
              mode="contained" 
              style={styles.button}
              onPress={() => console.log("Connexion au cerveau Redux réussie !")}
            >
              COMMANDER UN TAXI
            </Button>

            <View style={styles.glassCard}>
              <Text style={styles.glassText}>Système Nerveux Redux activé</Text>
            </View>
          </View>
        </NavigationContainer>
      </PaperProvider>
    </ReduxProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: YelyTheme.colors.background, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { color: YelyTheme.colors.primary, fontWeight: 'bold', letterSpacing: 4, marginBottom: 10 },
  subtitle: { color: YelyTheme.colors.textSecondary, marginBottom: 40 },
  button: { width: '100%', paddingVertical: 8, borderRadius: 50 },
  glassCard: { marginTop: 40, padding: 20, width: '100%', backgroundColor: YelyTheme.colors.surface, borderRadius: 20, borderWidth: 1, borderColor: YelyTheme.colors.outline, alignItems: 'center' },
  glassText: { color: YelyTheme.colors.textSecondary, fontSize: 12 }
});