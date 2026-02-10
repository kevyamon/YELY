// src/components/drawer/DrawerMenu.jsx

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

import { BORDERS, COLORS, FONTS, SPACING } from '../../theme/theme';
import MENU_ITEMS from './menuConfig';

const DrawerMenu = ({ role, activeRoute, onNavigate, disabled }) => {
  const menuItems = MENU_ITEMS[role] || MENU_ITEMS.rider;

  return (
    <View style={styles.container}>
      {menuItems.map((item) => {
        const isActive = activeRoute === item.key;

        return (
          <TouchableOpacity
            key={item.key}
            activeOpacity={0.7}
            disabled={disabled}
            style={[
              styles.menuItem,
              isActive && styles.menuItemActive,
            ]}
            onPress={() => onNavigate(item.key)}
          >
            <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
              <Ionicons
                name={isActive ? item.iconActive : item.icon}
                size={22}
                color={isActive ? COLORS.champagneGold : COLORS.textSecondary}
              />
            </View>

            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
              ]}
            >
              {item.label}
            </Text>

            {item.badge && (
              <View style={styles.badgeDot} />
            )}

            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDERS.radius.lg,
    marginBottom: SPACING.xs,
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: BORDERS.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(242, 244, 246, 0.05)',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  label: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.bodySmall,
    fontWeight: FONTS.weights.medium,
    marginLeft: SPACING.md,
  },
  labelActive: {
    color: COLORS.champagneGold,
    fontWeight: FONTS.weights.semiBold,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
    marginLeft: SPACING.sm,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '25%',
    bottom: '25%',
    width: 3,
    borderRadius: 2,
    backgroundColor: COLORS.champagneGold,
  },
});

export default DrawerMenu;