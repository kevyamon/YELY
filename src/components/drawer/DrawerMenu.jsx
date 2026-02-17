// src/components/drawer/DrawerMenu.jsx
// MENU LISTE - Nettoyé & Redressé (Aucun italique, aucun skew)

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

import THEME from '../../theme/theme';
import { getMenuItems } from './menuConfig';

const DrawerMenu = ({ role, activeRoute, onNavigate, disabled }) => {
  // Récupération des items selon le rôle
  const menuItems = getMenuItems(role);

  return (
    <View style={styles.container}>
      {menuItems.map((item, index) => {
        const isActive = activeRoute === item.route;

        return (
          <TouchableOpacity
            key={item.id || index}
            style={[
              styles.menuItem,
              isActive && styles.menuItemActive
            ]}
            onPress={() => onNavigate(item.route)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            {/* ICÔNE */}
            <View style={[
              styles.iconContainer,
              isActive && styles.iconContainerActive
            ]}>
              <Ionicons
                name={isActive ? item.icon : `${item.icon}-outline`}
                size={22}
                color={isActive ? THEME.COLORS.champagneGold : THEME.COLORS.textSecondary}
              />
            </View>

            {/* TEXTE (Droit et Lisible) */}
            <Text style={[
              styles.menuLabel,
              isActive && styles.menuLabelActive
            ]}>
              {item.label}
            </Text>

            {/* FLÈCHE BOUT (Optionnel, pour montrer que c'est cliquable) */}
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={isActive ? THEME.COLORS.champagneGold : THEME.COLORS.border} 
              style={{ opacity: 0.5 }}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: THEME.SPACING.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16, // Plus d'espace pour le doigt
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'transparent', // Par défaut transparent
    // Pas de border par défaut pour alléger
  },
  menuItemActive: {
    backgroundColor: THEME.COLORS.glassSurface, // Fond subtil si actif
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)', // Bordure Or légère
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(128, 128, 128, 0.1)', // Gris très léger
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)', // Or léger
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500', // Medium pour la lisibilité
    color: THEME.COLORS.textSecondary,
    fontStyle: 'normal', // ⚠️ On force le style NORMAL (pas italique)
    letterSpacing: 0.3,  // Un peu d'air
    // Pas de transform ici !
  },
  menuLabelActive: {
    color: THEME.COLORS.textPrimary, // Noir (Jour) ou Blanc (Nuit)
    fontWeight: '700', // Gras si actif
  },
});

export default DrawerMenu;