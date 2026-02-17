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
    navigation.goBack();
  };

  // 3. Gestion de la Navigation
  const handleNavigate = (routeKey) => {
    try {
      // On ferme le menu d'abord, puis on navigue (ou l'inverse selon l'effet voulu)
      // Ici navigation directe, le menu est une page de la stack
      navigation.navigate(routeKey);
    } catch (error) {
      console.warn("Route introuvable ou erreur navigation:", routeKey);
    }
  };

  // 4. Gestion de la Déconnexion
  const handleLogout = async () => {
    setIsLoggingOut(true);
    // Simulation d'un petit délai pour l'UX (optionnel)
    setTimeout(() => {
      dispatch(logout());
      // La navigation vers 'Landing' se fera automatiquement via AppNavigator
      // qui écoute l'état isAuthenticated
      setIsLoggingOut(false);
    }, 800);
  };

  return (
    <View style={[
      styles.container, 
      { paddingTop: insets.top, paddingBottom: insets.bottom }
    ]}>
      
      {/* HEADER : Infos User + Bouton Fermer */}
      <View style={styles.headerSection}>
        <DrawerHeader 
          user={user} 
          role={role} 
          onClose={handleClose} 
        />
      </View>

      {/* MENU : Liste des liens */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DrawerMenu 
          role={role}
          activeRoute={role === 'driver' ? 'DriverHome' : 'RiderHome'} // On simule l'accueil actif par défaut
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
  headerSection: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.border,
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