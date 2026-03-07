// src/components/drawer/DrawerMenu.jsx
// MENU LATERAL - Concept "Dynamic Pill" (Mobile-First & High-End UX)
// CSCSM Level: Bank Grade / Premium UI

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

import THEME from '../../theme/theme';
import HelpVideoModal from '../help/HelpVideoModal';
import SettingsModal from './SettingsModal';
import { getMenuItems } from './menuConfig';

const DrawerMenu = ({ role, activeRoute, onNavigate, disabled }) => {
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  
  const menuItems = getMenuItems(role);

  const handlePress = (route) => {
    if (route === 'SettingsModal') {
      setIsSettingsVisible(true);
    } else if (route === 'HelpModal') {
      setIsHelpVisible(true);
    } else {
      onNavigate(route);
    }
  };

  return (
    <View style={styles.container}>
      {menuItems.map((item, index) => {
        const isActive = activeRoute === item.route;
        
        // Contraste parfait : texte sombre sur fond jaune, texte clair/adaptatif sur fond transparent
        const activeColor = THEME.COLORS.deepAsphalt || '#121418'; 
        const inactiveColor = THEME.COLORS.textPrimary;

        return (
          <TouchableOpacity
            key={item.id || index}
            style={[
              styles.menuItem,
              isActive && styles.menuItemActive
            ]}
            onPress={() => handlePress(item.route)}
            disabled={disabled}
            activeOpacity={0.8}
          >
            <View style={[
              styles.iconContainer,
              isActive && styles.iconContainerActive
            ]}>
              <Ionicons
                name={isActive ? item.icon : `${item.icon}-outline`}
                size={20} // Icône légèrement réduite pour un look plus raffiné
                color={isActive ? activeColor : THEME.COLORS.champagneGold}
              />
            </View>

            <Text style={[
              styles.menuLabel,
              { color: isActive ? activeColor : inactiveColor },
              isActive && styles.menuLabelActive
            ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>

            <Ionicons 
              name={(item.route === 'SettingsModal' || item.route === 'HelpModal') ? "open-outline" : "chevron-forward"} 
              size={16} 
              color={isActive ? activeColor : THEME.COLORS.champagneGold} 
              style={{ opacity: isActive ? 0.8 : 0.6 }}
            />
          </TouchableOpacity>
        );
      })}

      <SettingsModal 
        visible={isSettingsVisible} 
        onClose={() => setIsSettingsVisible(false)} 
        onNavigate={onNavigate} 
      />
      
      <HelpVideoModal
        visible={isHelpVisible}
        onClose={() => setIsHelpVisible(false)}
        role={role}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: THEME.SPACING.md,
    paddingHorizontal: THEME.SPACING.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12, 
    paddingHorizontal: 14,
    marginBottom: 14,
    borderRadius: 30, // La fameuse "Pilule" parfaite
    width: '85%', // LONGUEUR RÉDUITE (Ne touche plus les bords)
    alignSelf: 'flex-start', // S'aligne à gauche
    backgroundColor: 'transparent',
    borderWidth: 1.5, // Bordure bien exprimée
    borderColor: THEME.COLORS.champagneGold, 
  },
  menuItemActive: {
    width: '95%', // LA SURPRISE : Le bouton s'allonge quand on clique dessus !
    backgroundColor: THEME.COLORS.champagneGold, 
    borderWidth: 1.5,
    borderColor: THEME.COLORS.champagneGold,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent', 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // Très léger cercle sombre autour de l'icône sur fond jaune
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600', 
    letterSpacing: 0.5,  
  },
  menuLabelActive: {
    fontWeight: '900', // Police plus massive pour l'état actif
  }
});

export default DrawerMenu;