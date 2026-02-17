// src/components/drawer/DrawerHeader.jsx
// HEADER DU MENU (Profil, Photo & Infos)
// Gère l'affichage intelligent du nom et de l'avatar

import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

import THEME from '../../theme/theme';
import { getInitials, getRoleLabel } from './menuConfig';

const DrawerHeader = ({ user, role, onClose }) => {
  
  // 1. Reconstruction du Nom (Priorité : Full Name > Name > Utilisateur)
  const displayName = user?.firstName 
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.name || 'Utilisateur';

  // 2. Récupération de l'image (si disponible)
  const profileImage = user?.profilePicture || user?.avatar;

  // 3. Label du Rôle
  const roleLabel = getRoleLabel(role);

  return (
    <View style={styles.container}>
      
      {/* LIGNE DU HAUT : Logo & Croix de fermeture */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandText}>YÉLY</Text>
          <View style={styles.brandDot} />
        </View>

        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ZONE PROFIL */}
      <View style={styles.profileRow}>
        
        {/* AVATAR (Image ou Initiales) */}
        <View style={styles.avatarContainer}>
          {profileImage ? (
            <Image 
              source={{ uri: profileImage }} 
              style={styles.avatarImage} 
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
            </View>
          )}
          {/* Indicateur En Ligne */}
          <View style={styles.onlineIndicator} />
        </View>

        {/* INFOS TEXTE */}
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {displayName}
          </Text>
          
          <Text style={styles.userContact} numberOfLines={1}>
            {user?.phone || user?.email || 'Non renseigné'}
          </Text>

          {/* Badge Rôle */}
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{roleLabel}</Text>
          </View>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: THEME.SPACING.lg,
    paddingVertical: THEME.SPACING.lg,
    backgroundColor: THEME.COLORS.glassSurface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.border,
  },
  
  // --- TOP ROW ---
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SPACING.xl,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandText: {
    color: THEME.COLORS.champagneGold,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.COLORS.textPrimary,
    marginLeft: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.COLORS.glassMedium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },

  // --- PROFIL ROW ---
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: THEME.SPACING.md,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: THEME.COLORS.champagneGold,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.15)', // Gold très léger
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: THEME.COLORS.champagneGold,
  },
  avatarText: {
    color: THEME.COLORS.champagneGold,
    fontSize: 24,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: THEME.COLORS.success,
    borderWidth: 2,
    borderColor: THEME.COLORS.background, // Se fond dans le background
  },

  // --- USER INFO ---
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    color: THEME.COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userContact: {
    color: THEME.COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  roleBadgeText: {
    color: THEME.COLORS.champagneGold,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default DrawerHeader;