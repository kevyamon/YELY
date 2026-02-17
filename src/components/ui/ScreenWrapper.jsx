// src/components/ui/ScreenWrapper.jsx
import { KeyboardAvoidingView, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/theme';

const ScreenWrapper = ({ 
  children, 
  style, 
  backgroundColor = COLORS.background,
  statusBarColor = 'transparent', // Par défaut transparent pour l'effet "plein écran"
  statusBarStyle = 'dark-content' // CORRECTION : dark-content par défaut pour fond clair
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Configuration StatusBar pour Android/iOS :
        - translucent: Permet au contenu de passer SOUS la barre d'état (Android)
        - backgroundColor: Transparent pour voir le dégradé/header
      */}
      <StatusBar 
        barStyle={statusBarStyle} 
        backgroundColor={statusBarColor} 
        translucent={true} 
      />
      
      {/* NOTE : On a retiré le "paddingTop: insets.top" ici.
        C'est maintenant le SmartHeader qui gérera cet espace pour l'effet immersif.
      */}
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <View style={[styles.content, style]}>
          {children}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default ScreenWrapper;