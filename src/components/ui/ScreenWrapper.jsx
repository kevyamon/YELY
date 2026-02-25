// src/components/ui/ScreenWrapper.jsx
// WRAPPER INTELLIGENT - Gestion dynamique de la StatusBar

import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/theme';

const ScreenWrapper = ({ 
  children, 
  style, 
  backgroundColor = COLORS.background,
  statusBarColor = 'transparent',
}) => {
  const insets = useSafeAreaInsets();
  
  // 🚀 INTELLIGENCE CROSS-PLATFORM : Détection du thème du téléphone
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      
      {/* Le style s'adapte automatiquement. 
        Si mode Nuit -> texte blanc ('light')
        Si mode Jour -> texte noir ('dark')
      */}
      <StatusBar 
        style={isDarkMode ? 'light' : 'dark'}
        backgroundColor={statusBarColor} 
        translucent={true} 
      />
      
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