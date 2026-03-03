// src/screens/admin/ValidationCenter.jsx
// CENTRE DE VALIDATION - Temps Reel (Polling) et Scroll To Top integre
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import ValidationModal from '../../components/admin/ValidationModal';
import { useApproveTransactionMutation, useGetValidationQueueQuery, useRejectTransactionMutation } from '../../store/api/adminApiSlice';
import THEME from '../../theme/theme';

const GlassCard = ({ children, style, onPress }) => {
  const CardComponent = onPress ? TouchableOpacity : View;
  return (
    <CardComponent style={[styles.glassContainer, style]} onPress={onPress} activeOpacity={0.7}>
      <BlurView intensity={60} tint="default" style={StyleSheet.absoluteFill} />
      <View style={styles.glassContent}>
        {children}
      </View>
    </CardComponent>
  );
};

const ValidationCenter = ({ navigation }) => {
  const [page, setPage] = useState(1);
  const flatListRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // TEMPS REEL : Polling toutes les 5 secondes
  const { data: queueResponse, isLoading, isFetching, refetch, error } = useGetValidationQueueQuery(page, {
    pollingInterval: 5000,
    refetchOnMountOrArgChange: true,
  });
  
  const [approveTx, { isLoading: isApproving }] = useApproveTransactionMutation();
  const [rejectTx, { isLoading: isRejecting }] = useRejectTransactionMutation();

  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const transactions = queueResponse?.data?.transactions || queueResponse?.transactions || [];
  const isProcessing = isApproving || isRejecting;

  const handleApprove = async (id) => {
    try { await approveTx(id).unwrap(); setSelectedTransaction(null); } 
    catch (e) { Alert.alert('Erreur', 'Impossible de valider cette transaction.'); }
  };

  const handleReject = async (id, reason) => {
    try { await rejectTx({ transactionId: id, reason }).unwrap(); setSelectedTransaction(null); } 
    catch (e) { Alert.alert('Erreur', 'Impossible de rejeter cette transaction.'); }
  };

  const handleScroll = (event) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > 150);
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const renderItem = ({ item }) => (
    <GlassCard style={styles.transactionCard} onPress={() => setSelectedTransaction(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
        <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
      </View>
      <View style={styles.cardBody}>
        <Ionicons name="document-attach-outline" size={24} color={THEME.COLORS.primary} style={styles.icon} />
        <View style={styles.cardInfo}>
          <Text style={styles.amountText}>{item.amount} FCFA</Text>
          <Text style={styles.phoneText}>Expediteur: {item.senderPhone || 'Inconnu'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={THEME.COLORS.textTertiary} />
      </View>
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Validations</Text>
      </View>

      <View style={styles.listContainer}>
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={24} color="#FFFFFF" style={styles.errorIcon} />
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorTitle}>Erreur Serveur ({error?.status || 'X'})</Text>
              <Text style={styles.errorDetail}>Impossible de recuperer la file d'attente.</Text>
            </View>
          </View>
        )}

        {isLoading && !isFetching ? (
          <ActivityIndicator size="large" color={THEME.COLORS.primary} style={styles.loader} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={transactions}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onRefresh={refetch}
            refreshing={isFetching && transactions.length === 0}
            ListEmptyComponent={
              !error && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="checkmark-done-circle-outline" size={64} color={THEME.COLORS.textTertiary} />
                  <Text style={styles.emptyText}>Aucune transaction en attente.</Text>
                  <Text style={styles.emptySubtext}>Bon travail !</Text>
                </View>
              )
            }
          />
        )}
      </View>

      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />

      <ValidationModal
        visible={!!selectedTransaction}
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        isProcessing={isProcessing}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.COLORS.primary },
  listContainer: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 80 },
  loader: { marginTop: 50 },
  errorBanner: { flexDirection: 'row', backgroundColor: THEME.COLORS.danger, padding: 15, marginHorizontal: 20, borderRadius: THEME.BORDERS.radius.md, marginBottom: 20, alignItems: 'center' },
  errorIcon: { marginRight: 15 },
  errorTextContainer: { flex: 1 },
  errorTitle: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  errorDetail: { color: '#FFFFFF', fontSize: 13, marginTop: 4 },
  glassContainer: { overflow: 'hidden', borderRadius: THEME.BORDERS.radius.lg, borderWidth: THEME.BORDERS.width.thin, borderColor: THEME.COLORS.border, backgroundColor: THEME.COLORS.overlay, marginBottom: 15 },
  glassContent: { padding: 15 },
  transactionCard: { padding: 0 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeBadge: { backgroundColor: 'transparent', borderWidth: 1, borderColor: THEME.COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { color: THEME.COLORS.primary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  dateText: { color: THEME.COLORS.textSecondary, fontSize: 12 },
  cardBody: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 15 },
  cardInfo: { flex: 1 },
  amountText: { color: THEME.COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' },
  phoneText: { color: THEME.COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: THEME.COLORS.textPrimary, fontSize: 18, fontWeight: '600', marginTop: 15 },
  emptySubtext: { color: THEME.COLORS.textSecondary, fontSize: 14, marginTop: 5 }
});

export default ValidationCenter;