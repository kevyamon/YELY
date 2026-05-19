// src/navigation/MarketplaceTabNavigator.jsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, DeviceEventEmitter, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSelector } from 'react-redux';
import { selectCartCount } from '../store/slices/cartSlice';

import MarketplaceHub from '../screens/marketplace/MarketplaceHub';
import Cart from '../screens/marketplace/Cart';
import ClientOrders from '../screens/marketplace/ClientOrders';
import THEME from '../theme/theme';

const Tab = createBottomTabNavigator();

// Dummy component pour l'onglet Catégories (l'événement de clic est intercepté)
const DummyCategories = () => null;

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const cartCount = useSelector(selectCartCount);

  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          // Vibrations légères si supporté
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }

          if (route.name === 'Categories') {
            const activeRouteName = state.routes[state.index].name;
            if (activeRouteName === 'Accueil') {
              DeviceEventEmitter.emit('toggle_categories_modal');
            }
            return;
          }

          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (isFocused) {
            // Effet ScrollToTop si l'onglet actif est cliqué à nouveau
            if (route.name === 'Accueil') {
              DeviceEventEmitter.emit('scroll_to_top_hub');
            } else if (route.name === 'Panier') {
              DeviceEventEmitter.emit('scroll_to_top_cart');
            } else if (route.name === 'Commandes') {
              DeviceEventEmitter.emit('scroll_to_top_orders');
            }
          } else if (!event.defaultPrevented) {
            navigation.navigate({ name: route.name, merge: true });
          }
        };

        let iconName = 'home';
        if (route.name === 'Accueil') {
          iconName = isFocused ? 'home' : 'home-outline';
        } else if (route.name === 'Categories') {
          iconName = 'grid-outline';
        } else if (route.name === 'Panier') {
          iconName = isFocused ? 'cart' : 'cart-outline';
        } else if (route.name === 'Commandes') {
          iconName = isFocused ? 'document-text' : 'document-text-outline';
        }

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons 
                name={iconName} 
                size={22} 
                color={isFocused ? THEME.COLORS.primary : THEME.COLORS.textTertiary} 
              />
              {route.name === 'Panier' && cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText} numberOfLines={1}>{cartCount}</Text>
                </View>
              )}
            </View>
            <Text style={[
              styles.tabLabel, 
              { color: isFocused ? THEME.COLORS.textPrimary : THEME.COLORS.textTertiary }
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const MarketplaceTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Tab.Screen 
        name="Accueil" 
        component={MarketplaceHub} 
        options={{ tabBarLabel: 'Accueil' }}
      />
      <Tab.Screen 
        name="Categories" 
        component={DummyCategories} 
        options={{ tabBarLabel: 'Catégories' }}
      />
      <Tab.Screen 
        name="Panier" 
        component={Cart} 
        options={{ tabBarLabel: 'Panier' }}
      />
      <Tab.Screen 
        name="Commandes" 
        component={ClientOrders} 
        options={{ tabBarLabel: 'Commandes' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 88 : 72,
    backgroundColor: THEME.COLORS.glassSurface,
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: THEME.FONTS.weights.medium,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#E74C3C',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#121212',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default MarketplaceTabNavigator;
