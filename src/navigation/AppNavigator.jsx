// src/navigation/AppNavigator.jsx
// ORCHESTRATEUR DE NAVIGATION - Routage Securise et Isolation par Role
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import useServerWakeup from '../hooks/useServerWakeup';
import socketService from '../services/socketService';
import SecureStorageAdapter from '../store/secureStoreAdapter';

import {
  fetchPromoConfig // NOUVEL IMPORT
  ,
  forceSilentRefresh,
  logout,
  restoreAuth,
  selectCurrentUser,
  selectIsAuthenticated,
  selectPromoMode,
  selectSubscriptionStatus,
  updatePromoMode
} from '../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../store/slices/uiSlice';

import THEME from '../theme/theme';

import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import LoginPage from '../screens/auth/LoginPage';
import RegisterPage from '../screens/auth/RegisterPage';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import LandingScreen from '../screens/LandingScreen';

import PrivacyPolicyScreen from '../screens/legal/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/legal/TermsOfServiceScreen';

import DriverHome from '../screens/home/DriverHome';
import RiderHome from '../screens/home/RiderHome';

import PancarteScreen from '../screens/ride/PancarteScreen';

import HistoryScreen from '../screens/history/HistoryScreen';
import MenuScreen from '../screens/MenuScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ReportScreen from '../screens/report/ReportScreen';
import SplashScreenComponent from '../screens/SplashScreen';

import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminJournal from '../screens/admin/AdminJournal';
import AdminReports from '../screens/admin/AdminReports';
import FinanceConfig from '../screens/admin/FinanceConfig';
import MapManagement from '../screens/admin/MapManagement';
import UsersManagement from '../screens/admin/UsersManagement';
import ValidationCenter from '../screens/admin/ValidationCenter';

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
    <Text style={styles.placeholderText}>Ce module arrive bientot.</Text>
  </View>
);

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const subStatus = useSelector(selectSubscriptionStatus);
  const promoMode = useSelector(selectPromoMode); 
  
  const { isServerReady, isWakingUp } = useServerWakeup();
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [showSplash, setShowSplash] = useState(true);

  // SYNCHRONISATION FORCEE AU DEMARRAGE ET LOGIN
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchPromoConfig());
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    const verifyAndRestoreSession = async () => {
      try {
        const storedUserStr = await SecureStorageAdapter.getItem('userInfo');
        const storedToken = await SecureStorageAdapter.getItem('token');
        const storedRefreshToken = await SecureStorageAdapter.getItem('refreshToken');

        if (storedRefreshToken && storedToken) {
          let storedUser = null;
          
          if (storedUserStr) {
            try {
              storedUser = JSON.parse(storedUserStr);
            } catch (parseError) {
              console.warn('[AUTH] Erreur de parsing du profil local.');
            }
          }

          dispatch(restoreAuth({ 
            user: storedUser, 
            token: storedToken, 
            refreshToken: storedRefreshToken 
          }));

          dispatch(forceSilentRefresh());
          
        } else {
          dispatch(logout({ reason: 'MISSING_TOKENS_AT_STARTUP' })); 
        }
      } catch (e) {
        dispatch(logout({ reason: 'CRITICAL_BOOT_ERROR' }));
      } finally {
        setIsAuthReady(true);
        setTimeout(async () => {
          await SplashScreen.hideAsync();
        }, 100);
      }
    };

    verifyAndRestoreSession();
  }, [dispatch]);

  // ECOUTEUR GLOBAL DU MODE VIP POUR LES DEBLOCAGES EN TEMPS REEL
  useEffect(() => {
    if (!isAuthenticated) return;

    const handlePromoModeChange = (data) => {
      dispatch(updatePromoMode(data));
      
      if (user?.role === 'driver') {
        if (data.isGlobalFreeAccess) {
          dispatch(showSuccessToast({ title: "Mode VIP Active !", message: data.promoMessage || "Roulez sans abonnement !" }));
        } else {
          dispatch(showErrorToast({ title: "Fin de la Promo", message: "Le mode gratuit est termine." }));
        }
      }
    };

    socketService.on('PROMO_MODE_CHANGED', handlePromoModeChange);
    return () => socketService.off('PROMO_MODE_CHANGED', handlePromoModeChange);
  }, [isAuthenticated, user?.role, dispatch]);

  const isDriver = user?.role === 'driver';
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  
  const isSubscriptionPending = isDriver && subStatus?.isPending && !promoMode?.isActive;
  const isDriverBlocked = isDriver && !subStatus?.isActive && !subStatus?.isPending && !promoMode?.isActive;

  return (
    <View style={styles.rootContainer}>
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
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
          </Stack.Group>
        ) : isAdmin ? (
          <Stack.Group>
            <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ValidationCenter" component={ValidationCenter} />
            <Stack.Screen name="UsersManagement" component={UsersManagement} />
            <Stack.Screen name="FinanceConfig" component={FinanceConfig} />
            <Stack.Screen name="AdminJournal" component={AdminJournal} />
            <Stack.Screen name="AdminReports" component={AdminReports} />
            <Stack.Screen name="MapManagement" component={MapManagement} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
          </Stack.Group>
        ) : isSubscriptionPending ? (
          <Stack.Group>
            <Stack.Screen name="WaitSubscription" component={WaitScreen} />
          </Stack.Group>
        ) : isDriverBlocked ? (  
          <Stack.Group>
            <Stack.Screen name="SubscriptionBlocker" component={SubscriptionScreen} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            {isDriver ? (
              <Stack.Screen name="DriverHome" component={DriverHome} />
            ) : (
              <Stack.Screen name="RiderHome" component={RiderHome} />
            )}
            
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
              <Stack.Screen name="Pancarte" component={PancarteScreen} options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="History" component={HistoryScreen} />
              <Stack.Screen name="Report" component={ReportScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
              <Stack.Screen name="Subscription" component={SubscriptionScreen} />
              <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
              <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
            </Stack.Group>
          </Stack.Group>
        )}
      </Stack.Navigator>

      {showSplash && (
        <SplashScreenComponent 
          isServerReady={isServerReady && isAuthReady} 
          onFinish={() => setShowSplash(false)} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: THEME.COLORS.background
  },
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
  backText: { color: THEME.COLORS.champagneGold, marginLeft: 8, fontSize: 16, fontWeight: 'bold' },
  placeholderTitle: { color: THEME.COLORS.champagneGold, fontSize: 28, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  placeholderText: { color: THEME.COLORS.textSecondary, fontSize: 16, textAlign: 'center' },
});

export default AppNavigator;