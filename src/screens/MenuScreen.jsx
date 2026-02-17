// src/screens/MenuScreen.jsx
// PAGE MENU PRINCIPALE (Connectée au Store & Navigation)
// Remplace l'ancien Drawer latéral.

import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

// Composants UI
import DrawerFooter from '../components/drawer/DrawerFooter';
import DrawerHeader from '../components/drawer/DrawerHeader';
import DrawerMenu from '../components/drawer/DrawerMenu';

// Logique Métier
import { logout, selectCurrentUser } from '../store/slices/authSlice';
import THEME from '../theme/theme';

const MenuScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  
  // 1. Récupération des Données Réelles (Redux)
  const user = useSelector(selectCurrentUser);
  const role = user?.role || 'rider'; // Fallback sécurité

  // État local pour le loading du logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 2. Gestion de la fermeture
  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback si on ne peut pas revenir en arrière (ne devrait pas arriver)
      navigation.navigate(role === 'driver' ? 'DriverHome' : 'RiderHome');
    }
  };

  // 3. Gestion de la Navigation
  const handleNavigate = (routeKey) => {
    try {
      // Pour les pages en construction, ça ira vers le Placeholder défini dans AppNavigator
      navigation.navigate(routeKey);
    } catch (error) {
      console.warn("Route introuvable ou erreur navigation:", routeKey);
    }
  };

  // 4. Gestion de la Déconnexion
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
      
      {/* HEADER : Infos User + Bouton Fermer */}
      <DrawerHeader 
        user={user} 
        role={role} 
        onClose={handleClose} 
      />

      {/* MENU : Liste des liens */}
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

      {/* FOOTER : Déconnexion + Version */}
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
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.border,
  },
});

export default MenuScreen;