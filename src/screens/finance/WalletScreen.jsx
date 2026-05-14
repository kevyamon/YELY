// src/screens/finance/WalletScreen.jsx
// WALLET SCREEN - Gestion des revenus & Paiements
// CSCSM Level: Bank Grade

import React, { useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import ScreenWrapper from '../../components/ui/ScreenWrapper';
import GlassCard from '../../components/ui/GlassCard';
import GoldButton from '../../components/ui/GoldButton';
import THEME from '../../theme/theme';
import { selectCurrentUser } from '../../store/slices/authSlice';

const { width } = Dimensions.get('window');

const WalletScreen = ({ navigation }) => {
  const scrollY = useSharedValue(0);
  const user = useSelector(selectCurrentUser);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const transactions = [
    { id: '1', type: 'in', amount: '2,500', label: 'Vente Pizza', date: 'Aujourd\'hui, 14:20' },
    { id: '2', type: 'out', amount: '1,200', label: 'Course Taxi', date: 'Hier, 18:45' },
    { id: '3', type: 'in', amount: '5,000', label: 'Vente Burger Combo', date: '12 Mai, 12:30' },
  ];

  return (
    <ScreenWrapper style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Portefeuille</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Balance Card */}
        <GlassCard style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Solde disponible</Text>
          <Text style={styles.balanceValue}>12,450 FCFA</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="arrow-down-circle" size={20} color={THEME.COLORS.success || '#27ae60'} />
              <Text style={styles.statValueSmall}>+15,000</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="arrow-up-circle" size={20} color={THEME.COLORS.danger || '#e74c3c'} />
              <Text style={styles.statValueSmall}>-2,550</Text>
            </View>
          </View>
        </GlassCard>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <View style={[styles.actionIcon, { backgroundColor: THEME.COLORS.primary }]}>
              <Ionicons name="download-outline" size={24} color={THEME.COLORS.textInverse} />
            </View>
            <Text style={styles.actionLabel}>Retrait</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <View style={[styles.actionIcon, { backgroundColor: THEME.COLORS.glassSurface }]}>
              <Ionicons name="add-outline" size={24} color={THEME.COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>Recharger</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transactions récentes</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {transactions.map((tx) => (
          <GlassCard key={tx.id} style={styles.txCard}>
            <View style={[styles.txIcon, { backgroundColor: tx.type === 'in' ? 'rgba(39, 174, 96, 0.1)' : 'rgba(231, 76, 60, 0.1)' }]}>
              <Ionicons 
                name={tx.type === 'in' ? 'arrow-down' : 'arrow-up'} 
                size={20} 
                color={tx.type === 'in' ? '#27ae60' : '#e74c3c'} 
              />
            </View>
            <View style={styles.txInfo}>
              <Text style={styles.txLabel}>{tx.label}</Text>
              <Text style={styles.txDate}>{tx.date}</Text>
            </View>
            <Text style={[styles.txAmount, { color: tx.type === 'in' ? '#27ae60' : THEME.COLORS.textPrimary }]}>
              {tx.type === 'in' ? '+' : '-'}{tx.amount}
            </Text>
          </GlassCard>
        ))}

        <GoldButton 
          title="LIER UN MOYEN DE PAIEMENT" 
          icon="card-outline"
          onPress={() => {}}
          style={styles.bottomBtn}
        />
      </Animated.ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.COLORS.glassSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  balanceCard: {
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: THEME.COLORS.glassDark,
    borderColor: THEME.COLORS.champagneGold,
    borderWidth: 1.5,
  },
  balanceLabel: { fontSize: 14, color: THEME.COLORS.textSecondary, marginBottom: 8 },
  balanceValue: { fontSize: 36, fontWeight: '800', color: THEME.COLORS.textPrimary, letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: 20, marginTop: 20 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValueSmall: { color: THEME.COLORS.textSecondary, fontWeight: '600', fontSize: 13 },

  actionRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 40 },
  actionBtn: { alignItems: 'center' },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    ...THEME.SHADOWS.md
  },
  actionLabel: { fontSize: 14, color: THEME.COLORS.textPrimary, fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  seeAll: { fontSize: 14, color: THEME.COLORS.primary, fontWeight: '600' },

  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 12,
  },
  txIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1, marginLeft: 15 },
  txLabel: { fontSize: 16, fontWeight: '600', color: THEME.COLORS.textPrimary },
  txDate: { fontSize: 12, color: THEME.COLORS.textSecondary, marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: 'bold' },

  bottomBtn: { marginTop: 30 }
});

export default WalletScreen;
