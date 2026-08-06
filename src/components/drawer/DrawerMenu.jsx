// src/components/drawer/DrawerMenu.jsx
// MENU LATERAL - Design Minimaliste & Immersif VIP (Zero Bulle / High-End Flow)
// CSCSM Level: Masterpiece UI / Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Linking, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Text } from 'react-native-paper';

import ENV from '../../config/env';
import THEME from '../../theme/theme';
import { getMenuItems } from './menuConfig';
import SettingsModal from './SettingsModal';

const DrawerMenu = ({ role, activeRoute, onNavigate, disabled }) => {
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const menuItems = getMenuItems(role);

  const handlePress = (route) => {
    if (route === 'SettingsModal') {
      setIsSettingsVisible(true);
    } else if (route === 'HelpModal') {
      Linking.openURL(ENV.YT_LINK).catch(() => {});
    } else {
      requestAnimationFrame(() => {
        onNavigate(route);
      });
    }
  };

  return (
    <View style={styles.container}>
      {menuItems.map((item, index) => {
        const isActive = activeRoute === item.route;

        const activeTextColor = isDarkMode ? THEME.COLORS.primary : '#121418';
        const inactiveTextColor = THEME.COLORS.textPrimary;
        const iconColor = isActive 
          ? (isDarkMode ? THEME.COLORS.primary : THEME.COLORS.primaryDark || '#D4AF37')
          : (isDarkMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(18, 20, 24, 0.6)');

        return (
          <TouchableOpacity
            key={item.id || index}
            style={[
              styles.menuItem,
              isActive && (isDarkMode ? styles.menuItemActiveDark : styles.menuItemActiveLight)
            ]}
            onPress={() => handlePress(item.route)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            {/* Barre d'accentuation minimale sur le côté gauche */}
            <View style={[styles.activeAccentBar, isActive && styles.activeAccentBarVisible]} />

            <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(18, 20, 24, 0.05)' }]}>
              <Ionicons
                name={isActive ? item.icon : `${item.icon}-outline`}
                size={22}
                color={iconColor}
              />
            </View>

            <Text 
              style={[
                styles.menuLabel,
                { color: isActive ? activeTextColor : inactiveTextColor },
                isActive && styles.menuLabelActive
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      <SettingsModal 
        visible={isSettingsVisible} 
        onClose={() => setIsSettingsVisible(false)} 
        onNavigate={onNavigate} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: THEME.SPACING.sm,
    paddingHorizontal: THEME.SPACING.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12, 
    paddingHorizontal: 16,
    marginBottom: 6,
    borderRadius: 14,
    width: '100%',
    backgroundColor: 'transparent',
    position: 'relative',
  },
  menuItemActiveLight: {
    backgroundColor: 'rgba(214, 175, 55, 0.12)',
  },
  menuItemActiveDark: {
    backgroundColor: 'rgba(214, 175, 55, 0.15)',
  },
  activeAccentBar: {
    position: 'absolute',
    left: 0,
    top: '20%',
    bottom: '20%',
    width: 3.5,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  activeAccentBarVisible: {
    backgroundColor: THEME.COLORS.primary,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600', 
    letterSpacing: 0.3,  
  },
  menuLabelActive: {
    fontWeight: '800', 
  }
});

export default DrawerMenu;