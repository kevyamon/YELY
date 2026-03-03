// src/navigation/AppNavigator.jsx
// ORCHESTRATEUR DE NAVIGATION - Routage Securise et Isolation par Role
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import SecureStorageAdapter from '../store/secureStoreAdapter';
import { logout, restoreAuth, selectCurrentUser, selectIsAuthenticated, setCredentials } from '../store/slices/authSlice';
import THEME from '../theme/theme';

// Screens Auth
import LandingScreen from '../screens/LandingScreen';
import LoginPage from '../screens/auth/LoginPage';
import RegisterPage from '../screens/auth/RegisterPage';

// Homes
import DriverHome from '../screens/home/DriverHome';
import RiderHome from '../screens/home/RiderHome';

// Outils Chauffeur
import PancarteScreen from '../screens/ride/PancarteScreen';

// Menu
import MenuScreen from '../screens/MenuScreen';

// Composant temporaire pour eviter les crashs avant la Vague 4
const PlaceholderScreen = ({ route, navigation }) => (
  <View style={styles.placeholderContainer}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
      <Ionicons name="arrow-back" size={24} color={THEME.COLORS.champagneGold} />
      <Text style={styles.backText}>Retour</Text>
    </TouchableOpacity>
    <Ionicons name="construct-outline" size={64} color={THEME.COLORS.textSecondary} />
    <Text style={styles.placeholderTitle}>{route.name}</Text>
    <Text style={styles.placeholderText}>Ce module est en cours de developpement (Vague 4).</Text>
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
    const verifyAndRestoreSession = async () => {
      try {
        const storedUserStr = await SecureStorageAdapter.getItem('userInfo');
        const storedToken = await SecureStorageAdapter.getItem('token');
        const storedRefreshToken = await SecureStorageAdapter.getItem('refreshToken');

        if (storedUserStr && storedRefreshToken && storedToken) {
          const storedUser = JSON.parse(storedUserStr);

          try {
            const API_URL = process.env.EXPO_PUBLIC_API_URL;
            const response = await fetch(`${API_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: storedRefreshToken }),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                dispatch(setCredentials({
                  user: storedUser,
                  accessToken: data.data.accessToken,
                  refreshToken: data.data.refreshToken || storedRefreshToken,
                }));
              } else {
                dispatch(logout()); 
              }
            } else {
              if (response.status === 401 || response.status === 403) {
                dispatch(logout());
              } else {
                dispatch(restoreAuth({ user: storedUser, token: storedToken, refreshToken: storedRefreshToken }));
              }
            }
          } catch (networkError) {
            dispatch(restoreAuth({ user: storedUser, token: storedToken, refreshToken: storedRefreshToken }));
          }
        } else {
          dispatch(logout()); 
        }
      } catch (e) {
        console.error('[Auth] Erreur critique au demarrage:', e);
        dispatch(logout());
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    };

    verifyAndRestoreSession();
  }, [dispatch]);

  if (!isReady) {
    return null; 
  }

  const isDriver = user?.role === 'driver';
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: THEME.COLORS.background },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Group>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginPage} />
          <Stack.Screen name="Register" component={RegisterPage} />
        </Stack.Group>
      ) : (
        <Stack.Group>
          {isAdmin ? (
            // FORTERESSE ADMIN (Isolation stricte des routes)
            <>
              <Stack.Screen name="AdminDashboard" component={PlaceholderScreen} />
              <Stack.Screen name="ValidationCenter" component={PlaceholderScreen} />
              <Stack.Screen name="UsersManagement" component={PlaceholderScreen} />
              <Stack.Screen name="FinanceConfig" component={PlaceholderScreen} />
              <Stack.Screen name="AdminJournal" component={PlaceholderScreen} />
            </>
          ) : isDriver ? (
            // INTERFACE CHAUFFEUR
             <Stack.Screen name="DriverHome" component={DriverHome} />
          ) : (
            // INTERFACE PASSAGER
             <Stack.Screen name="RiderHome" component={RiderHome} />
          )}
          
          {/* ECRANS COMMUNS ET OUTILS (Verrouilles pour les Admins) */}
          {!isAdmin && (
            <>
              <Stack.Screen 
                name="Menu" 
                component={MenuScreen} 
                options={{
                  animation: 'fade_from_bottom',
                  presentation: 'transparentModal',
                  gestureEnabled: true,
                  animationDuration: 100, 
                }}
              />

              <Stack.Screen 
                name="Pancarte" 
                component={PancarteScreen} 
                options={{
                  animation: 'slide_from_bottom',
                }}
              />

              <Stack.Screen name="Profile" component={PlaceholderScreen} />
              <Stack.Screen name="History" component={PlaceholderScreen} />
              <Stack.Screen name="Notifications" component={PlaceholderScreen} />
              <Stack.Screen name="Subscription" component={PlaceholderScreen} />
            </>
          )}
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
    padding: 20 
  },
  backButton: { 
    position: 'absolute', 
    top: 50, 
    left: 20, 
    flexDirection: 'row', 
    alignItems: 'center',
    padding: 10,
    zIndex: 10
  },
  backText: { 
    color: THEME.COLORS.champagneGold, 
    marginLeft: 8, 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  placeholderTitle: { 
    color: THEME.COLORS.champagneGold, 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginTop: 20, 
    marginBottom: 10 
  },
  placeholderText: { 
    color: THEME.COLORS.textSecondary, 
    fontSize: 16, 
    textAlign: 'center' 
  },
});

export default AppNavigator;