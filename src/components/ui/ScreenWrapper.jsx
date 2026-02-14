// src/components/ui/ScreenWrapper.jsx
import { StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import THEME from '../../theme/theme';

export default function ScreenWrapper({ children, style, withHeader = false }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container, 
      { 
        // Si on a un header custom, on applique juste le padding top pour le status bar
        // Sinon, on laisse le contenu gérer ou on applique un padding standard
        paddingTop: insets.top,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      },
      style
    ]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent={true} 
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.deepAsphalt, // Fond par défaut de l'app
  },
});