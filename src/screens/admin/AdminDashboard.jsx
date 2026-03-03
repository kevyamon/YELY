// src/screens/admin/AdminDashboard.jsx
// ECRAN COCKPIT - Refactorise avec Composants Partages (DRY)
// UI: Liquid Glassmorphism
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import HelpModal from '../../components/admin/HelpModal';
import StatCard from '../../components/admin/StatCard';
import { useGetDashboardStatsQuery } from '../../store/api/adminApiSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';

const GlassMenuCard = ({ children, style }) => (
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
  
  const [helpVisible, setHelpVisible] = useState(false);
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

  const helpText = "Bienvenue sur le Cockpit central de Yely.\n\n" +
                   "Indicateurs :\n" +
                   "• Chauffeurs Actifs : Nombre de chauffeurs actuellement en regle et en ligne.\n" +
                   "• En Attente : Demandes de validation de paiement non traitees.\n" +
                   "• Utilisateurs : Total des comptes inscrits.\n\n" +
                   "Utilisez les cartes du bas pour naviguer vers les differents modules de gestion. Certaines zones sont strictement reservees a la Direction.";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Tour de Controle</Text>
          <Text style={styles.headerSubtitle}>Bienvenue, {user?.name || 'Administrateur'}</Text>
        </View>
        <TouchableOpacity onPress={() => setHelpVisible(true)} style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={28} color={THEME.COLORS.champagneGold} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading || isFetching} onRefresh={refetch} tintColor={THEME.COLORS.champagneGold} />}
      >
        <Text style={styles.sectionTitle}>Indicateurs Cles</Text>
        <View style={styles.statsGrid}>
          <StatCard 
            title="Chauffeurs Actifs" 
            value={stats.activeDrivers} 
            icon="car-outline" 
          />
          <StatCard 
            title="En Attente" 
            value={stats.pendingValidations} 
            icon="document-text-outline" 
            iconColor={stats.pendingValidations > 0 ? '#FF3B30' : THEME.COLORS.champagneGold} 
          />
          <StatCard 
            title="Utilisateurs" 
            value={stats.totalUsers} 
            icon="people-circle-outline" 
          />
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
              <GlassMenuCard style={styles.menuCard}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon} size={32} color={THEME.COLORS.textPrimary} />
                  {item.badge !== null && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </GlassMenuCard>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <HelpModal 
        visible={helpVisible} 
        onClose={() => setHelpVisible(false)} 
        title="Aide : Tour de Controle"
        content={helpText}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  helpButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
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