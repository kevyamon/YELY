// src/screens/history/HistoryScreen.jsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

import GlassCard from '../../components/ui/GlassCard';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { useGetRideHistoryQuery } from '../../store/api/ridesApiSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';

const STATUS_CONFIG = {
  completed: { color: THEME.COLORS.success, icon: 'checkmark-circle', label: 'Terminée' },
  cancelled: { color: THEME.COLORS.danger, icon: 'close-circle', label: 'Annulée' },
  in_progress: { color: THEME.COLORS.warning, icon: 'time', label: 'En cours' },
  accepted: { color: THEME.COLORS.info, icon: 'car', label: 'En approche' }
};

const HistoryScreen = ({ navigation }) => {
  const user = useSelector(selectCurrentUser);
  const isDriver = user?.role === 'driver';
  
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, refetch } = useGetRideHistoryQuery({ page, limit: 15 });

  const rides = data?.data?.rides || [];

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });
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
          {item.price ? ( // ATTENTION: Dans ta base c'est "price" et non "agreedPrice" d'après ton completeRideSession
            <Text style={styles.priceText}>{item.price.toLocaleString('fr-FR')} FCFA</Text>
          ) : (
            <Text style={styles.priceText}>---</Text>
          )}
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
        <FlatList
          data={rides}
          keyExtractor={(item) => item._id}
          renderItem={renderRideItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isFetching}
        />
      )}
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
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  userText: { color: THEME.COLORS.textSecondary, fontSize: 14, marginLeft: 5 },
  priceText: { color: THEME.COLORS.primary, fontSize: 16, fontWeight: 'bold' },
});

export default HistoryScreen;