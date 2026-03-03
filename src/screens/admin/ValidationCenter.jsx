// src/screens/admin/ValidationCenter.jsx
// CENTRE DE VALIDATION - Temps Reel (Polling) et Scroll To Top integre
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import ValidationModal from '../../components/admin/ValidationModal';
import { useApproveTransactionMutation, useGetValidationQueueQuery, useRejectTransactionMutation } from '../../store/api/adminApiSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
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
  
  const currentUser = useSelector(selectCurrentUser);
  
  const { data: queueResponse, isLoading, isFetching, refetch, error } = useGetValidationQueueQuery({ page }, {
    pollingInterval: 5000,
    refetchOnMountOrArgChange: true,
  });
  
  const [approveTx, { isLoading: isApproving }] = useApproveTransactionMutation();
  const [rejectTx, { isLoading: isRejecting }] = useRejectTransactionMutation();

  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const transactions = queueResponse?.data?.transactions || [];
  const isProcessing = isApproving || isRejecting;

  const handleApprove = async (id) => {
    try { 
      await approveTx(id).unwrap(); 
      setSelectedTransaction(null); 
    } catch (e) { 
      console.error("[ValidationCenter] Erreur lors de l'approbation:", e);
      Alert.alert('Erreur', 'Impossible de valider cette transaction. Veuillez reessayer.'); 
    }
  };

  const handleReject = async (id, reason) => {
    try { 
      await rejectTx({ transactionId: id, reason }).unwrap(); 
      setSelectedTransaction(null); 
    } catch (e) { 
      console.error("[ValidationCenter] Erreur lors du rejet:", e);
      Alert.alert('Erreur', 'Impossible de rejeter cette transaction. Veuillez reessayer.'); 
    }
  };

  const handleScroll = (event) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > 150);
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const formatPlanName = (planId) => {
    if (planId === 'WEEKLY') return 'PASS SEMAINE';
    if (planId === 'MONTHLY') return 'PASS MOIS';
    return 'INCONNU';
  };

  const renderItem = ({ item }) => {
    const phone = item.senderPhone || item.phone || item.metadata?.senderPhone || 'Non specifie';
    const amount = item.amount || item.metadata?.amount || 0;
    const driverName = item.user?.name || 'Chauffeur inconnu';
    
    // Verification d'assignation
    let isAssignedToOther = false;
    let assigneeName = 'Un autre admin';
    
    if (item.assignedAdmin) {
      const assignedId = typeof item.assignedAdmin === 'string' ? item.assignedAdmin : item.assignedAdmin._id;
      if (assignedId && currentUser?._id && assignedId !== currentUser._id) {
        isAssignedToOther = true;
        assigneeName = item.assignedAdmin.name || assigneeName;
      }
    }

    return (
      <GlassCard style={styles.transactionCard} onPress={() => setSelectedTransaction(item)}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{formatPlanName(item.planId)}</Text>
            </View>
            {isAssignedToOther && (
              <View style={styles.assignedBadge}>
                <Ionicons name="lock-closed" size={10} color={THEME.COLORS.warning} style={styles.assignedIcon} />
                <Text style={styles.assignedText}>Assigne a {assigneeName}</Text>
              </View>
            )}
          </View>
          <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
        </View>
        <View style={styles.cardBody}>
          <Ionicons name="document-attach-outline" size={24} color={THEME.COLORS.primary} style={styles.icon} />
          <View style={styles.cardInfo}>
            <Text style={styles.amountText}>{amount} FCFA</Text>
            <Text style={styles.driverNameText}>{driverName}</Text>
            <Text style={styles.phoneText}>Num. Depot: {phone}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={THEME.COLORS.textTertiary} />
        </View>
      </GlassCard>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centre de Validation</Text>
      </View>

      <View style={styles.listContainer}>
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={24} color={THEME.COLORS.textPrimary || '#FFFFFF'} style={styles.errorIcon} />
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorTitle}>Erreur Reseau ({error?.status || 'X'})</Text>
              <Text style={styles.errorDetail}>Impossible de synchroniser avec le serveur.</Text>
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
                  <Text style={styles.emptyText}>Aucune assignation en attente.</Text>
                  <Text style={styles.emptySubtext}>Votre file de travail est vide.</Text>
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
  errorBanner: { flexDirection: 'row', backgroundColor: THEME.COLORS.error || '#FF4757', padding: 15, marginHorizontal: 20, borderRadius: THEME.BORDERS?.radius?.md || 8, marginBottom: 20, alignItems: 'center' },
  errorIcon: { marginRight: 15 },
  errorTextContainer: { flex: 1 },
  errorTitle: { color: THEME.COLORS.textPrimary || '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  errorDetail: { color: THEME.COLORS.textPrimary || '#FFFFFF', fontSize: 13, marginTop: 4 },
  glassContainer: { overflow: 'hidden', borderRadius: THEME.BORDERS?.radius?.lg || 12, borderWidth: THEME.BORDERS?.width?.thin || 1, borderColor: THEME.COLORS.border, backgroundColor: THEME.COLORS.glassDark || 'rgba(255, 255, 255, 0.05)', marginBottom: 15 },
  glassContent: { padding: 15 },
  transactionCard: { padding: 0 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerLeft: { flexDirection: 'column', alignItems: 'flex-start' },
  typeBadge: { backgroundColor: 'transparent', borderWidth: 1, borderColor: THEME.COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 4 },
  typeText: { color: THEME.COLORS.primary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  assignedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 193, 7, 0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, borderColor: THEME.COLORS.warning },
  assignedIcon: { marginRight: 4 },
  assignedText: { color: THEME.COLORS.warning, fontSize: 10, fontWeight: 'bold' },
  dateText: { color: THEME.COLORS.textSecondary, fontSize: 12 },
  cardBody: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 15 },
  cardInfo: { flex: 1 },
  amountText: { color: THEME.COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' },
  driverNameText: { color: THEME.COLORS.primary, fontSize: 14, marginTop: 4, fontWeight: '500' },
  phoneText: { color: THEME.COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: THEME.COLORS.textPrimary, fontSize: 18, fontWeight: '600', marginTop: 15 },
  emptySubtext: { color: THEME.COLORS.textSecondary, fontSize: 14, marginTop: 5 }
});

export default ValidationCenter;