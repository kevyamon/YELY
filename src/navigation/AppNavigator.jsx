//src/navigation/AppNavigator.jsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import useServerWakeup from '../hooks/useServerWakeup';
import SecureStorageAdapter from '../store/secureStoreAdapter';

import {
  fetchPromoConfig,
  forceSilentRefresh,
  logout,
  restoreAuth,
  selectCurrentUser,
  selectIsAuthenticated,
  selectPromoMode,
  selectSubscriptionStatus
} from '../store/slices/authSlice';

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
import AdminRides from '../screens/admin/AdminRides';
import FinanceConfig from '../screens/admin/FinanceConfig';
import MapManagement from '../screens/admin/MapManagement';
import SystemConfig from '../screens/admin/SystemConfig';
import UsersManagement from '../screens/admin/UsersManagement';
import ValidationCenter from '../screens/admin/ValidationCenter';

import PromoAlertModal from '../components/subscription/PromoAlertModal';
import PaymentFailureScreen from '../screens/subscription/PaymentFailure';
import SubscriptionScreen from '../screens/subscription/SubscriptionScreen';
import WaitScreen from '../screens/subscription/WaitScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const subStatus = useSelector(selectSubscriptionStatus);
  const promoMode = useSelector(selectPromoMode); 
  
  const { isServerReady } = useServerWakeup();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [promoAlert, setPromoAlert] = useState({ visible: false, isActive: false, message: '' });

  useEffect(() => {
    const checkPromoAtStartup = async () => {
      if (isAuthenticated && user?.role === 'driver') {
        const data = await dispatch(fetchPromoConfig());
        if (data && data.isGlobalFreeAccess) {
          setPromoAlert({
            visible: true,
            isActive: true,
            message: data.promoMessage || "L'acces VIP est actuellement actif !"
          });
        }
      }
    };
    checkPromoAtStartup();
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
            try { storedUser = JSON.parse(storedUserStr); } catch (e) { await SecureStorageAdapter.removeItem('userInfo'); }
          }
          dispatch(restoreAuth({ user: storedUser, token: storedToken, refreshToken: storedRefreshToken }));
          dispatch(forceSilentRefresh());
        } else {
          dispatch(logout({ reason: 'MISSING_TOKENS_AT_STARTUP' })); 
        }
      } catch (e) {
        dispatch(logout({ reason: 'CRITICAL_BOOT_ERROR' }));
      } finally {
        setIsAuthReady(true);
        setTimeout(async () => { try { await SplashScreen.hideAsync(); } catch (err) {} }, 300);
      }
    };
    verifyAndRestoreSession();
  }, [dispatch]);

  const isDriver = user?.role === 'driver';
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const hasValidAccess = subStatus?.isActive || promoMode?.isActive;
  const isSubscriptionRejected = isDriver && subStatus?.isRejected && !hasValidAccess;
  const isSubscriptionPending = isDriver && subStatus?.isPending && !subStatus?.isRejected && !hasValidAccess;
  const isDriverBlocked = isDriver && !hasValidAccess && !subStatus?.isPending && !subStatus?.isRejected;

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
            <Stack.Screen name="AdminRides" component={AdminRides} />
            <Stack.Screen name="FinanceConfig" component={FinanceConfig} />
            <Stack.Screen name="SystemConfig" component={SystemConfig} /> 
            <Stack.Screen name="AdminJournal" component={AdminJournal} />
            <Stack.Screen name="AdminReports" component={AdminReports} />
            <Stack.Screen name="MapManagement" component={MapManagement} />
          </Stack.Group>
        ) : isSubscriptionRejected ? (
          <Stack.Group>
            <Stack.Screen name="PaymentFailure" component={PaymentFailureScreen} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} />
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
              <Stack.Screen name="Menu" component={MenuScreen} options={{ animation: 'fade_from_bottom', gestureEnabled: true, animationDuration: 100 }} />
              <Stack.Screen name="Pancarte" component={PancarteScreen} options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="History" component={HistoryScreen} />
              <Stack.Screen name="Report" component={ReportScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
              <Stack.Screen name="Subscription" component={SubscriptionScreen} />
              <Stack.Screen name="WaitSubscription" component={WaitScreen} />
              <Stack.Screen name="PaymentFailure" component={PaymentFailureScreen} />
            </Stack.Group>
          </Stack.Group>
        )}
      </Stack.Navigator>

      <PromoAlertModal 
        visible={promoAlert.visible}
        isActive={promoAlert.isActive}
        message={promoAlert.message}
        onClose={() => setPromoAlert({ ...promoAlert, visible: false })}
      />

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
  rootContainer: { flex: 1, backgroundColor: THEME.COLORS.background }
});

export default AppNavigator;