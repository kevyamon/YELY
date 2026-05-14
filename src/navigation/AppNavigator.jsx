import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState, useMemo, useRef } from 'react';
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

// IMPORTS STATIQUES (FLUIDITÉ APK)
import HomeRouter from '../screens/home/HomeRouter';
import DriverHome from '../screens/home/DriverHome';
import RiderHome from '../screens/home/RiderHome';
import SellerHome from '../screens/home/SellerHome';
import LandingScreen from '../screens/LandingScreen';
import LoginPage from '../screens/auth/LoginPage';
import RegisterPage from '../screens/auth/RegisterPage';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ManageProducts from '../screens/seller/ManageProducts';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import MenuScreen from '../screens/MenuScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import PrivacyPolicyScreen from '../screens/legal/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/legal/TermsOfServiceScreen';
import MarketplaceHub from '../screens/marketplace/MarketplaceHub';
import ProductList from '../screens/marketplace/ProductList';
import ProductDetails from '../screens/marketplace/ProductDetails';
import Cart from '../screens/marketplace/Cart';
import Checkout from '../screens/marketplace/CheckoutScreen';
import OrderTracking from '../screens/marketplace/OrderTracking';
import SellerDashboard from '../screens/seller/SellerDashboard';
import SellerOrders from '../screens/seller/SellerOrders';
import LedgerHistory from '../screens/seller/LedgerHistory';
import PancarteScreen from '../screens/ride/PancarteScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
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

  // Lecture stable du role (string primitive — jamais d'objet)
  const userRole = user?.role ?? null;

  const hasCheckedPromo = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const checkPromoAtStartup = async () => {
      // On ne check que si authentifié, driver, et qu'on n'a pas encore checké dans cette session
      if (isAuthenticated && userRole === 'driver' && !promoMode?.isActive && !hasCheckedPromo.current) {
        hasCheckedPromo.current = true; // On marque immédiatement comme checké
        try {
          const data = await dispatch(fetchPromoConfig()).unwrap().catch(() => null);
          if (isMounted && data && data.isGlobalFreeAccess) {
            setPromoAlert({
              visible: true,
              isActive: true,
              message: data.promoMessage || "L'accès VIP est actuellement actif !"
            });
          }
        } catch (e) {
          // Si ça échoue, on pourra retenter au prochain montage si besoin, 
          // mais on garde hasCheckedPromo à true pour éviter la boucle immédiate
        }
      }
    };
    checkPromoAtStartup();
    return () => { isMounted = false; };
  }, [isAuthenticated, userRole, dispatch]); // promoMode est retiré des dépendances pour casser la boucle


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
  }, []); // Exécuté une seule fois au boot

  // Memoization des statuts pour stabilite maximale
  const routingStatus = useMemo(() => {
    const isDriver = userRole === 'driver';
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';
    const hasValidAccess = subStatus?.isActive || promoMode?.isActive;
    
    return {
      isDriver,
      isAdmin,
      isSubscriptionRejected: isDriver && subStatus?.isRejected && !hasValidAccess,
      isSubscriptionPending: isDriver && subStatus?.isPending && !subStatus?.isRejected && !hasValidAccess,
      isDriverBlocked: isDriver && !hasValidAccess && !subStatus?.isPending && !subStatus?.isRejected
    };
  }, [userRole, subStatus?.isActive, subStatus?.isPending, subStatus?.isRejected, promoMode?.isActive]);

  const { isDriver, isAdmin, isSubscriptionRejected, isSubscriptionPending, isDriverBlocked } = routingStatus;

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
            {/* HomeRouter est STABLE — le Navigator ne voit jamais sa structure changer */}
            <Stack.Screen name="Home" component={HomeRouter} />
            <Stack.Screen name="RiderHome" component={RiderHome} />
            <Stack.Screen name="DriverHome" component={DriverHome} />
            <Stack.Screen name="SellerHome" component={SellerHome} />
            <Stack.Screen name="MarketplaceHub" component={MarketplaceHub} />
            <Stack.Screen name="ProductList" component={ProductList} />
            <Stack.Screen name="ProductDetails" component={ProductDetails} />
            <Stack.Screen name="Cart" component={Cart} />
            <Stack.Screen name="Checkout" component={Checkout} />
            <Stack.Screen name="OrderTracking" component={OrderTracking} />
            <Stack.Screen name="SellerDashboard" component={SellerDashboard} />
            <Stack.Screen name="SellerOrders" component={SellerOrders} />
            <Stack.Screen name="ManageProducts" component={ManageProducts} />
            <Stack.Screen name="LedgerHistory" component={LedgerHistory} />
            
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
          onFinish={() => {
             // Securite : on ne masque le splash que si le serveur est pret
             if (isServerReady && isAuthReady) setShowSplash(false);
          }} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: { flex: 1, backgroundColor: THEME.COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.COLORS.background }
});

export default AppNavigator;