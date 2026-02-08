// src/navigation/AppDrawer.jsx

import { createDrawerNavigator } from '@react-navigation/drawer';
import { Platform, Text, View } from 'react-native';
import { useSelector } from 'react-redux';

import { selectUserRole } from '../store/slices/authSlice';
import { COLORS, DIMENSIONS } from '../theme/theme';
import DrawerContent from './DrawerContent';

// Screens
import DriverHome from '../screens/home/DriverHome';
import RiderHome from '../screens/home/RiderHome';

// Placeholder temporaire pour les écrans non encore codés
const PlaceholderScreen = ({ route }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.deepAsphalt }}>
    <Text style={{ color: 'white', fontSize: 18 }}>
      Écran {route?.name || 'inconnu'} en construction
    </Text>
  </View>
);

const Drawer = createDrawerNavigator();

const AppDrawer = () => {
  const role = useSelector(selectUserRole) || 'rider';

  // Déterminer l'écran initial selon le rôle
  const getInitialRoute = () => {
    if (role === 'driver') return 'DriverHome';
    if (role === 'admin' || role === 'superadmin') return 'AdminDashboard';
    return 'RiderHome';
  };

  return (
    <Drawer.Navigator
      initialRouteName={getInitialRoute()}
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right',
        drawerType: Platform.OS === 'web' ? 'permanent' : 'front',
        drawerStyle: {
          backgroundColor: 'transparent',
          width: Math.min(DIMENSIONS.sidebar.width, DIMENSIONS.sidebar.maxWidth),
        },
        overlayColor: 'rgba(0, 0, 0, 0.60)',
        swipeEnabled: true,
        swipeEdgeWidth: 50,
      }}
    >
      {/* ═══════ ÉCRANS RIDER ═══════ */}
      <Drawer.Screen name="RiderHome" component={RiderHome} />

      {/* ═══════ ÉCRANS DRIVER ═══════ */}
      <Drawer.Screen name="DriverHome" component={DriverHome} />
      <Drawer.Screen name="Subscription" component={PlaceholderScreen} />

      {/* ═══════ ÉCRANS ADMIN / SUPERADMIN ═══════ */}
      <Drawer.Screen name="AdminDashboard" component={PlaceholderScreen} />
      <Drawer.Screen name="Validations" component={PlaceholderScreen} />
      <Drawer.Screen name="Drivers" component={PlaceholderScreen} />
      <Drawer.Screen name="Finance" component={PlaceholderScreen} />

      {/* ═══════ ÉCRANS COMMUNS ═══════ */}
      <Drawer.Screen name="History" component={PlaceholderScreen} />
      <Drawer.Screen name="Notifications" component={PlaceholderScreen} />
      <Drawer.Screen name="Profile" component={PlaceholderScreen} />
    </Drawer.Navigator>
  );
};

export default AppDrawer;