// src/navigation/AppDrawer.jsx
// NAVIGATEUR PRINCIPAL - Gestion native du rôle

import { createDrawerNavigator } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import DriverHome from '../screens/home/DriverHome';
import RiderHome from '../screens/home/RiderHome';
import { selectCurrentUser } from '../store/slices/authSlice';
import THEME from '../theme/theme';
import DrawerContent from './DrawerContent';

const Drawer = createDrawerNavigator();

export default function AppDrawer() {
  const insets = useSafeAreaInsets();
  const user = useSelector(selectCurrentUser);
  
  // 1. DÉTECTION DU RÔLE
  // Cette variable est calculée AVANT l'affichage.
  // React Navigation va l'utiliser pour savoir quel écran afficher en premier.
  const isDriver = user?.role === 'driver';
  const targetScreen = isDriver ? 'DriverHome' : 'RiderHome';

  // 🗑️ SUPPRESSION DU USEEFFECT "RESET" QUI CAUSAIT LE BUG
  // La propriété initialRouteName ci-dessous suffit amplement.

  const headerOffset = insets.top + THEME.LAYOUT.HEADER_HEIGHT;

  return (
    <Drawer.Navigator
      // C'est ICI que la magie opère proprement
      initialRouteName={targetScreen} 
      
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right', // Drawer à droite (comme Uber)
        drawerType: 'front',
        drawerStyle: {
          backgroundColor: THEME.COLORS.deepAsphalt,
          width: '80%',
          marginTop: headerOffset,
          borderTopLeftRadius: 20,
        },
        overlayColor: 'rgba(0,0,0,0.7)',
        swipeEnabled: true, 
      }}
    >
      <Drawer.Screen name="RiderHome" component={RiderHome} />
      <Drawer.Screen name="DriverHome" component={DriverHome} />
    </Drawer.Navigator>
  );
}