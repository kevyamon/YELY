// src/components/ui/SmartHeader.jsx
// HEADER INTELLIGENT & DYNAMIQUE - Version UX Premium (Bouton CTA)

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';

const SmartHeader = ({ 
  scrollY, 
  address = "Recherche GPS...", 
  userName = "Passager",
  onMenuPress, 
  onNotificationPress,
  onSearchPress 
}) => {
  const insets = useSafeAreaInsets();
  const user = useSelector(selectCurrentUser);
  const isRider = user?.role === 'rider';

  // Limites de l'animation
  const headerMaxHeight = THEME.LAYOUT.HEADER_MAX_HEIGHT + insets.top;
  const headerMinHeight = THEME.LAYOUT.HEADER_HEIGHT + insets.top;
  const scrollDistance = headerMaxHeight - headerMinHeight;

  // 1. Animation Hauteur & Ombre
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, scrollDistance],
      [headerMaxHeight, headerMinHeight],
      Extrapolation.CLAMP
    );

    const shadowOpacity = interpolate(
      scrollY.value,
      [0, scrollDistance],
      [0, 0.3], 
      Extrapolation.CLAMP
    );

    return { height, shadowOpacity, elevation: shadowOpacity * 10 };
  });

  // 2. Animation CTA (Disparition au scroll)
  const ctaAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, scrollDistance * 0.6], 
      [1, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, scrollDistance],
      [0, -15],
      Extrapolation.CLAMP
    );
    const display = opacity === 0 ? 'none' : 'flex';
    return { opacity, transform: [{ translateY }], display };
  });

  // 3. Animation Titre Adresse (Apparition au centre)
  const titleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [scrollDistance * 0.7, scrollDistance], 
      [0, 1],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [scrollDistance * 0.5, scrollDistance],
      [10, 0],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ translateY }] };
  });

  // 4. NOUVEAU : Animation du "Pop" pour le bouton CTA
  const buttonScale = useSharedValue(1);
  const buttonPopStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: buttonScale.value }] };
  });

  return (
    <Animated.View style={[styles.container, headerAnimatedStyle]}>
      {/* Fond Opaque */}
      <View style={[styles.background, { backgroundColor: THEME.COLORS.background }]} />

      <View style={[styles.contentContainer, { paddingTop: insets.top }]}>
        
        {/* LIGNE DU HAUT : Menu, Notif, et Titre Caché */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={onNotificationPress} style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color={THEME.COLORS.champagneGold} />
            <View style={styles.badge} />
          </TouchableOpacity>

          {/* Titre Adresse au Scroll */}
          <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
            <Text style={styles.locationTitle} numberOfLines={1}>
              📍 {address}
            </Text>
          </Animated.View>

          <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
            <Ionicons name="menu-outline" size={28} color={THEME.COLORS.champagneGold} />
          </TouchableOpacity>
        </View>

        {/* LIGNE DU BAS : Contenu Dynamique */}
        <Animated.View style={[styles.ctaContainer, ctaAnimatedStyle]}>
          
          <View style={styles.greetingHeader}>
             <Text style={styles.greetingText}>Bonjour, {userName}</Text>
             
             {isRider && (
               <View style={styles.riderAddressRow}>
                  <Ionicons name="location-sharp" size={14} color={THEME.COLORS.champagneGold} />
                  <Text style={styles.riderAddressText} numberOfLines={1}>{address}</Text>
               </View>
             )}
          </View>

          {!isRider && (
             <View style={styles.driverGpsBadge}>
                 <Ionicons name="navigate" size={18} color={THEME.COLORS.champagneGold} />
                 <Text style={styles.gpsText} numberOfLines={1}>{address}</Text>
             </View>
          )}
          
          {/* NOUVEAU CTA : Bouton compact, jaune, texte noir avec effet POP */}
          {isRider && (
            <Animated.View style={[styles.ctaWrapper, buttonPopStyle]}>
              <Pressable 
                style={styles.ctaButton} 
                onPressIn={() => buttonScale.value = withSpring(0.92)} // Se contracte
                onPressOut={() => buttonScale.value = withSpring(1)}   // Rebondit
                onPress={onSearchPress}
              >
                <Ionicons name="car-sport" size={22} color="#121418" />
                <Text style={styles.ctaText}>Commander un taxi</Text>
              </Pressable>
            </Animated.View>
          )}
          
        </Animated.View>

      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: THEME.LAYOUT.spacing.md,
  },
  topRow: {
    height: THEME.LAYOUT.HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    position: 'absolute',
    left: 50,
    right: 50,
    alignItems: 'center',
  },
  locationTitle: {
    color: THEME.COLORS.textPrimary,
    fontWeight: '800',
    fontSize: 14,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.COLORS.glassSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.COLORS.danger,
  },
  ctaContainer: {
    // Retrait des marges excessives pour éviter le débordement
    marginTop: 0, 
  },
  greetingHeader: {
    marginBottom: 6, // Plus serré pour laisser de la place au bouton
  },
  greetingText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 4,
    marginLeft: 4,
  },
  riderAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    marginBottom: 4,
  },
  riderAddressText: {
    color: THEME.COLORS.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
    opacity: 0.9,
  },

  // --- STYLES SPÉCIFIQUES DU NOUVEAU CTA ---
  ctaWrapper: {
    alignItems: 'center', // Centre le bouton horizontalement
    marginTop: 4,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.champagneGold, // JAUNE YÉLY
    paddingVertical: 12,
    paddingHorizontal: 28, // Forme de pilule
    borderRadius: 30, // Bords totalement arrondis
    height: 48, // Hauteur bloquée pour ne JAMAIS toucher la carte
    // Ombres dorées pour l'effet premium
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  ctaText: {
    color: '#121418', // Noir profond pour contraste parfait
    fontSize: 16,
    fontWeight: '900', // Très gras
    marginLeft: 10,
    letterSpacing: 0.5,
  },

  // --- STYLES SPÉCIFIQUES DRIVER ---
  driverGpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: THEME.COLORS.glassSurface,
    paddingVertical: 10, 
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    alignSelf: 'flex-start',
  },
  gpsText: {
    color: THEME.COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1, 
  }
});

export default SmartHeader;