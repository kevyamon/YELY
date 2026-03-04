// src/screens/admin/AdminJournal.jsx
// JOURNAL ADMIN - Historique de tracabilite (Adaptatif Light/Dark, Strictement Read-Only)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useMemo } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGetAuditLogsQuery } from '../../store/api/adminApiSlice';
import THEME from '../../theme/theme';

const GlassCard = ({ children, style }) => (
  <View style={[styles.glassContainer, style]}>
    <BlurView intensity={60} tint="default" style={StyleSheet.absoluteFill} />
    <View style={styles.glassContent}>
      {children}
    </View>
  </View>
);

const AdminJournal = ({ navigation }) => {
  // AJOUT SENIOR: Récupération des vrais logs depuis l'API !
  const { data: logsResponse, isLoading, refetch, isFetching } = useGetAuditLogsQuery({ page: 1 });
  
  // Extraction sécurisée
  const journalHistory = logsResponse?.data?.logs || logsResponse?.logs || [];

  const groupedData = useMemo(() => {
    const now = new Date();
    const periods = { '24h': [], '7j': [], '15j': [], '30j': [] };

    journalHistory.forEach(log => {
      if (!log.createdAt) return;
      const logDate = new Date(log.createdAt);
      const diffTime = Math.abs(now - logDate);
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays <= 1) {
        periods['24h'].push(log);
      } else if (diffDays <= 7) {
        periods['7j'].push(log);
      } else if (diffDays <= 15) {
        periods['15j'].push(log);
      } else if (diffDays <= 30) {
        periods['30j'].push(log);
      }
    });

    const sections = [];
    if (periods['24h'].length > 0) sections.push({ title: 'Dernieres 24 heures', data: periods['24h'] });
    if (periods['7j'].length > 0) sections.push({ title: '7 derniers jours', data: periods['7j'] });
    if (periods['15j'].length > 0) sections.push({ title: '15 derniers jours', data: periods['15j'] });
    if (periods['30j'].length > 0) sections.push({ title: '30 derniers jours', data: periods['30j'] });

    return sections;
  }, [journalHistory]);

  const renderItem = ({ item }) => (
    <GlassCard style={styles.logCard}>
      <View style={styles.logHeader}>
        <Text style={styles.logAction}>{item.action || 'ACTION_INCONNUE'}</Text>
        <Text style={styles.logDate}>
            {new Date(item.createdAt).toLocaleDateString('fr-FR')} {new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute:'2-digit' })}
        </Text>
      </View>
      <Text style={styles.logDetails}>{item.details || 'Aucun detail fourni'}</Text>
      {/* Affichage du nom de l'admin qui a fait l'action (actor) si dispo */}
      <Text style={styles.logTarget}>Par: {item.actor?.name || item.actor?.email || 'Système'}</Text>
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journal d'Audit</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={THEME.COLORS.primary} />
            <Text style={styles.loadingText}>Chargement des archives...</Text>
        </View>
      ) : (
        <SectionList
            sections={groupedData}
            keyExtractor={(item, index) => item._id || index.toString()}
            renderItem={renderItem}
            renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            )}
            contentContainerStyle={styles.listContent}
            onRefresh={refetch}
            refreshing={isFetching}
            ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <GlassCard style={styles.emptyCard}>
                <Ionicons name="library-outline" size={48} color={THEME.COLORS.primary} style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>Journal d'activite</Text>
                <Text style={styles.emptyText}>
                    Le journal est completement vide. Aucune action d'administration n'a encore ete effectuee recemment.
                </Text>
                </GlassCard>
            </View>
            }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.COLORS.primary },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: THEME.COLORS.textSecondary, marginTop: 10 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 },
  sectionHeader: { backgroundColor: THEME.COLORS.background, paddingVertical: 10, marginTop: 10 },
  sectionTitle: { color: THEME.COLORS.textSecondary, fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  glassContainer: { overflow: 'hidden', borderRadius: THEME.BORDERS?.radius?.lg || 12, borderWidth: THEME.BORDERS?.width?.thin || 1, borderColor: THEME.COLORS.border, backgroundColor: THEME.COLORS.overlay },
  glassContent: { padding: 15 },
  logCard: { marginBottom: 12 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  logAction: { color: THEME.COLORS.primary, fontWeight: 'bold', fontSize: 14 },
  logDate: { color: THEME.COLORS.textTertiary, fontSize: 12 },
  logDetails: { color: THEME.COLORS.textPrimary, fontSize: 13, marginBottom: 5 },
  logTarget: { color: THEME.COLORS.textSecondary, fontSize: 11, fontStyle: 'italic' },
  emptyContainer: { flex: 1, justifyContent: 'center', marginTop: 40 },
  emptyCard: { alignItems: 'center', padding: 25 },
  emptyIcon: { marginBottom: 15, opacity: 0.8 },
  emptyTitle: { color: THEME.COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  emptyText: { color: THEME.COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22 }
});

export default AdminJournal;