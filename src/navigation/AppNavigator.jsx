// src/navigation/AppNavigator.jsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { restoreAuth } from '../store/slices/authSlice';
import { ANIMATIONS, COLORS } from '../theme/theme';

// Screens
import SplashScreen from '../screens/SplashScreen';
import AdminDashboard from '../screens/admin/AdminDashboard';
import LandingPage from '../screens/auth/LandingPage';
import LoginPage from '../screens/auth/LoginPage';
import RegisterPage from '../screens/auth/RegisterPage';
import DriverHome from '../screens/driver/DriverHome';
import SubscriptionPage from '../screens/driver/SubscriptionPage';
import RiderHome from '../screens/rider/RiderHome';
import HistoryPage from '../screens/shared/HistoryPage';
import NotificationsPage from '../screens/shared/NotificationsPage';
import ProfilePage from '../screens/shared/ProfilePage';

// Admin Screens
import AdminFinance from '../screens/admin/AdminFinance';
import AdminUsers from '../screens/admin/AdminUsers';
import AdminValidation from '../screens/admin/AdminValidation';

// Course Screens
import IdentifyScreen from '../screens/rider/IdentifyScreen';
import RideTracking from '../screens/rider/RideTracking';
import RatingScreen from '../screens/shared/RatingScreen';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: COLORS.deepAsphalt },
  animation: 'fade_from_bottom',
  animationDuration: ANIMATIONS.duration.normal,
};

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, userInfo } = useSelector((state) => state.auth);
  const [isReady, setIsReady] = useState(false);

  // Restaurer l'authentification depuis AsyncStorage
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
        // Laisser le temps au splash screen
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
    switch (userInfo.role) {
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
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={screenOptions}
        initialRouteName={isAuthenticated ? getHomeScreen() : 'Landing'}
      >
        {!isAuthenticated ? (
          // ═══ ÉCRANS NON AUTHENTIFIÉS ═══
          <>
            <Stack.Screen name="Landing" component={LandingPage} />
            <Stack.Screen name="Login" component={LoginPage} />
            <Stack.Screen name="Register" component={RegisterPage} />
          </>
        ) : (
          // ═══ ÉCRANS AUTHENTIFIÉS ═══
          <>
            {/* Rider Screens */}
            <Stack.Screen name="RiderHome" component={RiderHome} />
            <Stack.Screen name="RideTracking" component={RideTracking} />
            <Stack.Screen name="IdentifyScreen" component={IdentifyScreen} />

            {/* Driver Screens */}
            <Stack.Screen name="DriverHome" component={DriverHome} />
            <Stack.Screen name="Subscription" component={SubscriptionPage} />

            {/* Admin Screens */}
            <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
            <Stack.Screen name="AdminValidation" component={AdminValidation} />
            <Stack.Screen name="AdminUsers" component={AdminUsers} />
            <Stack.Screen name="AdminFinance" component={AdminFinance} />

            {/* Shared Screens */}
            <Stack.Screen name="Profile" component={ProfilePage} />
            <Stack.Screen name="History" component={HistoryPage} />
            <Stack.Screen name="Notifications" component={NotificationsPage} />
            <Stack.Screen name="Rating" component={RatingScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;