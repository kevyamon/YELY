// src/components/navigation/AppDrawer.jsx

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useEffect } from 'react';
import {
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import socketService from '../../services/socketService';
import { useLogoutMutation } from '../../store/api/usersApiSlice';
import { logout } from '../../store/slices/authSlice';
import { closeDrawer } from '../../store/slices/uiSlice';
import { ANIMATIONS, BORDERS, COLORS, FONTS, SHADOWS, SPACING } from '../../theme/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 320);

// Configuration des menus par rôle
const MENU_CONFIG = {
  rider: [
    { key: 'home', label: 'Accueil', icon: 'home-outline', route: 'RiderHome' },
    { key: 'history', label: 'Historique', icon: 'time-outline', route: 'History' },
    { key: 'notifications', label: 'Notifications', icon: 'notifications-outline', route: 'Notifications', badge: true },
    { key: 'profile', label: 'Mon Profil', icon: 'person-outline', route: 'Profile' },
  ],
  driver: [
    { key: 'home', label: 'Accueil', icon: 'home-outline', route: 'DriverHome' },
    { key: 'subscription', label: 'Abonnement', icon: 'card-outline', route: 'Subscription' },
    { key: 'history', label: 'Historique', icon: 'time-outline', route: 'History' },
    { key: 'notifications', label: 'Notifications', icon: 'notifications-outline', route: 'Notifications', badge: true },
    { key: 'profile', label: 'Mon Profil', icon: 'person-outline', route: 'Profile' },
  ],
  admin: [
    { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline', route: 'AdminDashboard' },
    { key: 'validation', label: 'Validations', icon: 'checkmark-done-outline', route: 'AdminValidation', badge: true },
    { key: 'users', label: 'Utilisateurs', icon: 'people-outline', route: 'AdminUsers' },
    { key: 'notifications', label: 'Notifications', icon: 'notifications-outline', route: 'Notifications', badge: true },
    { key: 'profile', label: 'Mon Profil', icon: 'person-outline', route: 'Profile' },
  ],
  superAdmin: [
    { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline', route: 'AdminDashboard' },
    { key: 'validation', label: 'Validations', icon: 'checkmark-done-outline', route: 'AdminValidation', badge: true },
    { key: 'users', label: 'Utilisateurs', icon: 'people-outline', route: 'AdminUsers' },
    { key: 'finance', label: 'Finance', icon: 'wallet-outline', route: 'AdminFinance' },
    { key: 'notifications', label: 'Notifications', icon: 'notifications-outline', route: 'Notifications', badge: true },
    { key: 'profile', label: 'Mon Profil', icon: 'person-outline', route: 'Profile' },
  ],
};

const AppDrawer = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isDrawerOpen } = useSelector((state) => state.ui);
  const { userInfo } = useSelector((state) => state.auth);
  const [logoutApi] = useLogoutMutation();

  const translateX = useSharedValue(-DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isDrawerOpen) {
      translateX.value = withSpring(0, ANIMATIONS.spring.gentle);
      backdropOpacity.value = withTiming(1, { duration: ANIMATIONS.duration.normal });
    } else {
      translateX.value = withTiming(-DRAWER_WIDTH, { duration: ANIMATIONS.duration.normal });
      backdropOpacity.value = withTiming(0, { duration: ANIMATIONS.duration.fast });
    }
  }, [isDrawerOpen]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: backdropOpacity.value > 0.1 ? 'auto' : 'none',
  }));

  const handleClose = () => {
    dispatch(closeDrawer());
  };

  const handleNavigate = (route) => {
    handleClose();
    setTimeout(() => {
      navigation.navigate(route);
    }, 300);
  };

  const handleLogout = async () => {
    handleClose();
    try {
      await logoutApi().unwrap();
    } catch (e) {
      // Ignorer les erreurs réseau, déconnecter quand même
    }
    socketService.disconnect();
    dispatch(logout());
  };

  const role = userInfo?.role || 'rider';
  const menuItems = MENU_CONFIG[role] || MENU_CONFIG.rider;

  return (
    <>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.overlayDark }]} />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          { paddingTop: insets.top + SPACING.lg },
          drawerStyle,
        ]}
      >
        {/* En-tête du profil */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {userInfo?.name || 'Utilisateur'}
            </Text>
            <Text style={styles.userPhone} numberOfLines={1}>
              {userInfo?.phone || userInfo?.email || '---'}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {role === 'superAdmin' ? '👑 SuperAdmin' :
                  role === 'admin' ? '🛡️ Admin' :
                    role === 'driver' ? '🚕 Chauffeur' : '👤 Passager'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Items de navigation */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => handleNavigate(item.route)}
              style={styles.menuItem}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              {item.badge && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>●</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Déconnexion */}
        <View style={styles.bottomSection}>
          <View style={styles.divider} />
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>Yély v1.0.0</Text>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 998,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: COLORS.glassDark,
    borderRightWidth: BORDERS.width.thin,
    borderRightColor: COLORS.glassBorder,
    zIndex: 999,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  // Profil
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.goldSoft,
  },
  avatarText: {
    fontSize: FONTS.sizes.h3,
    fontWeight: FONTS.weights.bold,
    color: COLORS.deepAsphalt,
  },
  profileInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  userName: {
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  userPhone: {
    fontSize: FONTS.sizes.caption,
    color: COLORS.textTertiary,
    marginTop: SPACING.xxs,
  },
  roleBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: BORDERS.radius.pill,
    marginTop: SPACING.xs,
  },
  roleBadgeText: {
    fontSize: FONTS.sizes.micro,
    color: COLORS.champagneGold,
    fontWeight: FONTS.weights.semiBold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginVertical: SPACING.md,
  },
  // Menu
  menuSection: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDERS.radius.md,
    marginBottom: SPACING.xxs,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  menuItemLabel: {
    fontSize: FONTS.sizes.body,
    color: COLORS.textPrimary,
    fontWeight: FONTS.weights.medium,
  },
  menuBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.champagneGold,
  },
  menuBadgeText: {
    display: 'none',
  },
  // Bottom
  bottomSection: {},
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  logoutText: {
    fontSize: FONTS.sizes.body,
    color: COLORS.danger,
    fontWeight: FONTS.weights.medium,
  },
  versionText: {
    fontSize: FONTS.sizes.micro,
    color: COLORS.textDisabled,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});

export default AppDrawer;