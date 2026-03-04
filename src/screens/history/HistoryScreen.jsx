// src/screens/history/HistoryScreen.jsx
// HISTORIQUE DES COURSES - Tracabilite et gestion de la visibilite
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { ConfirmModal } from '../../components/admin/AdminModals';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import GlassCard from '../../components/ui/GlassCard';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { useGetRideHistoryQuery, useHideFromHistoryMutation } from '../../store/api/ridesApiSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const STATUS_CONFIG = {
  completed: { color: THEME.COLORS.success, icon: 'checkmark-circle', label: 'Terminée' },
  cancelled: { color: THEME.COLORS.danger, icon: 'close-circle', label: 'Annulée' },
  in_progress: { color: THEME.COLORS.warning, icon: 'time', label: 'En cours' },
  accepted: { color: THEME.COLORS.info, icon: 'car', label: 'En approche' }
};

const HistoryScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const isDriver = user?.role === 'driver';
  
  const flatListRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [page, setPage] = useState(1);
  
  const { data, isLoading, isFetching, refetch } = useGetRideHistoryQuery({ page, limit: 15 });
  const [hideRide, { isLoading: isHiding }] = useHideFromHistoryMutation();

  const [rideToDelete, setRideToDelete] = useState(null);

  const rides = data?.data?.rides || data?.rides || [];

  const handleScroll = (event) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const halfScreenHeight = layoutMeasurement.height / 2;
    setShowScrollTop(contentOffset.y > halfScreenHeight);
  };

  const scrollToTop = () => {
    if (rides && rides.length > 0) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });
  };

  const handleHideConfirm = async () => {
    if (!rideToDelete) return;
    try {
      await hideRide(rideToDelete).unwrap();
      dispatch(showSuccessToast({ title: 'Supprimée', message: 'La course a été retirée de votre historique.' }));
    } catch (e) {
      dispatch(showErrorToast({ title: 'Erreur', message: 'Impossible de masquer cette course.' }));
    } finally {
      setRideToDelete(null);
    }
  };

  const renderRideItem = ({ item }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.cancelled;
    
    return (
      <GlassCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          <View style={styles.statusBadge}>
            <Ionicons name={config.icon} size={14} color={config.color} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.routeTimeline}>
            <View style={[styles.dot, { backgroundColor: THEME.COLORS.primary }]} />
            <View style={styles.line} />
            <View style={[styles.dot, { backgroundColor: THEME.COLORS.textPrimary }]} />
          </View>
          <View style={styles.routeTexts}>
            <Text style={styles.addressText} numberOfLines={1}>{item.origin?.address || 'Adresse de départ inconnue'}</Text>
            <Text style={[styles.addressText, styles.addressBottom]} numberOfLines={1}>{item.destination?.address || 'Adresse d\'arrivée inconnue'}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.userInfo}>
            <Ionicons name="person-circle-outline" size={20} color={THEME.COLORS.textSecondary} />
            <Text style={styles.userText}>
              {isDriver 
                ? (item.rider?.name || 'Passager Inconnu') 
                : (item.driver?.name || 'Chauffeur Inconnu')}
            </Text>
          </View>
          
          <View style={styles.rightFooter}>
            {item.price ? (
              <Text style={styles.priceText}>{item.price.toLocaleString('fr-FR')} FCFA</Text>
            ) : (
              <Text style={styles.priceText}>---</Text>
            )}
            
            <TouchableOpacity 
              style={styles.deleteBtn}
              onPress={() => setRideToDelete(item._id)}
              disabled={isHiding}
            >
              <Ionicons name="trash-outline" size={20} color={THEME.COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
          <Text style={styles.headerTitle}>Historique des courses</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.COLORS.primary} />
        </View>
      ) : rides.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="map-outline" size={60} color={THEME.COLORS.textTertiary} />
          <Text style={styles.emptyText}>Vous n'avez effectué aucune course.</Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={rides}
            keyExtractor={(item) => item._id}
            renderItem={renderRideItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onRefresh={refetch}
            refreshing={isFetching}
          />
          <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />
        </>
      )}

      <ConfirmModal 
        visible={!!rideToDelete}
        title="Masquer la course"
        message="Voulez-vous retirer cette course de votre historique ? Cette action n'impactera pas l'autre partie."
        isDestructive={true}
        onConfirm={handleHideConfirm}
        onCancel={() => setRideToDelete(null)}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 10 },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: THEME.COLORS.primary, fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 50, paddingTop: 10 },
  emptyText: { color: THEME.COLORS.textSecondary, fontSize: 16, marginTop: 15 },
  card: { padding: 15, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  dateText: { color: THEME.COLORS.textSecondary, fontSize: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.overlay, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  routeContainer: { flexDirection: 'row', marginBottom: 15 },
  routeTimeline: { width: 20, alignItems: 'center', marginRight: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, zIndex: 2 },
  line: { width: 2, height: 25, backgroundColor: THEME.COLORS.border, marginVertical: 2 },
  routeTexts: { flex: 1, justifyContent: 'space-between' },
  addressText: { color: THEME.COLORS.textPrimary, fontSize: 14 },
  addressBottom: { marginTop: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: THEME.COLORS.border },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  userText: { color: THEME.COLORS.textSecondary, fontSize: 14, marginLeft: 5 },
  rightFooter: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  priceText: { color: THEME.COLORS.primary, fontSize: 16, fontWeight: 'bold' },
  deleteBtn: { padding: 5, backgroundColor: 'rgba(255, 59, 48, 0.1)', borderRadius: 8 }
});

export default HistoryScreen;