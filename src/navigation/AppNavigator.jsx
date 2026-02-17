// src/navigation/AppNavigator.jsx
// ORCHESTRATEUR DE NAVIGATION (Corrigé : Pas de NavigationContainer ici !)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import SecureStorageAdapter from '../store/secureStoreAdapter';
import { restoreAuth, selectCurrentUser, selectIsAuthenticated } from '../store/slices/authSlice';
import THEME from '../theme/theme';

// Screens Auth
import LandingScreen from '../screens/LandingScreen';
import LoginPage from '../screens/auth/LoginPage';
import RegisterPage from '../screens/auth/RegisterPage';

// Homes (Nouvelle structure sans Drawer)
import DriverHome from '../screens/home/DriverHome';
import RiderHome from '../screens/home/RiderHome';

// Menu (Nouvelle page)
import MenuScreen from '../screens/MenuScreen';

// On empêche le splash natif de partir trop vite tant qu'on charge
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  
  // Utilisation des sélecteurs (Assure-toi que authSlice les exporte bien, sinon utilise state.auth)
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  
  const [isReady, setIsReady] = useState(false);

  // 1. RESTAURATION DE LA SESSION
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

  // Tant que l'app n'a pas fini de charger, on ne rend rien (le Splash natif reste affiché)
  if (!isReady) {
    return null; 
  }

  // Détermination de la Home
  const getHomeScreen = () => {
    return user?.role === 'driver' ? 'DriverHome' : 'RiderHome';
  };

  // ⚠️ CORRECTION : PAS DE NavigationContainer ICI !
  // Il est déjà dans App.js
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: THEME.COLORS.background },
      }}
      initialRouteName={isAuthenticated ? getHomeScreen() : 'Landing'}
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
          <Stack.Screen name="DriverHome" component={DriverHome} />
          <Stack.Screen name="RiderHome" component={RiderHome} />
          
          {/* PAGE MENU (Style Facebook) */}
          <Stack.Screen 
            name="Menu" 
            component={MenuScreen} 
            options={{
              animation: 'slide_from_bottom', // Ou 'slide_from_right'
              presentation: 'modal', // Donne un effet de "feuille" par dessus
              gestureEnabled: true,
            }}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;