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
  actionButton 
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardContainer}
      >
        <View style={styles.headerContainer}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color={THEME.COLORS.textPrimary} />
            </TouchableOpacity>
          )}
          <Text style={styles.welcomeText}>{title}</Text>
          {subtitle && <Text style={styles.subText}>{subtitle}</Text>}
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.glassWrapper}>
            {children}
          </View>
        </ScrollView>

        {actionButton && (
          <View style={styles.actionContainer}>
            {actionButton}
          </View>
        )}
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
    paddingBottom: THEME.SPACING.xxl 
  },
  glassWrapper: { 
    ...THEME.GLASS.card, 
    padding: THEME.SPACING.xl,
  },
  actionContainer: {
    paddingHorizontal: THEME.SPACING.xl,
    paddingTop: THEME.SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? THEME.SPACING.xl : THEME.SPACING.lg,
  }
});

export default AuthFormWrapper;