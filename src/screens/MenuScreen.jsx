// src/screens/MenuScreen.jsx
// NOUVELLE PAGE MENU (Style Facebook)
// Remplace l'ancien Drawer latéral par une vue plein écran immersive.

import { useNavigation } from '@react-navigation/native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Réutilisation des composants du Drawer existant (Le contenu reste le même)
import DrawerFooter from '../components/drawer/DrawerFooter';
import DrawerHeader from '../components/drawer/DrawerHeader';
import DrawerMenu from '../components/drawer/DrawerMenu';
import THEME from '../theme/theme';

const MenuScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      
      {/* 1. EN-TÊTE (Avec bouton retour géré par handleClose) */}
      <View style={styles.headerSection}>
        <DrawerHeader onClose={handleClose} isFullScreen={true} />
      </View>

      {/* 2. MENU DÉFILANT */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DrawerMenu />
      </ScrollView>

      {/* 3. PIED DE PAGE */}
      <View style={styles.footerSection}>
        <DrawerFooter />
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.background, // S'adapte au thème (Noir ou Blanc)
  },
  headerSection: {
    paddingHorizontal: THEME.SPACING.md,
    marginBottom: THEME.SPACING.md,
  },
  scrollContent: {
    paddingHorizontal: THEME.SPACING.md,
    paddingBottom: THEME.SPACING.xl,
  },
  footerSection: {
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.md,
  },
});

export default MenuScreen;