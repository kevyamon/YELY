// src/navigation/AppDrawer.jsx
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import crucial

import DriverHome from '../screens/home/DriverHome';
import RiderHome from '../screens/home/RiderHome';
import THEME from '../theme/theme';
import DrawerContent from './DrawerContent';

const Drawer = createDrawerNavigator();

export default function AppDrawer() {
  const insets = useSafeAreaInsets();
  
  // CALCUL CRUCIAL : Hauteur Notch + Hauteur Header
  const headerOffset = insets.top + THEME.LAYOUT.HEADER_HEIGHT;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false, // On utilise notre propre ScreenHeader
        drawerType: 'front', // Le tiroir passe devant le contenu (mais sous le header grâce au style)
        drawerStyle: {
          backgroundColor: THEME.COLORS.deepAsphalt,
          width: '80%',
          marginTop: headerOffset, // LE SECRET : On décale le tiroir vers le bas
          borderTopRightRadius: 20, // Petit style sympa
        },
        // Pour l'overlay (le voile noir), c'est plus complexe à limiter nativement,
        // mais avec drawerType 'front' et le style ci-dessus, le menu sera visuellement correct.
        overlayColor: 'rgba(0,0,0,0.7)',
      }}
    >
      <Drawer.Screen name="RiderHome" component={RiderHome} />
      <Drawer.Screen name="DriverHome" component={DriverHome} />
    </Drawer.Navigator>
  );
}