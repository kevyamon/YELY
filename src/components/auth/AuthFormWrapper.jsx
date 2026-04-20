//src/components/auth/AuthFormWrapper.jsx
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
  footer,
  containerStyle 
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardContainer}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, containerStyle]} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {onBack && (
            <View style={styles.topNavigation}>
              <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.headerContainer}>
            <Text style={styles.welcomeText}>{title}</Text>
            {subtitle && <Text style={styles.subText}>{subtitle}</Text>}
          </View>

          <View style={styles.glassWrapper}>
            {children}
          </View>

          {footer && (
            <View style={styles.footerContainer}>
              {footer}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.COLORS.background },
  keyboardContainer: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    paddingHorizontal: THEME.SPACING.xl, 
    paddingBottom: Platform.OS === 'ios' ? 40 : 20 
  },
  topNavigation: { height: 64, justifyContent: 'center' },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerContainer: { marginBottom: THEME.SPACING.xxl, marginTop: THEME.SPACING.md },
  welcomeText: { 
    color: THEME.COLORS.primary, 
    fontSize: THEME.FONTS.sizes.hero, 
    fontWeight: THEME.FONTS.weights.bold, 
    lineHeight: 40 
  },
  subText: { 
    color: THEME.COLORS.textSecondary, 
    fontSize: THEME.FONTS.sizes.body, 
    marginTop: THEME.SPACING.sm 
  },
  glassWrapper: { 
    ...THEME.GLASS.card, 
    padding: THEME.SPACING.xl,
    marginBottom: THEME.SPACING.xl
  },
  footerContainer: {
    marginTop: 'auto',
    paddingBottom: THEME.SPACING.xl
  }
});

export default AuthFormWrapper;