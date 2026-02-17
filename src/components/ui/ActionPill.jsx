// src/components/ui/ActionPill.jsx
// COMPOSANT RÉUTILISABLE - Bouton d'action "Pilule" (Commander / Annuler) avec animation

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import THEME from '../../theme/theme';

const ActionPill = ({ mode = 'primary', onPress, text, icon }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: scale.value }] };
  });

  const isCancel = mode === 'cancel';

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable
        style={[styles.button, isCancel ? styles.buttonCancel : styles.buttonPrimary]}
        onPressIn={() => scale.value = withSpring(0.92)}
        onPressOut={() => scale.value = withSpring(1)}
        onPress={onPress}
      >
        {icon && (
          <Ionicons 
            name={icon} 
            size={isCancel ? 20 : 22} 
            color={isCancel ? THEME.COLORS.danger : '#121418'} 
          />
        )}
        <Text style={[styles.text, isCancel ? styles.textCancel : styles.textPrimary]}>
          {text}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30, // Forme de pilule parfaite
  },
  buttonPrimary: {
    backgroundColor: THEME.COLORS.champagneGold,
    paddingVertical: 12,
    paddingHorizontal: 28,
    height: 48,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonCancel: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderColor: THEME.COLORS.danger,
    borderWidth: 1,
    paddingHorizontal: 20,
    height: 40,
    elevation: 0,
    shadowOpacity: 0,
  },
  text: {
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  textPrimary: {
    color: '#121418',
    fontSize: 16,
    fontWeight: '900',
  },
  textCancel: {
    color: THEME.COLORS.danger,
    fontSize: 14,
    fontWeight: 'bold',
  }
});

export default ActionPill;