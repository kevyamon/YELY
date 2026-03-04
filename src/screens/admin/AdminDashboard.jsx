// src/screens/admin/AdminDashboard.jsx
// ECRAN COCKPIT - Rafraichissement des Claims Admin au Montage
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import React, { useEffect, useRef, useState } from 'react';
// CORRECTION SENIOR : Import depuis 'react-native' et non 'react-redux' !
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { ConfirmModal } from '../../components/admin/AdminModals';
import BlinkingBadge from '../../components/admin/BlinkingBadge';
import HelpModal from '../../components/admin/HelpModal';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import StatCard from '../../components/admin/StatCard';
import { useGetDashboardStatsQuery } from '../../store/api/adminApiSlice';
import { useGetAllReportsQuery } from '../../store/api/reportsApiSlice';
import { forceSilentRefresh, logout, selectCurrentUser } from '../../store/slices/authSlice';
import THEME from '../../theme/theme';

const GlassMenuCard = ({ children, style }) => (
  <View style={[styles.glassContainer, style]}>
    <BlurView intensity={60} tint="default" style={StyleSheet.absoluteFill} />
    <View style={styles.glassContent}>
      {children}
    </View>
  </View>
);

const AdminDashboard = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const scrollViewRef = useRef(null);
  
  const user = useSelector(selectCurrentUser);
  const isSuperAdmin = user?.role === 'superadmin';
  
  const [helpVisible, setHelpVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const [seenValidations, setSeenValidations] = useState(false);
  const [seenUsers, setSeenUsers] = useState(true); 
  const [seenReports, setSeenReports] = useState(false); 

  const prevStatsRef = useRef({ pendingValidations: 0, totalUsers: 0 });
  const prevReportsCountRef = useRef(0);
  const isFirstLoad = useRef(true);
  
  useEffect(() => {
    dispatch(forceSilentRefresh());
  }, [dispatch]);

  const { data: statsData, isLoading, refetch, isFetching, error } = useGetDashboardStatsQuery(undefined, {
    pollingInterval: 10000, 
    refetchOnMountOrArgChange: true,
  });

  const { data: reportsData } = useGetAllReportsQuery(undefined, {
    skip: user?.role !== 'admin' && user?.role !== 'superadmin',
  });
  
  const stats = statsData?.data || statsData || { totalUsers: 0, activeDrivers: 0, pendingValidations: 0 };
  const reports = reportsData?.data || reportsData || [];
  
  const unresolvedReportsCount = reports.filter(r => r.status !== 'RESOLVED').length;

  useEffect(() => {
    if (statsData) {
      if (isFirstLoad.current) {
        setSeenValidations(stats.pendingValidations === 0);
        isFirstLoad.current = false;
      } else {
        if (stats.pendingValidations > prevStatsRef.current.pendingValidations) {
          setSeenValidations(false);
        }
        if (stats.totalUsers > prevStatsRef.current.totalUsers) {
          setSeenUsers(false);
        }
      }
      prevStatsRef.current = { pendingValidations: stats.pendingValidations, totalUsers: stats.totalUsers };
    }
  }, [stats.pendingValidations, stats.totalUsers, statsData]);

  useEffect(() => {
    if (unresolvedReportsCount > prevReportsCountRef.current) {
      setSeenReports(false);
    }
    prevReportsCountRef.current = unresolvedReportsCount;
  }, [unresolvedReportsCount]);

  const handleNavigate = (route, id) => {
    if (id === 'validations') setSeenValidations(true);
    if (id === 'users') setSeenUsers(true);
    if (id === 'reports') setSeenReports(true); 
    navigation.navigate(route);
  };

  const menuItems = [
    { 
      id: 'validations', 
      title: 'Centre de Validation', 
      icon: 'checkmark-circle-outline', 
      route: 'ValidationCenter', 
      badge: !seenValidations && stats.pendingValidations > 0 ? stats.pendingValidations : undefined, 
      allowed: true 
    },
    { 
      id: 'users', 
      title: 'Gestion Utilisateurs', 
      icon: 'people-outline', 
      route: 'UsersManagement', 
      badge: !seenUsers ? "!" : undefined, 
      allowed: true 
    },
    { 
      id: 'reports', 
      title: 'Signalements', 
      icon: 'alert-circle-outline', 
      route: 'AdminReports', 
      badge: !seenReports && unresolvedReportsCount > 0 ? unresolvedReportsCount : undefined, 
      allowed: true 
    },
    { id: 'journal', title: 'Mon Journal', icon: 'book-outline', route: 'AdminJournal', allowed: true },
    { id: 'finance', title: 'Finance & Config', icon: 'cash-outline', route: 'FinanceConfig', allowed: isSuperAdmin }
  ];

  const handleScroll = (event) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > 100);
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const helpText = "Bienvenue sur le Cockpit central de Yely.\n\nIndicateurs :\n• Chauffeurs Actifs : Nombre de chauffeurs actuellement en règle et en ligne.\n• En Attente : Demandes de validation de paiement non traitées.\n• Utilisateurs : Total des comptes inscrits.";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Tour de Contrôle</Text>
          <Text style={styles.headerSubtitle}>Bienvenue, {user?.name || 'Administrateur'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setHelpVisible(true)} style={styles.actionButton}>
            <Ionicons name="help-circle-outline" size={26} color={THEME.COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setLogoutModalVisible(true)} style={[styles.actionButton, styles.logoutButton]}>
            <Ionicons name="log-out-outline" size={26} color={THEME.COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading && !isFetching} onRefresh={refetch} tintColor={THEME.COLORS.primary} />}
      >
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={24} color={THEME.COLORS.pureWhite} style={styles.errorIcon} />
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorTitle}>Erreur Serveur ({error?.status || 'X'})</Text>
              <Text style={styles.errorDetail}>Accès refusé ou session expirée.</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Indicateurs Clés</Text>
        <View style={styles.statsGrid}>
          <StatCard title="Chauffeurs Actifs" value={stats.activeDrivers} icon="car-outline" />
          <StatCard title="En Attente" value={stats.pendingValidations} icon="document-text-outline" iconColor={stats.pendingValidations > 0 ? THEME.COLORS.danger : THEME.COLORS.primary} />
          <StatCard title="Utilisateurs" value={stats.totalUsers} icon="people-circle-outline" />
        </View>

        <Text style={styles.sectionTitle}>Modules d'Administration</Text>
        <View style={styles.menuGrid}>
          {menuItems.filter(item => item.allowed).map((item) => (
            <TouchableOpacity 
              key={item.id} 
              activeOpacity={0.7} 
              onPress={() => handleNavigate(item.route, item.id)}
              style={styles.menuButtonWrapper}
            >
              <GlassMenuCard style={styles.menuCard}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon} size={32} color={THEME.COLORS.textPrimary} />
                  <BlinkingBadge count={item.badge} />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </GlassMenuCard>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <HelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} title="Aide : Tour de Contrôle" content={helpText} />
      
      <ConfirmModal 
        visible={logoutModalVisible}
        title="Déconnexion"
        message="Êtes-vous sûr de vouloir quitter la tour de contrôle ?"
        isDestructive={true}
        onConfirm={() => {
          setLogoutModalVisible(false);
          dispatch(logout());
        }}
        onCancel={() => setLogoutModalVisible(false)}
      />

      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: THEME.COLORS.primary },
  headerSubtitle: { fontSize: 14, color: THEME.COLORS.textSecondary, marginTop: 4 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { padding: 8, backgroundColor: THEME.COLORS.overlay, borderRadius: THEME.BORDERS.radius.md, marginLeft: 10 },
  logoutButton: { backgroundColor: 'rgba(192, 57, 43, 0.1)' },
  scrollContent: { padding: 20, paddingBottom: 80 },
  errorBanner: { flexDirection: 'row', backgroundColor: THEME.COLORS.danger, padding: 15, borderRadius: THEME.BORDERS.radius.md, marginBottom: 20, alignItems: 'center' },
  errorIcon: { marginRight: 15 },
  errorTextContainer: { flex: 1 },
  errorTitle: { color: THEME.COLORS.pureWhite, fontWeight: 'bold', fontSize: 16 },
  errorDetail: { color: THEME.COLORS.pureWhite, fontSize: 13, marginTop: 4, opacity: 0.9 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: THEME.COLORS.textPrimary, marginBottom: 15, marginTop: 10 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  glassContainer: { overflow: 'hidden', borderRadius: THEME.BORDERS.radius.xl, borderWidth: THEME.BORDERS.width.thin, borderColor: THEME.COLORS.border, backgroundColor: THEME.COLORS.overlay },
  glassContent: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuButtonWrapper: { width: '48%', marginBottom: 15 },
  menuCard: { height: 120 },
  menuIconContainer: { position: 'relative', marginBottom: 12 },
  menuTitle: { color: THEME.COLORS.textPrimary, fontSize: 14, fontWeight: '500', textAlign: 'center' }
});

export default AdminDashboard;