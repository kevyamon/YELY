// src/components/drawer/DrawerHeader.jsx
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';

const DrawerHeader = ({ onClose, isFullScreen }) => {
  const user = useSelector(selectCurrentUser);
  const userName = user?.firstName || 'Utilisateur';
  const userRole = user?.role === 'driver' ? 'Chauffeur' : 'Passager';

  return (
    <View style={styles.container}>
      {/* Bouton FERMER (Croix) ou RETOUR en haut à droite */}
      <View style={styles.topRow}>
        <View style={styles.logoPlaceholder}>
             {/* Petit logo optionnel ou vide */}
             <Text style={styles.brandText}>YÉLY</Text>
        </View>

        <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            activeOpacity={0.7}
        >
          <Ionicons name="close" size={28} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Info Utilisateur */}
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
        </View>
        <View>
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.role}>{userRole}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: THEME.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SPACING.lg,
  },
  brandText: {
    color: THEME.COLORS.primary, // OR
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.COLORS.glassSurface, // Fond subtil
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    color: THEME.COLORS.textInverse, // Noir sur Or
    fontSize: 24,
    fontWeight: 'bold',
  },
  name: {
    color: THEME.COLORS.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  role: {
    color: THEME.COLORS.textSecondary,
    fontSize: 14,
  },
});

export default DrawerHeader;