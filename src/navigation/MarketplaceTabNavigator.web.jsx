// src/navigation/MarketplaceTabNavigator.web.jsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, DeviceEventEmitter } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import MarketplaceHub from '../screens/marketplace/MarketplaceHub';
import Cart from '../screens/marketplace/Cart';
import ClientOrders from '../screens/marketplace/ClientOrders';
import THEME from '../theme/theme';

const Tab = createBottomTabNavigator();
const DummyCategories = () => null;

const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBarInner}>
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
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={iconName} 
                size={22} 
                color={isFocused ? THEME.COLORS.primary : THEME.COLORS.textTertiary} 
              />
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
    height: 64,
    backgroundColor: THEME.COLORS.glassSurface,
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.border,
    paddingTop: 8,
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBarInner: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 600,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    cursor: 'pointer',
  },
  tabLabel: {
    fontSize: THEME.FONTS.sizes.micro + 1,
    fontWeight: THEME.FONTS.weights.medium,
  },
});

export default MarketplaceTabNavigator;
