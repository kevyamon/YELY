// src/components/drawer/DrawerHeader.jsx
// HEADER DU MENU (Profil, Photo & Infos - VIP Minimalist)
// CSCSM Level: Masterpiece UI

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Text } from 'react-native-paper';

import THEME from '../../theme/theme';
import { getInitials, getRoleLabel } from './menuConfig';

const DrawerHeader = ({ user, role, onClose }) => {
  const [isImageLoading, setIsImageLoading] = useState(false);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const displayName = user?.firstName 
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.name || 'Utilisateur';

  const profileImage = user?.profilePicture || user?.avatar || user?.photo;
  const hasValidImage = profileImage && typeof profileImage === 'string' && profileImage.trim() !== '';

  const roleLabel = getRoleLabel(role);

  const imageProps = Platform.OS === 'web' 
    ? {
        onLoad: () => setIsImageLoading(false),
        onError: () => setIsImageLoading(false),
      } 
    : {
        onLoadStart: () => setIsImageLoading(true),
        onLoadEnd: () => setIsImageLoading(false),
        onError: () => setIsImageLoading(false),
      };

  return (
    <View style={styles.container}>
      
      {/* LIGNE DU HAUT : Logo & Croix de fermeture */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandText}>YÉLY</Text>
          <View style={styles.brandDot} />
        </View>

        <TouchableOpacity 
          style={[styles.closeButton, isDarkMode ? styles.closeButtonDark : styles.closeButtonLight]} 
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={22} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ZONE PROFIL */}
      <View style={styles.profileRow}>
        
        {/* AVATAR (Image ou Initiales) */}
        <View style={styles.avatarContainer}>
          {hasValidImage ? (
            <>
              <Image 
                source={{ uri: profileImage }} 
                style={styles.avatarImage} 
                resizeMode="cover"
                {...imageProps}
              />
              {isImageLoading && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="small" color={THEME.COLORS.primary} />
                </View>
              )}
            </>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
            </View>
          )}
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

          {/* Badge Role Minimaliste */}
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
    paddingTop: THEME.SPACING.lg,
    paddingBottom: THEME.SPACING.md,
  },
  
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SPACING.lg,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandText: {
    color: THEME.COLORS.primary,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.COLORS.textPrimary,
    marginLeft: 3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  closeButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: THEME.SPACING.md,
    width: 58,
    height: 58,
  },
  avatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: THEME.COLORS.primary,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 29,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(214, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: THEME.COLORS.primary,
  },
  avatarText: {
    color: THEME.COLORS.primary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#2ECC71',
    borderWidth: 2,
    borderColor: THEME.COLORS.background,
  },

  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    color: THEME.COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  userContact: {
    color: THEME.COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(214, 175, 55, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(214, 175, 55, 0.25)',
  },
  roleBadgeText: {
    color: THEME.COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});

export default DrawerHeader;