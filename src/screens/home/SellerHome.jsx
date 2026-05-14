// src/screens/home/SellerHome.jsx
// HOME SELLER - Orchestrateur Business & Mobilité
// CSCSM Level: Bank Grade

import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import MapCard from '../../components/map/MapCard';
import SmartHeader from '../../components/ui/SmartHeader';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import GlassCard from '../../components/ui/GlassCard';
import GoldButton from '../../components/ui/GoldButton';

import useGeolocation from '../../hooks/useGeolocation';
import { selectCurrentUser } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';

const SellerHome = ({ navigation }) => {
  const mapRef = useRef(null);
  const scrollY = useSharedValue(0);
  const user = useSelector(selectCurrentUser);
  const { location, currentAddress } = useGeolocation();

  const handleGoToManageProducts = () => {
    navigation.navigate('ManageProducts');
  };

  const handleGoToMarketplace = () => {
    navigation.navigate('MarketplaceHub');
  };

  return (
    <View style={styles.screenWrapper}>
      <SmartHeader 
        scrollY={scrollY}
        address={currentAddress || "Chargement position..."}
        userName={user?.name?.split(' ')[0] || "Vendeur"}
        onMenuPress={() => navigation.navigate('Menu')}
        onNotificationPress={() => navigation.navigate('Notifications')}
        onSearchPress={() => navigation.navigate('RiderHome')} // Un vendeur peut aussi commander une course
        onShoppingPress={handleGoToMarketplace}
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => { scrollY.value = e.nativeEvent.contentOffset.y; }}
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
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Produits</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Ionicons name="cash-outline" size={24} color={THEME.COLORS.success || '#27ae60'} />
            <Text style={styles.statValue}>0 FCFA</Text>
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

        <View style={styles.mapPreviewContainer}>
          <Text style={styles.sectionTitle}>Ma zone d'activité</Text>
          <View style={styles.miniMap}>
             <MapCard 
               ref={mapRef}
               location={location}
               showUserMarker={true}
               floating={true}
               interactive={false}
             />
          </View>
        </View>

        <GoldButton 
          title="ACCÉDER AU MARCHÉ" 
          icon="cart"
          onPress={handleGoToMarketplace}
          style={styles.bottomBtn}
        />

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: THEME.COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  spacer: { height: 160 },
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

  mapPreviewContainer: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.COLORS.textPrimary, marginBottom: 15 },
  miniMap: { height: 200, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: THEME.COLORS.border },
  
  bottomBtn: { marginTop: 10 }
});

export default SellerHome;
