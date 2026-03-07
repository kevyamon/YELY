// src/screens/MenuScreen.jsx
// PAGE MENU PRINCIPALE - Rafraichissement de Session au Montage
// STANDARD: Industriel / Bank Grade

import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

// Composants UI
import DrawerFooter from '../components/drawer/DrawerFooter';
import DrawerHeader from '../components/drawer/DrawerHeader';
import DrawerMenu from '../components/drawer/DrawerMenu';

// Logique Metier
import { forceSilentRefresh, logout, selectCurrentUser } from '../store/slices/authSlice';
import THEME from '../theme/theme';

const MenuScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
  const user = useSelector(selectCurrentUser);
  const role = user?.role || 'rider'; 

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // MISE A JOUR SILENCIEUSE : On rafraichit le profil a chaque ouverture de menu
  useEffect(() => {
    dispatch(forceSilentRefresh());
  }, [dispatch]);

  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(role === 'driver' ? 'DriverHome' : 'RiderHome');
    }
  };

  const handleNavigate = (routeKey) => {
    try {
      navigation.navigate(routeKey);
    } catch (error) {
      console.warn("Route introuvable ou erreur navigation:", routeKey);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      dispatch(logout());
      setIsLoggingOut(false);
    }, 800);
  };

  return (
    <View style={[
      styles.container, 
      { paddingTop: insets.top, paddingBottom: insets.bottom }
    ]}>
      
      <DrawerHeader 
        user={user} 
        role={role} 
        onClose={handleClose} 
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DrawerMenu 
          role={role}
          activeRoute={role === 'driver' ? 'DriverHome' : 'RiderHome'} 
          onNavigate={handleNavigate}
          disabled={isLoggingOut}
        />
      </ScrollView>

      <View style={styles.footerSection}>
        <DrawerFooter 
          onLogout={handleLogout} 
          isLoggingOut={isLoggingOut}
        />
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.background,
  },
  scrollContent: {
    paddingVertical: THEME.SPACING.md,
  },
  footerSection: {
    borderTopWidth: 0, // Suppression de la ligne de séparation
    borderTopColor: THEME.COLORS.border,
  },
});

export default MenuScreen;