// src/navigation/AppNavigator.jsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
// ✅ CORRECTION : imports Text et View EN HAUT du fichier
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { restoreAuth } from '../store/slices/authSlice';
import { ANIMATIONS, COLORS } from '../theme/theme';

// Screens
import LandingScreen from '../screens/LandingScreen';
import SplashScreen from '../screens/SplashScreen';
import LoginPage from '../screens/auth/LoginPage';
import RegisterPage from '../screens/auth/RegisterPage';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: COLORS.deepAsphalt },
  animation: 'fade_from_bottom',
  animationDuration: ANIMATIONS.duration.normal,
};

// Placeholder temporaire
const PlaceholderScreen = ({ route }) => (
  <View
    style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.deepAsphalt,
    }}
  >
    <Text style={{ color: 'white', fontSize: 18 }}>
      Écran {route?.name || 'inconnu'} en construction
    </Text>
  </View>
);

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, userInfo } = useSelector((state) => state.auth);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem('userInfo'),
          AsyncStorage.getItem('token'),
        ]);

        if (storedUser && storedToken) {
          dispatch(
            restoreAuth({
              user: JSON.parse(storedUser),
              token: storedToken,
            })
          );
        }
      } catch (e) {
        console.error('[Auth] Erreur de restauration:', e);
      } finally {
        setTimeout(() => setIsReady(true), 1500);
      }
    };

    restoreSession();
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  const getHomeScreen = () => {
    if (!userInfo) return 'Landing';
    const role = userInfo.role || 'rider';

    switch (role) {
      case 'superAdmin':
      case 'admin':
        return 'AdminDashboard';
      case 'driver':
        return 'DriverHome';
      case 'rider':
      default:
        return 'RiderHome';
    }
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={screenOptions}
          initialRouteName={isAuthenticated ? getHomeScreen() : 'Landing'}
        >
          {!isAuthenticated ? (
            <>
              <Stack.Screen name="Landing" component={LandingScreen} />
              <Stack.Screen name="Login" component={LoginPage} />
              <Stack.Screen name="Register" component={RegisterPage} />
            </>
          ) : (
            <>
              <Stack.Screen name="RiderHome" component={PlaceholderScreen} />
              <Stack.Screen name="DriverHome" component={PlaceholderScreen} />
              <Stack.Screen name="AdminDashboard" component={PlaceholderScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default AppNavigator;