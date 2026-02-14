// src/components/ui/ScreenHeader.jsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

export default function ScreenHeader({ 
  title, 
  showLocation = false, 
  locationText = "Localisation..." 
}) {
  const navigation = useNavigation();

  return (
    <View style={styles.headerContainer}>
      
      {/* BLOC GAUCHE : MENU */}
      <TouchableOpacity 
        style={styles.iconButton} 
        onPress={() => navigation.openDrawer()}
      >
        <Ionicons name="menu" size={28} color={THEME.COLORS.champagneGold} />
      </TouchableOpacity>

      {/* BLOC CENTRAL : TITRE ou LOCATION */}
      <View style={styles.centerContent}>
        {showLocation ? (
          <View style={styles.locationWrapper}>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={12} color={THEME.COLORS.champagneGold} style={{marginRight: 4}} />
              <Text style={styles.labelCaption}>POSITION ACTUELLE</Text>
            </View>
            <Text style={styles.locationText} numberOfLines={1}>
              {locationText}
            </Text>
          </View>
        ) : (
          <Text style={styles.screenTitle}>{title?.toUpperCase() || 'YÉLY'}</Text>
        )}
      </View>

      {/* BLOC DROIT : NOTIFICATIONS */}
      <TouchableOpacity style={styles.iconButton}>
         <Ionicons name="notifications-outline" size={24} color={THEME.COLORS.textSecondary} />
         <View style={styles.badge} />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: THEME.LAYOUT.HEADER_HEIGHT, // 60px Fixe
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.COLORS.deepAsphalt, // FOND OPAQUE (Noir/Blanc selon ton thème)
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)', // Séparateur subtil
    paddingHorizontal: THEME.SPACING.md,
    zIndex: 10000, // Toujours au-dessus
    // Ombre pour l'effet "Commandant"
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  screenTitle: {
    color: THEME.COLORS.champagneGold,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  locationWrapper: {
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  labelCaption: {
    color: THEME.COLORS.champagneGold,
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  locationText: {
    color: THEME.COLORS.textPrimary, // Noir ou Blanc selon ton thème
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.COLORS.danger,
  }
});