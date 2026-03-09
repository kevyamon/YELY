// src/screens/admin/FinanceConfig.jsx
// ECRAN FINANCE - Gestion Globale & Mode VIP
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';
import {
  useGetDashboardStatsQuery,
  useGetFinanceDataQuery,
  useToggleGlobalFreeAccessMutation,
  useToggleLoadReduceMutation,
  useTogglePromoMutation
} from '../../store/api/adminApiSlice';
import { showErrorToast, showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const GlassCard = ({ children, style }) => (
  <View style={[styles.glassContainer, style]}>
    <BlurView intensity={60} tint="default" style={StyleSheet.absoluteFill} />
    <View style={styles.glassContent}>
      {children}
    </View>
  </View>
);

const FinanceConfig = ({ navigation }) => {
  const dispatch = useDispatch();
  
  const { data: financeResponse, isLoading } = useGetFinanceDataQuery({ period: 'all' });
  // 🔥 On recupere les stats generales pour avoir l'etat initial des switches
  const { data: statsData } = useGetDashboardStatsQuery(); 
  
  const [togglePromo, { isLoading: isTogglingPromo }] = useTogglePromoMutation();
  const [toggleLoadReduce, { isLoading: isTogglingLoad }] = useToggleLoadReduceMutation();
  const [toggleGlobalFreeAccess, { isLoading: isTogglingFreeAccess }] = useToggleGlobalFreeAccessMutation();

  const [isPromoActive, setIsPromoActive] = useState(false);
  const [isLoadReduced, setIsLoadReduced] = useState(false);
  const [isGlobalFreeAccess, setIsGlobalFreeAccess] = useState(false);
  
  // 🔥 Etat pour le message personnalisé
  const [promoMessage, setPromoMessage] = useState("🎉 Yély Régal ! Pour fêter notre lancement, Yély vous offre l'accès VIP.");

  const financeData = financeResponse?.data || financeResponse || [];
  const safeFinanceArray = Array.isArray(financeData) ? financeData : [];
  const totalRevenue = safeFinanceArray.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  // Initialisation des switches avec les donnees du serveur
  useEffect(() => {
    if (statsData?.data?.settings) {
      setIsPromoActive(statsData.data.settings.isPromoActive || false);
      setIsLoadReduced(statsData.data.settings.isLoadReduced || false);
      setIsGlobalFreeAccess(statsData.data.settings.isGlobalFreeAccess || false);
      if (statsData.data.settings.promoMessage) {
        setPromoMessage(statsData.data.settings.promoMessage);
      }
    }
  }, [statsData]);

  const handleTogglePromo = async (value) => {
    setIsPromoActive(value);
    try { 
      await togglePromo({ isActive: value }).unwrap(); 
      dispatch(showSuccessToast({
        title: 'Succès',
        message: `Mode Promotionnel (Tarifs) ${value ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`,
      }));
    } catch (e) { 
      setIsPromoActive(!value); 
      dispatch(showErrorToast({
        title: 'Échec',
        message: "Impossible de changer le mode promotionnel.",
      }));
    }
  };

  const handleToggleLoadReduce = async (value) => {
    setIsLoadReduced(value);
    try {
      await toggleLoadReduce().unwrap();
    } catch (e) {
      setIsLoadReduced(!value);
      dispatch(showErrorToast({
        title: 'Échec',
        message: "Impossible de modifier la répartition des validations.",
      }));
    }
  };

  const handleToggleGlobalFreeAccess = async (value) => {
    setIsGlobalFreeAccess(value);
    try {
      // 🔥 On envoie l'etat ET le message au backend
      await toggleGlobalFreeAccess({ 
        isActive: value,
        promoMessage: value ? promoMessage : undefined // On ne met à jour le message que si on l'active
      }).unwrap();
      
      dispatch(showSuccessToast({
        title: 'Gratuité Chauffeurs',
        message: `Accès gratuit ${value ? 'ACTIVÉ' : 'DÉSACTIVÉ'} pour tous.`,
      }));
    } catch (e) {
      setIsGlobalFreeAccess(!value);
      dispatch(showErrorToast({
        title: 'Échec',
        message: "Impossible de modifier le statut de gratuité.",
      }));
    }
  };

  const handleUpdateMessage = async () => {
    if (!isGlobalFreeAccess) return;
    try {
      await toggleGlobalFreeAccess({ isActive: true, promoMessage }).unwrap();
      dispatch(showSuccessToast({ title: 'Message à jour', message: 'Le texte a été diffusé aux chauffeurs.' }));
    } catch (e) {
      dispatch(showErrorToast({ title: 'Erreur', message: 'Impossible de mettre à jour le message.' }));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finance & Config</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <GlassCard style={styles.revenueCard}>
          <Ionicons name="wallet-outline" size={32} color={THEME.COLORS.primary} style={styles.iconMargin} />
          <Text style={styles.revenueLabel}>Chiffre d'Affaires Global</Text>
          {isLoading ? (
            <ActivityIndicator color={THEME.COLORS.primary} style={{ marginTop: 10 }} />
          ) : (
            <Text style={styles.revenueAmount}>{totalRevenue.toLocaleString('fr-FR')} FCFA</Text>
          )}
        </GlassCard>

        {/* SECTION : ADMINISTRATION EXCEPTIONNELLE */}
        <Text style={styles.sectionTitle}>Opérations Spéciales (VIP)</Text>
        <GlassCard style={styles.actionCard}>
          <View style={styles.rowBetween}>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>Accès Gratuit Global</Text>
              <Text style={styles.cardDescription}>Permet à tous les chauffeurs de rouler sans abonnement payant.</Text>
            </View>
            <Switch
              trackColor={{ false: THEME.COLORS.overlay, true: THEME.COLORS.primary }}
              thumbColor={THEME.COLORS.background}
              onValueChange={handleToggleGlobalFreeAccess}
              value={isGlobalFreeAccess}
              disabled={isTogglingFreeAccess}
            />
          </View>

          {/* 🔥 Zone de personnalisation du message (Visible uniquement si actif) */}
          {isGlobalFreeAccess && (
            <View style={styles.messageEditorContainer}>
              <Text style={styles.messageEditorLabel}>Message affiché aux chauffeurs :</Text>
              <TextInput
                style={styles.messageInput}
                value={promoMessage}
                onChangeText={setPromoMessage}
                multiline
                maxLength={150}
                placeholder="Ex: Profitez de l'app gratuite !"
                placeholderTextColor={THEME.COLORS.textSecondary}
              />
              <TouchableOpacity style={styles.updateMsgBtn} onPress={handleUpdateMessage}>
                <Text style={styles.updateMsgBtnText}>Mettre à jour le texte</Text>
              </TouchableOpacity>
            </View>
          )}
        </GlassCard>

        {/* SECTION : OPTIMISATION ET CHARGE DE TRAVAIL */}
        <Text style={styles.sectionTitle}>Optimisation de la Charge</Text>
        <GlassCard style={styles.actionCard}>
          <View style={styles.rowBetween}>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>Répartition 3 par 3</Text>
              <Text style={styles.cardDescription}>Distribue les nouvelles demandes d'abonnement aux autres administrateurs.</Text>
            </View>
            <Switch
              trackColor={{ false: THEME.COLORS.overlay, true: THEME.COLORS.primary }}
              thumbColor={THEME.COLORS.background}
              onValueChange={handleToggleLoadReduce}
              value={isLoadReduced}
              disabled={isTogglingLoad}
            />
          </View>
        </GlassCard>

        {/* SECTION : MARKETING */}
        <Text style={styles.sectionTitle}>Marketing & Promotions</Text>
        <GlassCard style={styles.actionCard}>
          <View style={styles.rowBetween}>
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>Mode Promotionnel (Tarifs)</Text>
              <Text style={styles.cardDescription}>Active les tarifs réduits (Plans Hebdo/Mensuel) pour les chauffeurs.</Text>
            </View>
            <Switch
              trackColor={{ false: THEME.COLORS.overlay, true: THEME.COLORS.primary }}
              thumbColor={THEME.COLORS.background}
              onValueChange={handleTogglePromo}
              value={isPromoActive}
              disabled={isTogglingPromo}
            />
          </View>
        </GlassCard>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.COLORS.primary },
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: THEME.COLORS.textPrimary, marginBottom: 15, marginTop: 20 },
  glassContainer: { overflow: 'hidden', borderRadius: THEME.BORDERS?.radius?.xl || 20, borderWidth: THEME.BORDERS?.width?.thin || 1, borderColor: THEME.COLORS.border, backgroundColor: THEME.COLORS.overlay, marginBottom: 15 },
  glassContent: { padding: 20 },
  revenueCard: { alignItems: 'center', paddingVertical: 30 },
  iconMargin: { marginBottom: 10 },
  revenueLabel: { color: THEME.COLORS.textSecondary, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  revenueAmount: { color: THEME.COLORS.primary, fontSize: 36, fontWeight: 'bold', marginTop: 10 },
  actionCard: { padding: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textContainer: { flex: 1, paddingRight: 15 },
  cardTitle: { color: THEME.COLORS.textPrimary, fontSize: 16, fontWeight: 'bold' },
  cardDescription: { color: THEME.COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  
  // 🔥 Styles pour l'éditeur de message VIP
  messageEditorContainer: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: THEME.COLORS.border },
  messageEditorLabel: { color: THEME.COLORS.primary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  messageInput: { backgroundColor: 'rgba(0,0,0,0.3)', color: THEME.COLORS.textPrimary, borderRadius: 8, padding: 12, minHeight: 60, textAlignVertical: 'top', borderWidth: 1, borderColor: THEME.COLORS.border },
  updateMsgBtn: { alignSelf: 'flex-end', marginTop: 10, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: 'rgba(212, 175, 55, 0.1)', borderRadius: 20, borderWidth: 1, borderColor: THEME.COLORS.primary },
  updateMsgBtnText: { color: THEME.COLORS.primary, fontSize: 12, fontWeight: 'bold' }
});

export default FinanceConfig;