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
const CARD_WIDTH = width * 0.85;

const SelectionCard = ({ title, subtitle, icon, onPress, gradientColors }) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={onPress} 
      style={styles.container}
    >
      <LinearGradient
        colors={gradientColors || [THEME.COLORS.glassSurface, THEME.COLORS.glassSurface]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name={icon} 
              size={48} 
              color={THEME.COLORS.primary} 
            />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.arrowContainer}>
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={24} 
              color={THEME.COLORS.primary} 
            />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: 140,
    marginBottom: THEME.SPACING.xl,
    borderRadius: THEME.BORDERS.radius.xl,
    ...THEME.SHADOWS.medium,
    backgroundColor: THEME.COLORS.glassSurface,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  gradient: {
    flex: 1,
    borderRadius: THEME.BORDERS.radius.xl,
    padding: THEME.SPACING.lg,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: THEME.SPACING.lg,
  },
  title: {
    fontSize: THEME.FONTS.sizes.h3,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
    marginBottom: THEME.SPACING.xs,
  },
  subtitle: {
    fontSize: THEME.FONTS.sizes.bodySmall,
    color: THEME.COLORS.textSecondary,
    lineHeight: 18,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default SelectionCard;
