// src/screens/admin/UsersManagement.jsx
// ECRAN UTILISATEURS - Intégration ScrollToTop (1/2 ecran) et UserInfoModal
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { ConfirmModal } from '../../components/admin/AdminModals';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import UserInfoModal from '../../components/admin/UserInfoModal';
import { useGetAllUsersQuery, useToggleUserBanMutation, useUpdateUserRoleMutation } from '../../store/api/adminApiSlice';
import THEME from '../../theme/theme';

const GlassCard = ({ children, style }) => (
  <View style={[styles.glassContainer, style]}>
    <BlurView intensity={60} tint="default" style={StyleSheet.absoluteFill} />
    <View style={styles.glassContent}>
      {children}
    </View>
  </View>
);

const UsersManagement = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: usersResponse, isLoading, refetch, error } = useGetAllUsersQuery({ page: 1, search: searchQuery });
  const [toggleBan] = useToggleUserBanMutation();
  const [updateRole] = useUpdateUserRoleMutation();

  const [confirmConfig, setConfirmConfig] = useState({ visible: false, title: '', message: '', onConfirm: null, isDestructive: false });
  const [selectedInfoUser, setSelectedInfoUser] = useState(null);

  // LOGIQUE SCROLL TO TOP (A la moitie de l'ecran)
  const flatListRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { height: screenHeight } = useWindowDimensions();

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    // Le bouton s'affiche si on a defile de plus de 50% de la hauteur de l'ecran
    setShowScrollTop(scrollPosition > screenHeight / 2);
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const users = usersResponse?.data?.users || usersResponse?.users || [];

  const translateRole = (role) => {
    const roles = { rider: 'Passager', driver: 'Chauffeur', admin: 'Administrateur', superadmin: 'Direction' };
    return roles[role] || role.toUpperCase();
  };

  const handleBanToggle = (user) => {
    const actionText = user.isBanned ? 'lever le bannissement de' : 'bannir';
    setConfirmConfig({
      visible: true,
      title: "Confirmation",
      message: `Voulez-vous vraiment ${actionText} ${user.email} ?`,
      isDestructive: !user.isBanned,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, visible: false }));
        try { 
          await toggleBan({ userId: user._id, reason: user.isBanned ? '' : 'Violation des regles' }).unwrap(); 
        } 
        catch (e) { 
          Alert.alert('Échec de l\'opération', e?.data?.message || 'Le serveur a rejeté la requête.'); 
        }
      }
    });
  };

  const handleRoleToggle = (user) => {
    const isCurrentlyAdmin = user.role === 'admin';
    const action = isCurrentlyAdmin ? 'REVOKE' : 'PROMOTE';
    const actionText = isCurrentlyAdmin ? 'retirer les droits administrateur de' : 'promouvoir administrateur';
    setConfirmConfig({
      visible: true,
      title: "Droits d'Accès",
      message: `Voulez-vous ${actionText} ${user.email} ?`,
      isDestructive: false,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, visible: false }));
        try { 
          await updateRole({ userId: user._id, action }).unwrap(); 
        } 
        catch (e) { 
          Alert.alert('Échec de l\'opération', e?.data?.message || 'Le serveur a rejeté la requête.'); 
        }
      }
    });
  };

  const renderUserItem = ({ item }) => (
    <GlassCard style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.textContainer}>
          <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.userEmail} numberOfLines={1} ellipsizeMode="tail">{item.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{translateRole(item.role)}</Text>
          </View>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.actionButton, styles.infoButton]} onPress={() => setSelectedInfoUser(item)}>
            <Ionicons name="information" size={20} color={THEME.COLORS.pureWhite} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, item.isBanned ? styles.unbanButton : styles.banButton]} onPress={() => handleBanToggle(item)}>
            <Ionicons name={item.isBanned ? "shield-checkmark-outline" : "ban-outline"} size={20} color={THEME.COLORS.pureWhite} />
          </TouchableOpacity>
          {(item.role === 'driver' || item.role === 'rider' || item.role === 'admin') && (
            <TouchableOpacity style={[styles.actionButton, styles.roleButton]} onPress={() => handleRoleToggle(item)}>
              <Ionicons name={item.role === 'admin' ? "arrow-down-outline" : "star-outline"} size={20} color={THEME.COLORS.pureWhite} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Utilisateurs</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={THEME.COLORS.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom ou email..."
          placeholderTextColor={THEME.COLORS.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={24} color={THEME.COLORS.pureWhite} style={styles.errorIcon} />
          <View style={styles.errorTextContainer}>
            <Text style={styles.errorTitle}>Erreur Serveur ({error?.status || 'X'})</Text>
            <Text style={styles.errorDetail}>Impossible de charger la liste.</Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator size="large" color={THEME.COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun utilisateur trouvé.</Text>}
        />
      )}

      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />

      <ConfirmModal 
        visible={confirmConfig.visible}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isDestructive={confirmConfig.isDestructive}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, visible: false }))}
      />

      <UserInfoModal
        visible={!!selectedInfoUser}
        user={selectedInfoUser}
        onClose={() => setSelectedInfoUser(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.COLORS.primary },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.COLORS.overlay, marginHorizontal: 20, borderRadius: THEME.BORDERS.radius.md, paddingHorizontal: 15, borderWidth: THEME.BORDERS.width.thin, borderColor: THEME.COLORS.border, marginBottom: 20 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: THEME.COLORS.textPrimary, paddingVertical: 12, fontSize: 16 },
  errorBanner: { flexDirection: 'row', backgroundColor: THEME.COLORS.danger, padding: 15, marginHorizontal: 20, borderRadius: THEME.BORDERS.radius.md, marginBottom: 20, alignItems: 'center' },
  errorIcon: { marginRight: 15 },
  errorTextContainer: { flex: 1 },
  errorTitle: { color: THEME.COLORS.pureWhite, fontWeight: 'bold', fontSize: 16 },
  errorDetail: { color: THEME.COLORS.pureWhite, fontSize: 13, marginTop: 4 },
  listContent: { paddingHorizontal: 20, paddingBottom: 80 },
  glassContainer: { overflow: 'hidden', borderRadius: THEME.BORDERS.radius.lg, borderWidth: THEME.BORDERS.width.thin, borderColor: THEME.COLORS.border, backgroundColor: THEME.COLORS.overlay, marginBottom: 12 },
  glassContent: { padding: 15 },
  userInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textContainer: { flex: 1, paddingRight: 10 },
  userName: { color: THEME.COLORS.textPrimary, fontSize: 16, fontWeight: 'bold' },
  userEmail: { color: THEME.COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: THEME.COLORS.overlay, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 8 },
  roleText: { color: THEME.COLORS.primary, fontSize: 10, fontWeight: 'bold' },
  actionsContainer: { flexDirection: 'row', alignItems: 'center' },
  actionButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  infoButton: { backgroundColor: THEME.COLORS.textSecondary },
  banButton: { backgroundColor: THEME.COLORS.danger },
  unbanButton: { backgroundColor: THEME.COLORS.success },
  roleButton: { backgroundColor: THEME.COLORS.info },
  emptyText: { color: THEME.COLORS.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 }
});

export default UsersManagement;