// src/components/profile/ProfileAvatar.jsx
// COMPOSANT MODULAIRE - Gestion de l'Avatar et de l'Identite Visuelle
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

const ProfileAvatar = ({ userPhoto, email, isDriver, isUploading, onPickImage }) => {
  return (
    <View style={styles.avatarSection}>
      <TouchableOpacity onPress={onPickImage} disabled={isUploading} activeOpacity={0.8}>
        <View style={styles.avatarContainer}>
          {userPhoto ? (
            <Image source={{ uri: userPhoto }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={60} color={THEME.COLORS.textSecondary} />
          )}
          
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
      <Text style={styles.roleText}>{isDriver ? 'Chauffeur Partenaire' : 'Passager'}</Text>
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
  avatarImage: { width: '100%', height: '100%' },
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