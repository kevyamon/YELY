// src/components/ui/AvailabilityCard.jsx
// COMPOSANT RÉUTILISABLE - Toggle de service pour Chauffeur (Glow Effect)

import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import THEME from '../../theme/theme';

const AvailabilityCard = ({ isAvailable, onToggle, isLoading }) => {
  return (
    <View style={[styles.card, isAvailable && styles.cardOnline]}>
      <View style={styles.row}>
        <View style={styles.info}>
          <View style={styles.header}>
            <Ionicons 
              name={isAvailable ? "radio-button-on" : "radio-button-off"} 
              size={18} 
              color={isAvailable ? THEME.COLORS.success : THEME.COLORS.textTertiary} 
            />
            <Text style={[styles.title, isAvailable && { color: THEME.COLORS.success }]}>
              {isAvailable ? 'EN SERVICE' : 'HORS LIGNE'}
            </Text>
            {isLoading && (
              <ActivityIndicator 
                size="small" 
                color={THEME.COLORS.champagneGold} 
                style={styles.loader} 
              />
            )}
          </View>
          <Text style={styles.subtitle}>
            {isAvailable 
              ? 'Vous êtes visible par les clients à Maféré' 
              : 'Passez en ligne pour recevoir des courses'}
          </Text>
        </View>

        <Switch
          value={isAvailable}
          onValueChange={onToggle}
          disabled={isLoading}
          trackColor={{ 
            false: 'rgba(128,128,128,0.3)', 
            true: 'rgba(46, 204, 113, 0.3)' 
          }}
          thumbColor={isAvailable ? THEME.COLORS.success : '#f4f3f4'}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderColor: THEME.COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  cardOnline: {
    backgroundColor: 'rgba(46, 204, 113, 0.08)',
    borderColor: 'rgba(46, 204, 113, 0.3)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  title: {
    color: THEME.COLORS.textPrimary,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  subtitle: {
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
  },
  loader: {
    marginLeft: 5,
  }
});

export default AvailabilityCard;