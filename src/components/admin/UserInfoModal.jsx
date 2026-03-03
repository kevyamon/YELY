// src/components/admin/UserInfoModal.jsx
// MODALE UTILISATEUR - Design Premium (Ajustement Typographique)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

const InfoCard = ({ icon, label, value, valueColor }) => (
  <View style={styles.infoCard}>
    <View style={styles.iconContainer}>
      <Ionicons name={icon} size={20} color={THEME.COLORS.primary} />
    </View>
    <View style={styles.infoTextContainer}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor && { color: valueColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {value || 'N/A'}
      </Text>
    </View>
  </View>
);

const UserInfoModal = ({ visible, user, onClose }) => {
  if (!user) return null;

  const roleTranslations = { rider: 'Passager', driver: 'Chauffeur', admin: 'Administrateur', superadmin: 'Direction' };
  const displayRole = roleTranslations[user.role] || user.role.toUpperCase();

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={80} tint="default" style={StyleSheet.absoluteFill} />
        
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={32} color={THEME.COLORS.textTertiary} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.identitySection}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={50} color={THEME.COLORS.primary} />
              </View>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              
              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark" size={14} color={THEME.COLORS.primary} style={styles.roleIcon} />
                <Text style={styles.roleText}>{displayRole}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Informations & Activité</Text>
            
            <View style={styles.gridContainer}>
              <InfoCard 
                icon="call" 
                label="Téléphone" 
                value={user.phone} 
              />
              <InfoCard 
                icon="calendar" 
                label="Inscrit le" 
                value={new Date(user.createdAt).toLocaleDateString('fr-FR')} 
              />
              <InfoCard 
                icon="car" 
                label="Courses Totales" 
                value={user.totalRides?.toString() || '0'} 
              />
              <InfoCard 
                icon="star" 
                label="Note Moyenne" 
                value={user.rating ? `${user.rating} / 5` : 'Aucune'} 
                valueColor={THEME.COLORS.primary}
              />
            </View>

            <View style={[styles.statusCard, user.isBanned ? styles.statusBanned : styles.statusActive]}>
              <Ionicons 
                name={user.isBanned ? "ban" : "checkmark-circle"} 
                size={24} 
                color={user.isBanned ? THEME.COLORS.danger : THEME.COLORS.success} 
              />
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusLabel}>Statut du compte</Text>
                <Text style={[styles.statusValue, { color: user.isBanned ? THEME.COLORS.danger : THEME.COLORS.success }]}>
                  {user.isBanned ? 'Banni du système' : 'Actif et en règle'}
                </Text>
              </View>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxHeight: '85%', backgroundColor: THEME.COLORS.glassModal, borderRadius: THEME.BORDERS.radius.xl, borderWidth: THEME.BORDERS.width.thin, borderColor: THEME.COLORS.border, overflow: 'hidden' },
  closeButton: { position: 'absolute', top: 15, right: 15, zIndex: 10 },
  scrollContent: { padding: 25, paddingTop: 40 },
  
  identitySection: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: THEME.COLORS.overlay, justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 2, borderColor: THEME.COLORS.border },
  userName: { color: THEME.COLORS.textPrimary, fontSize: 22, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  userEmail: { color: THEME.COLORS.textSecondary, fontSize: 14, marginBottom: 12, textAlign: 'center' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 215, 0, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: THEME.BORDERS.radius.pill },
  roleIcon: { marginRight: 6 },
  roleText: { color: THEME.COLORS.primary, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  
  sectionTitle: { color: THEME.COLORS.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 15, marginLeft: 5 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  
  infoCard: { width: '48%', backgroundColor: THEME.COLORS.overlay, borderRadius: THEME.BORDERS.radius.md, padding: 12, marginBottom: 15, flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: THEME.COLORS.background, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  infoTextContainer: { flex: 1 },
  infoLabel: { color: THEME.COLORS.textSecondary, fontSize: 12, marginBottom: 2 },
  infoValue: { color: THEME.COLORS.textPrimary, fontSize: 15, fontWeight: 'bold' },
  
  statusCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: THEME.BORDERS.radius.lg, marginTop: 10, borderWidth: THEME.BORDERS.width.thin },
  statusActive: { backgroundColor: 'rgba(39, 174, 96, 0.1)', borderColor: 'rgba(39, 174, 96, 0.3)' },
  statusBanned: { backgroundColor: 'rgba(192, 57, 43, 0.1)', borderColor: 'rgba(192, 57, 43, 0.3)' },
  statusTextContainer: { marginLeft: 15 },
  statusLabel: { color: THEME.COLORS.textSecondary, fontSize: 12, marginBottom: 2 },
  statusValue: { fontSize: 14, fontWeight: 'bold' }
});

export default UserInfoModal;