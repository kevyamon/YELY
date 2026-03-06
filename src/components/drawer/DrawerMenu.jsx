// src/components/drawer/DrawerMenu.jsx
// MENU LATERAL - Gestion des navigations et modales
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
                color={isActive ? THEME.COLORS.champagneGold : THEME.COLORS.textSecondary}
              />
            </View>

            <Text style={[
              styles.menuLabel,
              isActive && styles.menuLabelActive
            ]}>
              {item.label}
            </Text>

            <Ionicons 
              name={(item.route === 'SettingsModal' || item.route === 'HelpModal') ? "open-outline" : "chevron-forward"} 
              size={16} 
              color={isActive ? THEME.COLORS.champagneGold : THEME.COLORS.border} 
              style={{ opacity: 0.5 }}
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
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16, 
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'transparent', 
  },
  menuItemActive: {
    backgroundColor: THEME.COLORS.glassSurface, 
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)', 
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(128, 128, 128, 0.1)', 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)', 
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500', 
    color: THEME.COLORS.textSecondary,
    fontStyle: 'normal', 
    letterSpacing: 0.3,  
  },
  menuLabelActive: {
    color: THEME.COLORS.textPrimary, 
    fontWeight: '700', 
  }
});

export default DrawerMenu;