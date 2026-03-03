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
import {
  forceSilentRefresh,
  logout,
  restoreAuth,
  selectCurrentUser,
  selectIsAuthenticated,
  selectSubscriptionStatus
} from '../store/slices/authSlice';
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

// Menu & Nouvelles Pages
import MenuScreen from '../screens/MenuScreen';
import HistoryScreen from '../screens/history/HistoryScreen'; // NOUVEAU : Intégration de la Page 2
import ProfileScreen from '../screens/profile/ProfileScreen';

// Ecrans Admin
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminJournal from '../screens/admin/AdminJournal';
import FinanceConfig from '../screens/admin/FinanceConfig';
import UsersManagement from '../screens/admin/UsersManagement';
import ValidationCenter from '../screens/admin/ValidationCenter';

// Abonnement
import SubscriptionScreen from '../screens/subscription/SubscriptionScreen';
import WaitScreen from '../screens/subscription/WaitScreen';

const PlaceholderScreen = ({ route, navigation }) => (
  <View style={styles.placeholderContainer}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
      <Ionicons name="arrow-back" size={24} color={THEME.COLORS.champagneGold} />
      <Text style={styles.backText}>Retour</Text>
    </TouchableOpacity>
    <Ionicons name="construct-outline" size={64} color={THEME.COLORS.textSecondary} />
    <Text style={styles.placeholderTitle}>{route.name}</Text>
    <Text style={styles.placeholderText}>Ce module arrive bientôt.</Text>
  </View>
);

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const subStatus = useSelector(selectSubscriptionStatus);
  
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const verifyAndRestoreSession = async () => {
      try {
        const storedUserStr = await SecureStorageAdapter.getItem('userInfo');
        const storedToken = await SecureStorageAdapter.getItem('token');
        const storedRefreshToken = await SecureStorageAdapter.getItem('refreshToken');

        if (storedUserStr && storedRefreshToken && storedToken) {
          const storedUser = JSON.parse(storedUserStr);

          dispatch(restoreAuth({ 
            user: storedUser, 
            token: storedToken, 
            refreshToken: storedRefreshToken 
          }));

          dispatch(forceSilentRefresh());
          
        } else {
          dispatch(logout()); 
        }
      } catch (e) {
        console.error('[Auth] Erreur critique au demarrage:', e);
        dispatch(logout());
      } finally {
        setIsReady(true);
        setTimeout(async () => {
          await SplashScreen.hideAsync();
        }, 100);
      }
    };

    verifyAndRestoreSession();
  }, [dispatch]);

  if (!isReady) {
    return null; 
  }

  const isDriver = user?.role === 'driver';
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  
  // Sas de securite : Verification stricte si l'abonnement du chauffeur est en cours de validation
  const isSubscriptionPending = isDriver && (
    user?.subscriptionStatus === 'pending' || 
    user?.subscription?.status === 'pending' || 
    subStatus?.isPending
  );

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
            <Stack.Group>
              <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
              <Stack.Screen name="ValidationCenter" component={ValidationCenter} />
              <Stack.Screen name="UsersManagement" component={UsersManagement} />
              <Stack.Screen name="FinanceConfig" component={FinanceConfig} />
              <Stack.Screen name="AdminJournal" component={AdminJournal} />
            </Stack.Group>
          ) : isSubscriptionPending ? (
            // Isolation stricte : si en pending, l'utilisateur ne peut voir QUE le WaitScreen
            <Stack.Group>
              <Stack.Screen name="WaitSubscription" component={WaitScreen} />
            </Stack.Group>
          ) : isDriver ? (
            <Stack.Screen name="DriverHome" component={DriverHome} />
          ) : (
            <Stack.Screen name="RiderHome" component={RiderHome} />
          )}
          
          {!isAdmin && !isSubscriptionPending && (
            <Stack.Group screenOptions={{ presentation: 'transparentModal' }}>
              <Stack.Screen 
                name="Menu" 
                component={MenuScreen} 
                options={{
                  animation: 'fade_from_bottom',
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

              {/* INTERFACES ACTIVES */}
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="History" component={HistoryScreen} />
              
              {/* PLACEHOLDERS RESTANTS (Prochaines étapes) */}
              <Stack.Screen name="Notifications" component={PlaceholderScreen} />
              
              <Stack.Screen name="Subscription" component={SubscriptionScreen} />
            </Stack.Group>
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