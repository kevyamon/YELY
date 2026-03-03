// src/screens/admin/UsersManagement.jsx
// ECRAN UTILISATEURS - Gestion des roles et bannissements
// UI: Liquid Glassmorphism
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useGetAllUsersQuery, useToggleUserBanMutation, useUpdateUserRoleMutation } from '../../store/api/adminApiSlice';
import THEME from '../../theme/theme';

const GlassCard = ({ children, style }) => (
  <View style={[styles.glassContainer, style]}>
    <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
    <View style={styles.glassContent}>
      {children}
    </View>
  </View>
);

const UsersManagement = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: usersResponse, isLoading, refetch } = useGetAllUsersQuery({ page: 1, search: searchQuery });
  const [toggleBan] = useToggleUserBanMutation();
  const [updateRole] = useUpdateUserRoleMutation();

  const users = usersResponse?.data?.users || [];

  const handleBanToggle = (user) => {
    const actionText = user.isBanned ? 'lever le bannissement de' : 'bannir';
    Alert.alert(
      "Confirmation",
      `Voulez-vous vraiment ${actionText} ${user.email} ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Confirmer", 
          style: user.isBanned ? "default" : "destructive",
          onPress: async () => {
            try {
              await toggleBan({ userId: user._id, reason: user.isBanned ? '' : 'Violation des regles' }).unwrap();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de modifier le statut.');
            }
          } 
        }
      ]
    );
  };

  const handleRoleToggle = (user) => {
    const isCurrentlyAdmin = user.role === 'admin';
    const action = isCurrentlyAdmin ? 'REVOKE' : 'PROMOTE';
    const actionText = isCurrentlyAdmin ? 'retirer les droits administrateur de' : 'promouvoir administrateur';
    
    Alert.alert(
      "Modification des droits",
      `Voulez-vous ${actionText} ${user.email} ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Confirmer", 
          onPress: async () => {
            try {
              await updateRole({ userId: user._id, action }).unwrap();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de modifier le role.');
            }
          } 
        }
      ]
    );
  };

  const renderUserItem = ({ item }) => (
    <GlassCard style={styles.userCard}>
      <View style={styles.userInfo}>
        <View>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, item.isBanned ? styles.unbanButton : styles.banButton]} 
            onPress={() => handleBanToggle(item)}
          >
            <Ionicons name={item.isBanned ? "shield-checkmark-outline" : "ban-outline"} size={20} color="#FFF" />
          </TouchableOpacity>
          
          {(item.role === 'driver' || item.role === 'rider' || item.role === 'admin') && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.roleButton]} 
              onPress={() => handleRoleToggle(item)}
            >
              <Ionicons name={item.role === 'admin' ? "arrow-down-outline" : "star-outline"} size={20} color="#FFF" />
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
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.champagneGold} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Utilisateurs</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.5)" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom ou email..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={THEME.COLORS.champagneGold} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun utilisateur trouve.</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.COLORS.champagneGold },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 20 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#FFF', paddingVertical: 12, fontSize: 16 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  glassContainer: { overflow: 'hidden', borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.03)', marginBottom: 12 },
  glassContent: { padding: 15 },
  userInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userName: { color: THEME.COLORS.textPrimary, fontSize: 16, fontWeight: 'bold' },
  userEmail: { color: THEME.COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255, 215, 0, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 8 },
  roleText: { color: THEME.COLORS.champagneGold, fontSize: 10, fontWeight: 'bold' },
  actionsContainer: { flexDirection: 'row' },
  actionButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  banButton: { backgroundColor: '#FF3B30' },
  unbanButton: { backgroundColor: '#34C759' },
  roleButton: { backgroundColor: '#007AFF' },
  emptyText: { color: THEME.COLORS.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 }
});

export default UsersManagement;