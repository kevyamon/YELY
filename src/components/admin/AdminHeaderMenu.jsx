// src/components/admin/AdminHeaderMenu.jsx
// MENU HAMBURGER MODULAIRE ADMIN - Lisibilité maximale (Fond solide)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import THEME from '../../theme/theme';

const AdminHeaderMenu = ({ visible, onClose, onProfile, onHelp, onLogout }) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          {/* Flou sombre sur le reste de l'application */}
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          
          <TouchableWithoutFeedback>
            <View style={styles.menuContainer}>
              <View style={styles.menuContent}>
                
                <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onProfile(); }}>
                  <Ionicons name="person-outline" size={22} color={THEME.COLORS.primary} style={styles.menuIcon} />
                  <Text style={styles.menuText}>Mon Profil</Text>
                </TouchableOpacity>
                
                <View style={styles.divider} />
                
                <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onHelp(); }}>
                  <Ionicons name="information-circle-outline" size={22} color={THEME.COLORS.primary} style={styles.menuIcon} />
                  <Text style={styles.menuText}>Aide & Info</Text>
                </TouchableOpacity>
                
                <View style={styles.divider} />
                
                <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={() => { onClose(); onLogout(); }}>
                  <Ionicons name="log-out-outline" size={22} color={THEME.COLORS.danger} style={styles.menuIcon} />
                  <Text style={styles.logoutText}>Déconnexion</Text>
                </TouchableOpacity>

              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  menuContainer: { 
    position: 'absolute', 
    top: 65, 
    right: 20, 
    width: 230, 
    borderRadius: THEME.BORDERS?.radius?.md || 12, 
    overflow: 'hidden', 
    borderWidth: THEME.BORDERS?.width?.thin || 1, 
    borderColor: THEME.COLORS.border,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    backgroundColor: THEME.COLORS.background 
  },
  menuContent: { backgroundColor: THEME.COLORS.background },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20 },
  menuIcon: { marginRight: 15 },
  menuText: { color: THEME.COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  logoutItem: { backgroundColor: 'rgba(192, 57, 43, 0.08)' },
  logoutText: { color: THEME.COLORS.danger, fontSize: 16, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: THEME.COLORS.border, opacity: 0.5 }
});

export default AdminHeaderMenu;