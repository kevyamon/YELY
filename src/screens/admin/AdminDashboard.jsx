// src/screens/admin/AdminDashboard.jsx
// ECRAN COCKPIT - Tour de controle centrale
// UI: Liquid Glassmorphism (Native BlurView)
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useGetDashboardStatsQuery } from '../../store/api/adminApiSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';

const GlassCard = ({ children, style }) => (
  <View style={[styles.glassContainer, style]}>
    <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
    <View style={styles.glassContent}>
      {children}
    </View>
  </View>
);

const AdminDashboard = () => {
  const navigation = useNavigation();
  const user = useSelector(selectCurrentUser);
  const isSuperAdmin = user?.role === 'superadmin';
  
  const { data: statsData, isLoading, refetch, isFetching } = useGetDashboardStatsQuery();
  const stats = statsData?.data || { totalUsers: 0, activeDrivers: 0, pendingValidations: 0 };

  const menuItems = [
    {
      id: 'validations',
      title: 'Centre de Validation',
      icon: 'checkmark-circle-outline',
      route: 'ValidationCenter',
      badge: stats.pendingValidations > 0 ? stats.pendingValidations : null,
      allowed: true
    },
    {
      id: 'users',
      title: 'Gestion Utilisateurs',
      icon: 'people-outline',
      route: 'UsersManagement',
      allowed: true
    },
    {
      id: 'journal',
      title: 'Mon Journal',
      icon: 'book-outline',
      route: 'AdminJournal',
      allowed: true
    },
    {
      id: 'finance',
      title: 'Finance & Config',
      icon: 'cash-outline',
      route: 'FinanceConfig',
      allowed: isSuperAdmin
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tour de Controle</Text>
        <Text style={styles.headerSubtitle}>Bienvenue, {user?.name || 'Administrateur'}</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading || isFetching} onRefresh={refetch} tintColor={THEME.COLORS.champagneGold} />}
      >
        <Text style={styles.sectionTitle}>Indicateurs Cles</Text>
        <View style={styles.statsGrid}>
          <GlassCard style={styles.statCard}>
            <Ionicons name="car-outline" size={24} color={THEME.COLORS.champagneGold} />
            <Text style={styles.statValue}>{stats.activeDrivers}</Text>
            <Text style={styles.statLabel}>Chauffeurs Actifs</Text>
          </GlassCard>
          
          <GlassCard style={styles.statCard}>
            <Ionicons name="document-text-outline" size={24} color={stats.pendingValidations > 0 ? '#FF3B30' : THEME.COLORS.champagneGold} />
            <Text style={styles.statValue}>{stats.pendingValidations}</Text>
            <Text style={styles.statLabel}>En Attente</Text>
          </GlassCard>
          
          <GlassCard style={styles.statCard}>
            <Ionicons name="people-circle-outline" size={24} color={THEME.COLORS.champagneGold} />
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Utilisateurs</Text>
          </GlassCard>
        </View>

        <Text style={styles.sectionTitle}>Modules d'Administration</Text>
        <View style={styles.menuGrid}>
          {menuItems.filter(item => item.allowed).map((item) => (
            <TouchableOpacity 
              key={item.id} 
              activeOpacity={0.7} 
              onPress={() => navigation.navigate(item.route)}
              style={styles.menuButtonWrapper}
            >
              <GlassCard style={styles.menuCard}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon} size={32} color={THEME.COLORS.textPrimary} />
                  {item.badge !== null && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.COLORS.champagneGold,
  },
  headerSubtitle: {
    fontSize: 16,
    color: THEME.COLORS.textSecondary,
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.COLORS.textPrimary,
    marginBottom: 15,
    marginTop: 10,
  },
  glassContainer: {
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  glassContent: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 15,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary,
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: THEME.COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuButtonWrapper: {
    width: '48%',
    marginBottom: 15,
  },
  menuCard: {
    height: 120,
  },
  menuIconContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  menuTitle: {
    color: THEME.COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#121212',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  }
});

export default AdminDashboard;