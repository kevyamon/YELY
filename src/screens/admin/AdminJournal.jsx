// src/screens/admin/AdminJournal.jsx
// JOURNAL ADMIN - Historique de tracabilite
// UI: Liquid Glassmorphism
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';

const GlassCard = ({ children, style }) => (
  <View style={[styles.glassContainer, style]}>
    <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
    <View style={styles.glassContent}>
      {children}
    </View>
  </View>
);

const AdminJournal = ({ navigation }) => {
  // NOTE LEAD DEV : Cet ecran est prepare structurellement.
  // Les donnees seront cablees lorsque la route backend /api/admin/journal sera creee.
  const journalHistory = []; 

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.champagneGold} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Journal</Text>
      </View>

      <FlatList
        data={journalHistory}
        keyExtractor={(item, index) => index.toString()}
        renderItem={null}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <GlassCard style={styles.emptyCard}>
              <Ionicons name="library-outline" size={48} color="rgba(255,215,0,0.5)" style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>Journal d'activite</Text>
              <Text style={styles.emptyText}>
                Cette section affichera bientot l'historique complet de vos validations et rejets. (En attente de synchronisation serveur).
              </Text>
            </GlassCard>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.COLORS.champagneGold },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 },
  glassContainer: { overflow: 'hidden', borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.03)' },
  glassContent: { padding: 25, alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', marginTop: 40 },
  emptyCard: { alignItems: 'center' },
  emptyIcon: { marginBottom: 15 },
  emptyTitle: { color: THEME.COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  emptyText: { color: THEME.COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22 }
});

export default AdminJournal;