// src/screens/admin/AdminDashboard.jsx
// TOUR DE CONTROLE ADMIN - Pilotage en temps reel
// STANDARD: Clean Architecture / Bank Grade (Modularise < 325 lignes, Sans Emojis)

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import React, { useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import AdminHeaderMenu from '../../components/admin/AdminHeaderMenu';
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
    <View style={styles.glassContent}>{children}</View>
  </View>
);

const AdminDashboard = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const scrollViewRef = useRef(null);
  
  const user = useSelector(selectCurrentUser);
  const isSuperAdmin = user?.role === 'superadmin';
  
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const [seenUsers, setSeenUsers] = useState(true); 
  const [seenReports, setSeenReports] = useState(false); 
  const [seenIdentities, setSeenIdentities] = useState(false); 

  const prevStatsRef = useRef({ totalUsers: 0, pendingDriverValidations: 0 });
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
  
  const rawStats = statsData?.data || statsData || {};
  const stats = {
    totalUsers: rawStats.totalUsers || 0,
    totalRiders: rawStats.totalRiders || 0,
    totalDrivers: rawStats.totalDrivers || 0,
    activeDrivers: rawStats.activeDrivers || 0,
    pendingDriverValidations: rawStats.pendingDriverValidations || 0
  };
  
  const reports = reportsData?.data || reportsData || [];
  const unresolvedReportsCount = reports.filter(r => r.status !== 'RESOLVED').length;

  useEffect(() => {
    if (statsData) {
      if (isFirstLoad.current) {
        setSeenIdentities(stats.pendingDriverValidations === 0);
        isFirstLoad.current = false;
      } else {
        if (stats.pendingDriverValidations > (prevStatsRef.current.pendingDriverValidations || 0)) {
          setSeenIdentities(false);
        }
        if (stats.totalUsers > prevStatsRef.current.totalUsers) {
          setSeenUsers(false);
        }
      }
      prevStatsRef.current = { 
        totalUsers: stats.totalUsers,
        pendingDriverValidations: stats.pendingDriverValidations
      };
    }
  }, [stats.pendingDriverValidations, stats.totalUsers, statsData]);

  useEffect(() => {
    if (unresolvedReportsCount > prevReportsCountRef.current) {
      setSeenReports(false);
    }
    prevReportsCountRef.current = unresolvedReportsCount;
  }, [unresolvedReportsCount]);

  const handleNavigate = (route, id) => {
    if (id === 'users') setSeenUsers(true);
    if (id === 'reports') setSeenReports(true); 
    if (id === 'identities') setSeenIdentities(true); 
    navigation.navigate(route);
  };

  const menuItems = [
    { 
      id: 'subscriptions', 
      title: 'Abonnements & Relevés', 
      icon: 'calendar-outline', 
      route: 'SubscriptionManagement', 
      allowed: true 
    },
    { 
      id: 'identities', 
      title: 'Verifications ID', 
      icon: 'shield-checkmark-outline', 
      route: 'IdentityValidationCenter', 
      badge: !seenIdentities && stats.pendingDriverValidations > 0 ? stats.pendingDriverValidations : undefined, 
      allowed: true 
    },
    { 
      id: 'users', 
      title: 'Utilisateurs', 
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
    { id: 'rides', title: 'Historique Courses', icon: 'car-sport-outline', route: 'AdminRides', allowed: true },
    { id: 'marketplace', title: 'Marketplace Yely', icon: 'basket-outline', route: 'AdminMarketplace', allowed: true },
    { id: 'journal', title: 'Journal d\'Audit', icon: 'book-outline', route: 'AdminJournal', allowed: true },
    { id: 'banners', title: 'Bannieres Live', icon: 'images-outline', route: 'AdminBanners', allowed: isSuperAdmin },
    { id: 'finance', title: 'Finance & Config', icon: 'cash-outline', route: 'FinanceConfig', allowed: isSuperAdmin },
    { id: 'operationalReports', title: 'Rapports Fiscaux', icon: 'document-text-outline', route: 'AdminOperationalReports', allowed: isSuperAdmin },
    { id: 'map', title: 'Gestion Carte', icon: 'map-outline', route: 'MapManagement', allowed: isSuperAdmin },
    { id: 'systemConfig', title: 'Configuration', icon: 'settings-outline', route: 'SystemConfig', allowed: isSuperAdmin }
  ];

  const handleScroll = (event) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > 100);
  };

  const helpText = "Cockpit Yely :\n\n- Chauffeurs Actifs : Chauffeurs en ligne sur le terrain.\n- Passagers : Nombre total de clients inscrits.\n- Chauffeurs : Total des conducteurs inscrits.\n- Abonnements & Releves : Registre et historique financier des paiements.";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Yely Control</Text>
          <Text style={styles.headerSubtitle}>Hello, {user?.name || 'Admin'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setHeaderMenuVisible(true)} style={styles.actionButton}>
            <Ionicons name="menu-outline" size={28} color={THEME.COLORS.primary} />
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
              <Text style={styles.errorTitle}>Erreur Serveur</Text>
              <Text style={styles.errorDetail}>Verification de synchronisation reseau.</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Indicateurs en temps reel</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statWrapper}><StatCard title="Chauffeurs Actifs" value={stats.activeDrivers} icon="car-sport-outline" /></View>
          <View style={styles.statWrapper}><StatCard title="Total Chauffeurs" value={stats.totalDrivers} icon="people-circle-outline" /></View>
          <View style={styles.statWrapper}><StatCard title="Passagers" value={stats.totalRiders} icon="person-outline" /></View>
          <View style={styles.statWrapper}><StatCard title="Total Inscrits" value={stats.totalUsers} icon="people-outline" /></View>
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

      <AdminHeaderMenu 
        visible={headerMenuVisible}
        onClose={() => setHeaderMenuVisible(false)}
        onProfile={() => navigation.navigate('Profile')}
        onHelp={() => setHelpVisible(true)}
        onLogout={() => setLogoutModalVisible(true)}
      />

      <HelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} title="Aide : Tour de Controle" content={helpText} />
      
      <ConfirmModal 
        visible={logoutModalVisible}
        title="Deconnexion"
        message="Etes-vous sur de vouloir quitter le cockpit ?"
        isDestructive={true}
        onConfirm={() => {
          setLogoutModalVisible(false);
          dispatch(logout());
        }}
        onCancel={() => setLogoutModalVisible(false)}
      />

      <ScrollToTopButton visible={showScrollTop} onPress={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })} />
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
  scrollContent: { padding: 20, paddingBottom: 80 },
  errorBanner: { flexDirection: 'row', backgroundColor: THEME.COLORS.danger, padding: 15, borderRadius: THEME.BORDERS.radius.md, marginBottom: 20, alignItems: 'center' },
  errorIcon: { marginRight: 15 },
  errorTextContainer: { flex: 1 },
  errorTitle: { color: THEME.COLORS.pureWhite, fontWeight: 'bold', fontSize: 16 },
  errorDetail: { color: THEME.COLORS.pureWhite, fontSize: 13, marginTop: 4, opacity: 0.9 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: THEME.COLORS.textPrimary, marginBottom: 15, marginTop: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  statWrapper: { width: '48%', marginBottom: 15 },
  glassContainer: { overflow: 'hidden', borderRadius: THEME.BORDERS.radius.xl, borderWidth: 1, borderColor: THEME.COLORS.border, backgroundColor: THEME.COLORS.overlay },
  glassContent: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuButtonWrapper: { width: '48%', marginBottom: 15 },
  menuCard: { height: 120 },
  menuIconContainer: { position: 'relative', marginBottom: 12 },
  menuTitle: { color: THEME.COLORS.textPrimary, fontSize: 13, fontWeight: '500', textAlign: 'center' }
});

export default AdminDashboard;