// src/navigation/AppNavigator.jsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import SecureStorageAdapter from '../store/secureStoreAdapter';

import { restoreAuth } from '../store/slices/authSlice';
import { ANIMATIONS, COLORS } from '../theme/theme';

// Screens Auth
import LandingScreen from '../screens/LandingScreen';
import SplashScreen from '../screens/SplashScreen';
import LoginPage from '../screens/auth/LoginPage';
import RegisterPage from '../screens/auth/RegisterPage';

// Drawer (contient tous les écrans protégés)
import AppDrawer from './AppDrawer';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isReady, setIsReady] = useState(false);

  // Restauration de la session au démarrage
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
        console.error('[Auth] Erreur de restauration:', e);
      } finally {
        // Petit délai pour laisser le SplashScreen briller
        setTimeout(() => setIsReady(true), 2000);
      }
    };

    restoreSession();
  }, [dispatch]);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.deepAsphalt },
        animation: 'fade_from_bottom',
        animationDuration: ANIMATIONS.duration.normal,
      }}
    >
      {!isAuthenticated ? (
        // STACK AUTHENTIFICATION (Pas de Drawer ici)
        <Stack.Group>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginPage} />
          <Stack.Screen name="Register" component={RegisterPage} />
        </Stack.Group>
      ) : (
        // STACK APPLICATION : Le Drawer contient tous les écrans protégés
        <Stack.Group>
          <Stack.Screen name="MainApp" component={AppDrawer} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;