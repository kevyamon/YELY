// src/components/drawer/DrawerMenu.jsx
// MENU LATERAL - UX Franche & Adaptative (Mode Jour/Nuit)
// CSCSM Level: Bank Grade

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
        
        // Contraste dynamique : texte sombre sur fond jaune, texte theme sur fond transparent
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
            activeOpacity={0.7}
          >
            <View style={[
              styles.iconContainer,
              isActive && styles.iconContainerActive
            ]}>
              <Ionicons
                name={isActive ? item.icon : `${item.icon}-outline`}
                size={22}
                color={isActive ? activeColor : THEME.COLORS.champagneGold}
              />
            </View>

            <Text style={[
              styles.menuLabel,
              { color: isActive ? activeColor : inactiveColor },
              isActive && styles.menuLabelActive
            ]}>
              {item.label}
            </Text>

            <Ionicons 
              name={(item.route === 'SettingsModal' || item.route === 'HelpModal') ? "open-outline" : "chevron-forward"} 
              size={18} 
              color={isActive ? activeColor : THEME.COLORS.champagneGold} 
              style={{ opacity: isActive ? 1 : 0.6 }}
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
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14, 
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: 'transparent', // Transparent pour s'adapter au mode jour/nuit
    borderWidth: 2, // BORDURE JAUNE TRÈS EXPRIMÉE
    borderColor: THEME.COLORS.champagneGold, 
  },
  menuItemActive: {
    backgroundColor: THEME.COLORS.champagneGold, // FOND JAUNE SI ACTIF
    // La bordure est déjà jaune grâce à menuItem
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'transparent', 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainerActive: {
    backgroundColor: 'transparent', // L'icône repose directement sur le fond jaune du bouton
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600', 
    letterSpacing: 0.3,  
  },
  menuLabelActive: {
    fontWeight: 'bold', 
  }
});

export default DrawerMenu;