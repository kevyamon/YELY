// src/components/ui/SmartHeader.jsx
// HEADER INTELLIGENT & DYNAMIQUE
// S'adapte au scroll et affiche les vraies données (Adresse, Nom)

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle
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
      [0, 0.3], // L'ombre apparaît à la fin
      Extrapolation.CLAMP
    );

    return { height, shadowOpacity, elevation: shadowOpacity * 10 };
  });

  // 2. Animation SearchBar (Disparition)
  const searchBarAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, scrollDistance * 0.6], 
      [1, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [0, scrollDistance],
      [0, -20],
      Extrapolation.CLAMP
    );
    // On masque la vue pour éviter les clics fantômes quand invisible
    const display = opacity === 0 ? 'none' : 'flex';
    return { opacity, transform: [{ translateY }], display };
  });

  // 3. Animation Titre Adresse (Apparition)
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

  return (
    <Animated.View style={[styles.container, headerAnimatedStyle]}>
      {/* Fond Opaque pour cacher le contenu qui scroll dessous */}
      <View style={[styles.background, { backgroundColor: THEME.COLORS.deepAsphalt }]} />

      <View style={[styles.contentContainer, { paddingTop: insets.top }]}>
        
        {/* LIGNE DU HAUT : Menu, Notif, et Titre Caché */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={onNotificationPress} style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color={THEME.COLORS.champagneGold} />
            <View style={styles.badge} />
          </TouchableOpacity>

          {/* Titre Adresse (Visible uniquement quand header réduit) */}
          <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
            <Text style={styles.locationTitle} numberOfLines={1}>
              📍 {address}
            </Text>
          </Animated.View>

          <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
            <Ionicons name="menu-outline" size={28} color={THEME.COLORS.champagneGold} />
          </TouchableOpacity>
        </View>

        {/* LIGNE DU BAS : SearchBar & Bonjour (Disparaît au scroll) */}
        <Animated.View style={[styles.searchContainer, searchBarAnimatedStyle]}>
          <Text style={styles.greetingText}>Bonjour, {userName}</Text>
          
          {isRider && (
            <>
              <TouchableOpacity 
                style={styles.searchBar} 
                activeOpacity={0.9} 
                onPress={onSearchPress}
              >
                <Ionicons name="search" size={20} color={THEME.COLORS.textSecondary} />
                <Text style={styles.placeholderText}>Où allons-nous aujourd'hui ?</Text>
              </TouchableOpacity>
              
              {/* Petite info adresse statique pour confirmer le GPS */}
              <View style={styles.gpsIndicator}>
                 <Ionicons name="navigate" size={12} color={THEME.COLORS.primary} />
                 <Text style={styles.gpsText} numberOfLines={1}>{address}</Text>
              </View>
            </>
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
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.COLORS.error,
  },
  searchContainer: {
    marginTop: 5,
  },
  greetingText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  placeholderText: {
    color: THEME.COLORS.textTertiary,
    marginLeft: 10,
    fontSize: 16,
  },
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 4,
    opacity: 0.7
  },
  gpsText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 10,
    marginLeft: 4,
  }
});

export default SmartHeader;