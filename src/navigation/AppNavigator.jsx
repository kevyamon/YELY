// src/navigation/AppNavigator.jsx
// ORCHESTRATEUR DE NAVIGATION
// Correction : Rendu conditionnel strict des Homes pour éviter le bug "Passager par défaut"

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import SecureStorageAdapter from '../store/secureStoreAdapter';
import { restoreAuth, selectCurrentUser, selectIsAuthenticated } from '../store/slices/authSlice';
import THEME from '../theme/theme';

// Screens Auth
import LandingScreen from '../screens/LandingScreen';
import LoginPage from '../screens/auth/LoginPage';
import RegisterPage from '../screens/auth/RegisterPage';

// Homes
import DriverHome from '../screens/home/DriverHome';
import RiderHome from '../screens/home/RiderHome';

// Menu
import MenuScreen from '../screens/MenuScreen';

// 🚧 COMPOSANT TEMPORAIRE POUR LES PAGES EN CONSTRUCTION 🚧
const PlaceholderScreen = ({ route, navigation }) => (
  <View style={styles.placeholderContainer}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
      <Ionicons name="arrow-back" size={24} color={THEME.COLORS.champagneGold} />
      <Text style={styles.backText}>Retour</Text>
    </TouchableOpacity>
    <Ionicons name="construct-outline" size={64} color={THEME.COLORS.textSecondary} />
    <Text style={styles.placeholderTitle}>{route.name}</Text>
    <Text style={styles.placeholderText}>Cette fonctionnalité arrive bientôt.</Text>
  </View>
);

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [storedUser, storedToken, storedRefreshToken] = await Promise.all([
          AsyncStorage.getItem('userInfo'),
          SecureStorageAdapter.getItem('token'),
          SecureStorageAdapter.getItem('refreshToken'),
        ]);

        if (storedUser && storedToken) {
          dispatch(restoreAuth({
            user: JSON.parse(storedUser),
            token: storedToken,
            refreshToken: storedRefreshToken,
          }));
        }
      } catch (e) {
        console.error('[Auth] Erreur restauration:', e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    };

    restoreSession();
  }, [dispatch]);

  if (!isReady) {
    return null; 
  }

  // Sécurité : On s'assure que le rôle est bien défini, sinon Rider par défaut
  const isDriver = user?.role === 'driver';

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: THEME.COLORS.background },
      }}
      // Plus besoin de initialRouteName dynamique complexe, le contenu conditionnel gère tout
    >
      {!isAuthenticated ? (
        // 🔴 ZONE PUBLIQUE
        <Stack.Group>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginPage} />
          <Stack.Screen name="Register" component={RegisterPage} />
        </Stack.Group>
      ) : (
        // 🟢 ZONE PRIVÉE
        <Stack.Group>
          
          {/* 👇 C'EST ICI LA CORRECTION MAJEURE 👇 */}
          {/* On ne rend QUE l'écran correspondant au rôle. */}
          {/* React Navigation est OBLIGÉ d'afficher le premier écran de la liste. */}
          
          {isDriver ? (
             <Stack.Screen name="DriverHome" component={DriverHome} />
          ) : (
             <Stack.Screen name="RiderHome" component={RiderHome} />
          )}
          
          {/* PAGE MENU (Slide Up) */}
          <Stack.Screen 
            name="Menu" 
            component={MenuScreen} 
            options={{
              animation: 'slide_from_bottom',
              presentation: 'modal',
              gestureEnabled: true,
            }}
          />

          {/* 🚧 PAGES EN CONSTRUCTION 🚧 */}
          <Stack.Screen name="Profile" component={PlaceholderScreen} />
          <Stack.Screen name="History" component={PlaceholderScreen} />
          <Stack.Screen name="Notifications" component={PlaceholderScreen} />
          <Stack.Screen name="Subscription" component={PlaceholderScreen} />
          <Stack.Screen name="AdminDashboard" component={PlaceholderScreen} />
          <Stack.Screen name="Validations" component={PlaceholderScreen} />
          <Stack.Screen name="Drivers" component={PlaceholderScreen} />
          <Stack.Screen name="Finance" component={PlaceholderScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    backgroundColor: THEME.COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: THEME.COLORS.champagneGold,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholderTitle: {
    color: THEME.COLORS.champagneGold,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  placeholderText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default AppNavigator;