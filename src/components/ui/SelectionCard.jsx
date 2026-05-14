// src/components/ui/SelectionCard.jsx
import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  View, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import THEME from '../../theme/theme';

const { width } = Dimensions.get('window');

const SelectionCard = ({ title, subtitle, icon, onPress, gradientColors }) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.85} 
      onPress={onPress} 
      style={styles.wrapper}
    >
      <LinearGradient
        colors={gradientColors || [THEME.COLORS.glassSurface, 'rgba(255,255,255,0.02)']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name={icon} 
                size={32} 
                color={THEME.COLORS.primary} 
              />
            </View>
          </View>
          
          <View style={styles.textContainer}>
            <Text 
              style={styles.title} 
              numberOfLines={1} 
              adjustsFontSizeToFit
            >
              {title}
            </Text>
            <Text 
              style={styles.subtitle} 
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          </View>

          <View style={styles.arrowContainer}>
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={20} 
              color={THEME.COLORS.primary} 
            />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: THEME.SPACING.lg,
    borderRadius: THEME.BORDERS.radius.xl,
    backgroundColor: THEME.COLORS.glassSurface,
    ...THEME.SHADOWS.soft,
  },
  container: {
    padding: THEME.SPACING.lg,
    borderRadius: THEME.BORDERS.radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftSection: {
    marginRight: THEME.SPACING.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  textContainer: {
    flex: 1,
    paddingRight: THEME.SPACING.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: THEME.COLORS.textSecondary,
    lineHeight: 16,
    opacity: 0.8,
  },
  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default SelectionCard;
