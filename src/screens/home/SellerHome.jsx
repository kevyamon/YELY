// src/screens/home/SellerHome.jsx
// HOME SELLER - Orchestrateur Business & Mobilité
// CSCSM Level: Bank Grade

import React, { memo } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import SmartHeader from '../../components/ui/SmartHeader';
import GlassCard from '../../components/ui/GlassCard';
import GoldButton from '../../components/ui/GoldButton';

import { selectCurrentUser } from '../../store/slices/authSlice';
import { useGetMyProductsQuery, useGetLedgerStatsQuery } from '../../store/api/marketplaceApiSlice';
import THEME from '../../theme/theme';

const SellerHome = ({ navigation }) => {
  const scrollY = useSharedValue(0);
  const user = useSelector(selectCurrentUser);
  
  // ─── DATA FETCHING ───
  const { data: productsData, isLoading: isLoadingProducts, refetch: refetchProducts } = useGetMyProductsQuery();
  const { data: statsData, isLoading: isLoadingStats, refetch: refetchStats } = useGetLedgerStatsQuery();

  React.useEffect(() => {
    refetchProducts();
    refetchStats();
  }, []);

  if (__DEV__) {
    console.log('[SELLER_HOME] Products Response:', JSON.stringify(productsData));
    console.log('[SELLER_HOME] Stats Response:', JSON.stringify(statsData));
    console.log('[SELLER_HOME] Current User:', user?._id, user?.role);
  }

  const productCount = productsData?.data?.length || productsData?.length || 0;
  const totalSales = statsData?.data?.totalEarnings || statsData?.totalEarnings || 0;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleGoToManageProducts = () => navigation.navigate('ManageProducts');
  const handleGoToMarketplace = () => navigation.navigate('MarketplaceHub');
  const handleGoToTaxi = () => navigation.navigate('RiderHome');

  return (
    <View style={styles.screenWrapper}>
      <SmartHeader 
        scrollY={scrollY}
        address="Ma Boutique"
        userName={user?.name?.split(' ')[0] || "Vendeur"}
        onMenuPress={() => navigation.navigate('Menu')}
        onNotificationPress={() => navigation.navigate('Notifications')}
        onSearchPress={handleGoToTaxi}
      />

      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View style={styles.spacer} />

        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Ma Boutique</Text>
          <Text style={styles.welcomeSubtitle}>Gérez vos ventes et vos déplacements.</Text>
        </View>

        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Ionicons name="cube-outline" size={24} color={THEME.COLORS.primary} />
            {isLoadingProducts ? (
              <ActivityIndicator size="small" color={THEME.COLORS.primary} style={{ marginTop: 8 }} />
            ) : (
              <Text style={styles.statValue}>{productCount}</Text>
            )}
            <Text style={styles.statLabel}>Produits</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Ionicons name="cash-outline" size={24} color={THEME.COLORS.success || '#27ae60'} />
            {isLoadingStats ? (
              <ActivityIndicator size="small" color={THEME.COLORS.primary} style={{ marginTop: 8 }} />
            ) : (
              <Text style={styles.statValue}>{totalSales.toLocaleString()} F</Text>
            )}
            <Text style={styles.statLabel}>Ventes</Text>
          </GlassCard>
        </View>

        <TouchableOpacity style={styles.mainActionCard} onPress={handleGoToManageProducts}>
          <View style={styles.actionIconContainer}>
            <Ionicons name="add-circle" size={32} color={THEME.COLORS.textInverse} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Gérer mes produits</Text>
            <Text style={styles.actionDesc}>Ajouter, modifier ou supprimer vos articles.</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={THEME.COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
             <TouchableOpacity style={styles.smallActionCard} onPress={() => navigation.navigate('SellerOrders')}>
               <Ionicons name="receipt" size={24} color={THEME.COLORS.primary} />
               <Text numberOfLines={1} style={styles.smallActionLabel}>Commandes</Text>
             </TouchableOpacity>

             <TouchableOpacity style={styles.smallActionCard} onPress={() => navigation.navigate('History')}>
               <Ionicons name="stats-chart" size={24} color={THEME.COLORS.primary} />
               <Text numberOfLines={1} style={styles.smallActionLabel}>Historique</Text>
             </TouchableOpacity>
            
            <TouchableOpacity style={styles.smallActionCard} onPress={() => navigation.navigate('RiderHome')}>
              <Ionicons name="car-sport" size={24} color={THEME.COLORS.primary} />
              <Text numberOfLines={1} style={styles.smallActionLabel}>Taxi</Text>
            </TouchableOpacity>
          </View>
        </View>

        <GoldButton 
          title="ACCÉDER AU MARCHÉ" 
          icon="cart"
          onPress={handleGoToMarketplace}
          style={styles.bottomBtn}
        />

      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: THEME.COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  spacer: { height: 240 },
  welcomeSection: { marginBottom: 25 },
  welcomeTitle: { fontSize: 28, fontWeight: '800', color: THEME.COLORS.textPrimary, letterSpacing: 0.5 },
  welcomeSubtitle: { fontSize: 16, color: THEME.COLORS.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 20 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: THEME.COLORS.textPrimary, marginTop: 8 },
  statLabel: { fontSize: 12, color: THEME.COLORS.textSecondary, marginTop: 4, textTransform: 'uppercase' },
  mainActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    marginBottom: 25,
    ...THEME.SHADOWS.md
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: THEME.COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionTextContainer: { flex: 1, marginLeft: 15 },
  actionTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  actionDesc: { fontSize: 14, color: THEME.COLORS.textSecondary, marginTop: 2 },
  quickActionsContainer: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.COLORS.textPrimary, marginBottom: 15 },
  actionsGrid: { flexDirection: 'row', gap: 15 },
  smallActionCard: {
    flex: 1,
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  smallActionLabel: { fontSize: 11, fontWeight: '600', color: THEME.COLORS.textPrimary, marginTop: 8, textAlign: 'center' },
  bottomBtn: { marginTop: 10 }
});

export default memo(SellerHome);
