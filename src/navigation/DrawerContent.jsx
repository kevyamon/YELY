// src/navigation/DrawerContent.jsx

import { useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import DrawerFooter from '../components/drawer/DrawerFooter';
import DrawerHeader from '../components/drawer/DrawerHeader';
import DrawerLogoutOverlay from '../components/drawer/DrawerLogoutOverlay';
import DrawerMenu from '../components/drawer/DrawerMenu';
import { useLogoutMutation } from '../store/api/usersApiSlice';
import { logout, selectCurrentUser, selectUserRole } from '../store/slices/authSlice';
import { BORDERS, COLORS, SPACING } from '../theme/theme';

const DrawerContent = (props) => {
  const { navigation, state } = props;
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const user = useSelector(selectCurrentUser);
  const role = useSelector(selectUserRole) || 'rider';
  const [logoutApi] = useLogoutMutation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Écran actif
  const activeRoute = state?.routes?.[state.index]?.name || '';

  // Déconnexion avec animation
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await logoutApi().unwrap();
    } catch (e) {
      console.warn('[Logout] Erreur API, déconnexion locale:', e);
    } finally {
      setTimeout(() => {
        dispatch(logout());
      }, 300);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top },
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <DrawerLogoutOverlay visible={isLoggingOut} />

      <DrawerHeader user={user} role={role} />

      <View style={styles.divider} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DrawerMenu
          role={role}
          activeRoute={activeRoute}
          onNavigate={(screen) => navigation.navigate(screen)}
          disabled={isLoggingOut}
        />
      </ScrollView>

      <View style={styles.divider} />

      <DrawerFooter
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        paddingBottom={insets.bottom + SPACING.md}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.glassDark,
    borderRightWidth: BORDERS.width.thin,
    borderRightColor: COLORS.glassBorder,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
    marginHorizontal: SPACING.xl,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default DrawerContent;