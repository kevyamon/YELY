// src/navigation/AppDrawer.jsx
// NAVIGATEUR PRINCIPAL - REDIRECTION FORCÉE PAR RÔLE

import { createDrawerNavigator } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
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
  const navigation = useNavigation();
  const user = useSelector(selectCurrentUser);
  
  // 1. DÉTECTION DU RÔLE
  const isDriver = user?.role === 'driver';
  const targetScreen = isDriver ? 'DriverHome' : 'RiderHome';

  // 2. REDIRECTION FORCÉE (Le "fix" ultime)
  useEffect(() => {
    if (user) {
      // On force la navigation vers le bon écran, sans historique précédent
      navigation.reset({
        index: 0,
        routes: [{ name: targetScreen }],
      });
    }
  }, [user?.role]); // Se déclenche si le rôle change ou au chargement

  const headerOffset = insets.top + THEME.LAYOUT.HEADER_HEIGHT;

  return (
    <Drawer.Navigator
      initialRouteName={targetScreen} // Fallback
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: 'right',
        drawerType: 'front',
        drawerStyle: {
          backgroundColor: THEME.COLORS.deepAsphalt,
          width: '80%',
          marginTop: headerOffset,
          borderTopLeftRadius: 20,
        },
        overlayColor: 'rgba(0,0,0,0.7)',
        // Désactive le retour arrière pour ne pas retourner sur la mauvaise home
        swipeEnabled: true, 
      }}
    >
      <Drawer.Screen name="RiderHome" component={RiderHome} />
      <Drawer.Screen name="DriverHome" component={DriverHome} />
    </Drawer.Navigator>
  );
}