import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import React, { Suspense, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
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

const LandingScreen = React.lazy(() => import('../screens/LandingScreen'));
const LoginPage = React.lazy(() => import('../screens/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('../screens/auth/RegisterPage'));
const ForgotPasswordScreen = React.lazy(() => import('../screens/auth/ForgotPasswordScreen'));
const ResetPasswordScreen = React.lazy(() => import('../screens/auth/ResetPasswordScreen'));
const PrivacyPolicyScreen = React.lazy(() => import('../screens/legal/PrivacyPolicyScreen'));
const TermsOfServiceScreen = React.lazy(() => import('../screens/legal/TermsOfServiceScreen'));
const DriverHome = React.lazy(() => import('../screens/home/DriverHome'));
const RiderHome = React.lazy(() => import('../screens/home/RiderHome'));
const PancarteScreen = React.lazy(() => import('../screens/ride/PancarteScreen'));
const HistoryScreen = React.lazy(() => import('../screens/history/HistoryScreen'));
const MenuScreen = React.lazy(() => import('../screens/MenuScreen'));
const NotificationsScreen = React.lazy(() => import('../screens/notifications/NotificationsScreen'));
const ProfileScreen = React.lazy(() => import('../screens/profile/ProfileScreen'));
const ReportScreen = React.lazy(() => import('../screens/report/ReportScreen'));
const SplashScreenComponent = React.lazy(() => import('../screens/SplashScreen'));
const AdminDashboard = React.lazy(() => import('../screens/admin/AdminDashboard'));
const AdminJournal = React.lazy(() => import('../screens/admin/AdminJournal'));
const AdminReports = React.lazy(() => import('../screens/admin/AdminReports'));
const AdminRides = React.lazy(() => import('../screens/admin/AdminRides'));
const FinanceConfig = React.lazy(() => import('../screens/admin/FinanceConfig'));
const MapManagement = React.lazy(() => import('../screens/admin/MapManagement'));
const SystemConfig = React.lazy(() => import('../screens/admin/SystemConfig'));
const UsersManagement = React.lazy(() => import('../screens/admin/UsersManagement'));
const ValidationCenter = React.lazy(() => import('../screens/admin/ValidationCenter'));
const PromoAlertModal = React.lazy(() => import('../components/subscription/PromoAlertModal'));
const PaymentFailureScreen = React.lazy(() => import('../screens/subscription/PaymentFailure'));
const SubscriptionScreen = React.lazy(() => import('../screens/subscription/SubscriptionScreen'));
const WaitScreen = React.lazy(() => import('../screens/subscription/WaitScreen'));

SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();

const LoadingFallback = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={THEME.COLORS.primary} />
  </View>
);

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
      <Suspense fallback={<LoadingFallback />}>
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
      </Suspense>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: { flex: 1, backgroundColor: THEME.COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.COLORS.background }
});

export default AppNavigator;