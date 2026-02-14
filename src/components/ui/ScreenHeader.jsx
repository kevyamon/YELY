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
      
      {/* ⬅️ GAUCHE : NOTIFICATIONS (Cloche) */}
      <TouchableOpacity 
        style={styles.iconButton}
        onPress={() => console.log("Notifs click")} 
      >
         <Ionicons name="notifications-outline" size={24} color={THEME.COLORS.textSecondary} />
         {/* Point rouge de notif */}
         <View style={styles.badge} />
      </TouchableOpacity>

      {/* ⏺️ CENTRE : TITRE ou LOCATION */}
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

      {/* ➡️ DROITE : MENU (Ouvre le Drawer à droite) */}
      <TouchableOpacity 
        style={styles.iconButton} 
        onPress={() => navigation.openDrawer()}
      >
        <Ionicons name="menu" size={28} color={THEME.COLORS.champagneGold} />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: THEME.LAYOUT.HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.COLORS.deepAsphalt,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: THEME.SPACING.md,
    zIndex: 10000,
    // Ombre légère
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
    color: THEME.COLORS.textPrimary,
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