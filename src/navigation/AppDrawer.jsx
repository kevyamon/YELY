// src/navigation/AppDrawer.jsx
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DriverHome from '../screens/home/DriverHome';
import RiderHome from '../screens/home/RiderHome';
import THEME from '../theme/theme';
import DrawerContent from './DrawerContent';

const Drawer = createDrawerNavigator();

export default function AppDrawer() {
  const insets = useSafeAreaInsets();
  
  // On décale le drawer vers le bas pour qu'il ne cache pas le Header
  const headerOffset = insets.top + THEME.LAYOUT.HEADER_HEIGHT;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right', // ➡️ LE DRAWER S'OUVRE À DROITE
        drawerType: 'front',
        drawerStyle: {
          backgroundColor: THEME.COLORS.deepAsphalt,
          width: '80%',
          marginTop: headerOffset,
          borderTopLeftRadius: 20, // Arrondi du côté gauche maintenant (vu qu'il sort de droite)
        },
        overlayColor: 'rgba(0,0,0,0.7)',
      }}
    >
      <Drawer.Screen name="RiderHome" component={RiderHome} />
      <Drawer.Screen name="DriverHome" component={DriverHome} />
    </Drawer.Navigator>
  );
}