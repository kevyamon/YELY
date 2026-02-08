// src/navigation/DrawerContent.jsx

import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { useLogoutMutation } from '../store/api/usersApiSlice';
import { logout, selectCurrentUser, selectUserRole } from '../store/slices/authSlice';
import {
    BORDERS,
    COLORS,
    FONTS,
    SPACING
} from '../theme/theme';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION DES MENUS PAR RÔLE
// ═══════════════════════════════════════════════════════════════
const MENU_ITEMS = {
  rider: [
    { key: 'RiderHome', label: 'Accueil', icon: 'home-outline', iconActive: 'home' },
    { key: 'History', label: 'Historique', icon: 'time-outline', iconActive: 'time' },
    { key: 'Notifications', label: 'Notifications', icon: 'notifications-outline', iconActive: 'notifications' },
    { key: 'Profile', label: 'Mon Profil', icon: 'person-outline', iconActive: 'person' },
  ],
  driver: [
    { key: 'DriverHome', label: 'Accueil', icon: 'car-outline', iconActive: 'car' },
    { key: 'Subscription', label: 'Abonnement', icon: 'card-outline', iconActive: 'card' },
    { key: 'History', label: 'Historique', icon: 'time-outline', iconActive: 'time' },
    { key: 'Notifications', label: 'Notifications', icon: 'notifications-outline', iconActive: 'notifications' },
    { key: 'Profile', label: 'Mon Profil', icon: 'person-outline', iconActive: 'person' },
  ],
  admin: [
    { key: 'AdminDashboard', label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid' },
    { key: 'Validations', label: 'Validations', icon: 'checkmark-circle-outline', iconActive: 'checkmark-circle', badge: true },
    { key: 'Drivers', label: 'Chauffeurs', icon: 'people-outline', iconActive: 'people' },
    { key: 'Notifications', label: 'Notifications', icon: 'notifications-outline', iconActive: 'notifications' },
    { key: 'Profile', label: 'Mon Profil', icon: 'person-outline', iconActive: 'person' },
  ],
  superadmin: [
    { key: 'AdminDashboard', label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid' },
    { key: 'Validations', label: 'Validations', icon: 'checkmark-circle-outline', iconActive: 'checkmark-circle', badge: true },
    { key: 'Drivers', label: 'Chauffeurs', icon: 'people-outline', iconActive: 'people' },
    { key: 'Finance', label: 'Finance', icon: 'wallet-outline', iconActive: 'wallet' },
    { key: 'Notifications', label: 'Notifications', icon: 'notifications-outline', iconActive: 'notifications' },
    { key: 'Profile', label: 'Mon Profil', icon: 'person-outline', iconActive: 'person' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
const DrawerContent = (props) => {
  const { navigation, state } = props;
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const user = useSelector(selectCurrentUser);
  const role = useSelector(selectUserRole) || 'rider';
  const [logoutApi] = useLogoutMutation();

  // Déterminer l'écran actif
  const activeRoute = state?.routes?.[state.index]?.name || '';

  // Récupérer le menu correspondant au rôle
  const menuItems = MENU_ITEMS[role] || MENU_ITEMS.rider;

  // Obtenir les initiales de l'utilisateur
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  // Obtenir le label du rôle
  const getRoleLabel = (userRole) => {
    switch (userRole) {
      case 'driver': return 'Chauffeur';
      case 'admin': return 'Administrateur';
      case 'superadmin': return 'Super Admin';
      default: return 'Passager';
    }
  };

  // Déconnexion
  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch (e) {
      // Même si l'API échoue, on déconnecte localement
      console.warn('[Logout] Erreur API, déconnexion locale:', e);
    } finally {
      dispatch(logout());
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ═══════ HEADER : PROFIL UTILISATEUR ═══════ */}
      <View style={styles.headerSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>
          <View style={styles.onlineIndicator} />
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.name || 'Utilisateur'}
          </Text>
          <Text style={styles.userPhone} numberOfLines={1}>
            {user?.phone || user?.email || ''}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{getRoleLabel(role)}</Text>
          </View>
        </View>
      </View>

      {/* ═══════ SÉPARATEUR ═══════ */}
      <View style={styles.divider} />

      {/* ═══════ LISTE DES LIENS ═══════ */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((item) => {
          const isActive = activeRoute === item.key;

          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.7}
              style={[
                styles.menuItem,
                isActive && styles.menuItemActive,
              ]}
              onPress={() => navigation.navigate(item.key)}
            >
              <View style={[styles.menuIconContainer, isActive && styles.menuIconContainerActive]}>
                <Ionicons
                  name={isActive ? item.iconActive : item.icon}
                  size={22}
                  color={isActive ? COLORS.champagneGold : COLORS.textSecondary}
                />
              </View>

              <Text
                style={[
                  styles.menuLabel,
                  isActive && styles.menuLabelActive,
                ]}
              >
                {item.label}
              </Text>

              {/* Badge pour les notifications/validations */}
              {item.badge && (
                <View style={styles.badgeDot} />
              )}

              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>

      {/* ═══════ SÉPARATEUR ═══════ */}
      <View style={styles.divider} />

      {/* ═══════ FOOTER : DÉCONNEXION ═══════ */}
      <View style={[styles.footerSection, { paddingBottom: insets.bottom + SPACING.md }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Yély v1.0.0</Text>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.glassDark,
    borderRightWidth: BORDERS.width.thin,
    borderRightColor: COLORS.glassBorder,
  },

  // ─── HEADER ───
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: BORDERS.width.medium,
    borderColor: COLORS.champagneGold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.champagneGold,
    fontSize: FONTS.sizes.h4,
    fontWeight: FONTS.weights.bold,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.glassDark,
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  userName: {
    color: COLORS.moonlightWhite,
    fontSize: FONTS.sizes.body,
    fontWeight: FONTS.weights.semiBold,
  },
  userPhone: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.caption,
    marginTop: SPACING.xxs,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: BORDERS.radius.pill,
    borderWidth: BORDERS.width.thin,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  roleBadgeText: {
    color: COLORS.champagneGold,
    fontSize: FONTS.sizes.micro,
    fontWeight: FONTS.weights.semiBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ─── DIVIDER ───
  divider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginHorizontal: SPACING.xl,
  },

  // ─── MENU ───
  scrollContent: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDERS.radius.lg,
    marginBottom: SPACING.xs,
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: BORDERS.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(242, 244, 246, 0.05)',
  },
  menuIconContainerActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  menuLabel: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.bodySmall,
    fontWeight: FONTS.weights.medium,
    marginLeft: SPACING.md,
  },
  menuLabelActive: {
    color: COLORS.champagneGold,
    fontWeight: FONTS.weights.semiBold,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
    marginLeft: SPACING.sm,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '25%',
    bottom: '25%',
    width: 3,
    borderRadius: 2,
    backgroundColor: COLORS.champagneGold,
  },

  // ─── FOOTER ───
  footerSection: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDERS.radius.lg,
    backgroundColor: 'rgba(231, 76, 60, 0.08)',
    borderWidth: BORDERS.width.thin,
    borderColor: 'rgba(231, 76, 60, 0.15)',
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: FONTS.sizes.bodySmall,
    fontWeight: FONTS.weights.medium,
    marginLeft: SPACING.md,
  },
  versionText: {
    color: COLORS.textDisabled,
    fontSize: FONTS.sizes.micro,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});

export default DrawerContent;