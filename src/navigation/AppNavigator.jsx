// src/navigation/AppNavigator.jsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { restoreAuth } from '../store/slices/authSlice';
import { ANIMATIONS, COLORS } from '../theme/theme';

// Screens
import LandingScreen from '../screens/LandingScreen';
import SplashScreen from '../screens/SplashScreen';
import LoginPage from '../screens/auth/LoginPage';
import RegisterPage from '../screens/auth/RegisterPage';
import RiderHome from '../screens/home/RiderHome';

const Stack = createNativeStackNavigator();

// Placeholder temporaire pour les écrans non encore codés
const PlaceholderScreen = ({ route }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.deepAsphalt }}>
    <Text style={{ color: 'white', fontSize: 18 }}>
      Écran {route?.name || 'inconnu'} en construction
    </Text>
  </View>
);

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, userInfo } = useSelector((state) => state.auth);
  const [isReady, setIsReady] = useState(false);

  // Restauration de la session au démarrage
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem('userInfo'),
          AsyncStorage.getItem('token'),
        ]);

        if (storedUser && storedToken) {
          dispatch(restoreAuth({
            user: JSON.parse(storedUser),
            token: storedToken,
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

  // ✅ LOGIQUE DE ROUTE SÉCURISÉE
  const getInitialRoute = () => {
    if (!isAuthenticated) return 'Landing';
    
    // Si on est ici, on est forcément connecté. On vérifie le rôle.
    const role = userInfo?.role?.toLowerCase() || 'rider';
    if (role === 'driver') return 'DriverHome';
    if (role === 'admin' || role === 'superadmin') return 'AdminDashboard';
    
    return 'RiderHome';
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitialRoute()}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.deepAsphalt },
        animation: 'fade_from_bottom',
        animationDuration: ANIMATIONS.duration.normal,
      }}
    >
      {!isAuthenticated ? (
        // STACK AUTHENTIFICATION
        <Stack.Group>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginPage} />
          <Stack.Screen name="Register" component={RegisterPage} />
        </Stack.Group>
      ) : (
        // STACK APPLICATION (Protégé)
        <Stack.Group>
          <Stack.Screen name="RiderHome" component={RiderHome} />
          <Stack.Screen name="DriverHome" component={PlaceholderScreen} />
          <Stack.Screen name="AdminDashboard" component={PlaceholderScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;