import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import THEME from '../../theme/theme';

const AuthFormWrapper = ({ 
  children, 
  title, 
  subtitle, 
  onBack, 
  actionButton 
}) => {
  // Configuration intelligente du clavier pour PWA et APK
  // Sur Web (PWA), le navigateur gère le clavier, on ne met pas de behavior pour éviter les bugs de réduction
  // Sur iOS, 'padding' est le plus fluide
  // Sur Android, 'height' pousse bien la vue
  const keyboardBehavior = Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined;
  const keyboardVerticalOffset = Platform.OS === 'ios' ? 40 : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={keyboardBehavior}
        verticalOffset={keyboardVerticalOffset}
        style={styles.keyboardContainer}
        enabled={Platform.OS !== 'web'} // Désactive le KeyboardAvoidingView sur PWA
      >
        <View style={styles.headerContainer}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color={THEME.COLORS.textPrimary} />
            </TouchableOpacity>
          )}
          {title && <Text style={styles.welcomeText}>{title}</Text>}
          {subtitle && <Text style={styles.subText}>{subtitle}</Text>}
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          // Sur le web, le scroll natif du navigateur prend le relais
        >
          <View style={styles.formContent}>
            {children}
          </View>
          
          {actionButton && (
            <View style={styles.actionContainer}>
              {actionButton}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: THEME.COLORS.background 
  },
  keyboardContainer: { 
    flex: 1 
  },
  headerContainer: { 
    paddingHorizontal: THEME.SPACING.xl, 
    paddingTop: THEME.SPACING.md, 
    marginBottom: THEME.SPACING.lg 
  },
  iconButton: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'flex-start', 
    marginBottom: THEME.SPACING.md 
  },
  welcomeText: { 
    color: THEME.COLORS.textPrimary, 
    fontSize: THEME.FONTS.sizes.hero, 
    fontWeight: THEME.FONTS.weights.bold, 
    lineHeight: 40 
  },
  subText: { 
    color: THEME.COLORS.textSecondary, 
    fontSize: THEME.FONTS.sizes.body, 
    marginTop: THEME.SPACING.sm 
  },
  scrollContent: { 
    flexGrow: 1, 
    paddingHorizontal: THEME.SPACING.xl, 
    paddingBottom: THEME.SPACING.xxl,
    justifyContent: 'space-between',
  },
  formContent: {
    // Pas de cadre rigide, les éléments flottent librement
  },
  actionContainer: {
    paddingTop: THEME.SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? THEME.SPACING.xl : THEME.SPACING.lg,
  }
});

export default AuthFormWrapper;