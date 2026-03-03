// src/screens/admin/AdminDashboard.jsx
// ECRAN COCKPIT - Intégration de la Modale de Déconnexion Glassmorphism
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import React, { useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ConfirmModal } from '../../components/admin/AdminModals';
import HelpModal from '../../components/admin/HelpModal';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import StatCard from '../../components/admin/StatCard';
import { useGetDashboardStatsQuery } from '../../store/api/adminApiSlice';
import { logout, selectCurrentUser } from '../../store/slices/authSlice';
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
  
  const { data: statsData, isLoading, refetch, isFetching, error } = useGetDashboardStatsQuery(undefined, {
    pollingInterval: 5000,
    refetchOnMountOrArgChange: true,
  });
  
  const stats = statsData?.data || statsData || { totalUsers: 0, activeDrivers: 0, pendingValidations: 0 };

  const menuItems = [
    { id: 'validations', title: 'Centre de Validation', icon: 'checkmark-circle-outline', route: 'ValidationCenter', badge: stats.pendingValidations > 0 ? stats.pendingValidations : undefined, allowed: true },
    { id: 'users', title: 'Gestion Utilisateurs', icon: 'people-outline', route: 'UsersManagement', allowed: true },
    { id: 'journal', title: 'Mon Journal', icon: 'book-outline', route: 'AdminJournal', allowed: true },
    { id: 'finance', title: 'Finance & Config', icon: 'cash-outline', route: 'FinanceConfig', allowed: isSuperAdmin }
  ];

  const handleScroll = (event) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > 100);
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const helpText = "Bienvenue sur le Cockpit central de Yely.\n\nIndicateurs :\n• Chauffeurs Actifs : Nombre de chauffeurs actuellement en regle et en ligne.\n• En Attente : Demandes de validation de paiement non traitees.\n• Utilisateurs : Total des comptes inscrits.\n\nUtilisez les cartes du bas pour naviguer vers les differents modules de gestion.";

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
              <Text style={styles.errorDetail}>Connexion au Backend refusee.</Text>
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
            <TouchableOpacity key={item.id} activeOpacity={0.7} onPress={() => navigation.navigate(item.route)} style={styles.menuButtonWrapper}>
              <GlassMenuCard style={styles.menuCard}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon} size={32} color={THEME.COLORS.textPrimary} />
                  {item.badge != null && (
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

      <HelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} title="Aide : Tour de Controle" content={helpText} />
      
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
  menuTitle: { color: THEME.COLORS.textPrimary, fontSize: 14, fontWeight: '500', textAlign: 'center' },
  badge: { position: 'absolute', top: -5, right: -10, backgroundColor: THEME.COLORS.danger, borderRadius: 12, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, borderWidth: 2, borderColor: THEME.COLORS.background },
  badgeText: { color: THEME.COLORS.pureWhite, fontSize: 12, fontWeight: 'bold' }
});

export default AdminDashboard;