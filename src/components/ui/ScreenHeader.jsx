import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import THEME from '../../theme/theme';
import SearchBar from './SearchBar';

export default function ScreenHeader({ 
  locationText = "Localisation...",
  scrollY // On reçoit la valeur du scroll
}) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Animations de transition
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [THEME.LAYOUT.HEADER_EXPANDED_HEIGHT + insets.top, THEME.LAYOUT.HEADER_HEIGHT + insets.top],
    extrapolate: 'clamp',
  });

  const searchOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [40, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.headerContainer, { height: headerHeight, paddingTop: insets.top }]}>
      <View style={styles.topRow}>
        {/* GAUCHE : NOTIFICATIONS */}
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={22} color={THEME.COLORS.textPrimary} />
          <View style={styles.badge} />
        </TouchableOpacity>

        {/* CENTRE : TITRE RÉDUIT (Apparaît au scroll) */}
        <Animated.View style={[styles.centerContent, { opacity: titleOpacity }]}>
           <Text style={styles.locationTextSmall}>{locationText}</Text>
        </Animated.View>

        {/* DROITE : MENU */}
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={28} color={THEME.COLORS.champagneGold} />
        </TouchableOpacity>
      </View>

      {/* ZONE BASSE : RECHERCHE (Disparaît au scroll) */}
      <Animated.View style={[styles.searchRow, { opacity: searchOpacity }]}>
        <View style={styles.locationHeader}>
          <Text style={styles.labelCaption}>POSITION ACTUELLE</Text>
          <Text style={styles.locationTextMain} numberOfLines={1}>{locationText}</Text>
        </View>
        <SearchBar 
          label="Destination"
          hint="Ou allons-nous ?"
          style={styles.headerSearchBar}
          onPress={() => console.log("Search")}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: THEME.COLORS.deepAsphalt,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: THEME.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  topRow: {
    height: THEME.LAYOUT.HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchRow: {
    marginTop: 5,
  },
  locationHeader: {
    marginBottom: 8,
  },
  labelCaption: {
    color: THEME.COLORS.champagneGold,
    fontSize: 9,
    fontWeight: 'bold',
  },
  locationTextMain: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationTextSmall: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  headerSearchBar: {
    height: 45,
    paddingVertical: 0,
  },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: 10, right: 10, width: 7, height: 7, borderRadius: 4, backgroundColor: THEME.COLORS.danger },
  centerContent: { flex: 1, alignItems: 'center' }
});