// src/components/profile/ProfileAvatar.jsx
// COMPOSANT MODULAIRE - Gestion de l'Avatar et de l'Identite Visuelle
// CSCSM Level: Bank Grade / Cross-Platform Safe

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

const ProfileAvatar = ({ userPhoto, email, role, isUploading, onPickImage }) => {
  // Le chargement initial est active par defaut UNIQUEMENT sur mobile (iOS/Android)
  const [isImageLoading, setIsImageLoading] = useState(Platform.OS !== 'web');
  
  const getRoleDisplayName = (userRole) => {
    const roles = {
      driver: 'Chauffeur Partenaire',
      rider: 'Passager',
      admin: 'Administrateur',
      superadmin: 'Direction'
    };
    return roles[userRole] || 'Passager';
  };

  // SECURITE MULTIPLATEFORME : 
  // On adapte strictement les ecouteurs d'evenements a la plateforme pour eviter les "Silent Crashes"
  const imageProps = Platform.OS === 'web' 
    ? {
        onLoad: () => setIsImageLoading(false),
      } 
    : {
        onLoadStart: () => setIsImageLoading(true),
        onLoadEnd: () => setIsImageLoading(false),
      };

  // BLINDAGE WEB : On s'assure que l'image est bien traitee selon son type (String vs Local Object)
  const imageSource = typeof userPhoto === 'string' ? { uri: userPhoto } : userPhoto;

  return (
    <View style={styles.avatarSection}>
      <TouchableOpacity onPress={onPickImage} disabled={isUploading} activeOpacity={0.8}>
        <View style={styles.avatarContainer}>
          {userPhoto ? (
            <>
              <Image 
                source={imageSource} 
                style={styles.avatarImage} 
                {...imageProps}
              />
              {/* Affichage du loader si l'image charge du reseau (Natifs) sans bloquer l'interface Web */}
              {isImageLoading && !isUploading && Platform.OS !== 'web' && (
                <View style={styles.avatarLoader}>
                  <ActivityIndicator size="small" color={THEME.COLORS.primary} />
                </View>
              )}
            </>
          ) : (
            <Ionicons name="person" size={60} color={THEME.COLORS.textSecondary} />
          )}
          
          {/* Loader existant pour l'upload d'une nouvelle image */}
          {isUploading && (
            <View style={styles.avatarLoader}>
              <ActivityIndicator size="small" color={THEME.COLORS.primary} />
            </View>
          )}
        </View>
        
        <View style={styles.editBadge}>
          <Ionicons name="camera" size={16} color={THEME.COLORS.background} />
        </View>
      </TouchableOpacity>
      
      <Text style={styles.emailText}>{email}</Text>
      <Text style={styles.roleText}>{getRoleDisplayName(role)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: THEME.COLORS.glassSurface, 
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden', 
    borderWidth: 2, 
    borderColor: THEME.COLORS.primary 
  },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarLoader: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: THEME.COLORS.overlayMedium, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  editBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    backgroundColor: THEME.COLORS.primary, 
    width: 30, 
    height: 30, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: THEME.COLORS.background 
  },
  emailText: { color: THEME.COLORS.textPrimary, fontSize: 16, marginTop: 15, fontWeight: '500' },
  roleText: { color: THEME.COLORS.textSecondary, fontSize: 14, marginTop: 5 },
});

export default ProfileAvatar;