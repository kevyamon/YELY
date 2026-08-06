// src/screens/legal/TermsOfServiceScreen.jsx
// ÉCRAN LÉGAL - Conditions Générales d'Utilisation
// STANDARD: Industriel / Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import THEME from '../../theme/theme';

const TermsOfServiceScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.champagneGold} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Conditions Générales d'Utilisation</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Objet du Service</Text>
          <Text style={styles.text}>
            Yély fournit une plateforme technologique facilitant la mise en relation entre des utilisateurs à la recherche d'un moyen de transport et des chauffeurs indépendants. Yély n'exécute pas directement les prestations de transport.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Engagements des Utilisateurs</Text>
          <Text style={styles.text}>
            Vous vous engagez à fournir des informations exactes et à jour lors de votre inscription. Tout comportement abusif, frauduleux, irrespectueux ou dangereux entraînera la suspension immédiate et définitive de votre compte.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Engagements des Chauffeurs</Text>
          <Text style={styles.text}>
            Les chauffeurs certifient détenir l'ensemble des autorisations administratives, des assurances professionnelles et des documents légaux requis pour le transport de personnes. Le règlement en règle de l'abonnement à la plateforme est obligatoire pour recevoir des requêtes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Responsabilités et Signalement</Text>
          <Text style={styles.text}>
            Yély décline toute responsabilité en cas d'incidents survenant au cours d'un trajet. Toutefois, nous mettons à votre disposition un système de signalement prioritaire et de modération pour garantir une qualité et une sécurité irréprochables sur notre réseau.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: { paddingHorizontal: THEME.SPACING.xl, paddingTop: THEME.SPACING.md, paddingBottom: THEME.SPACING.sm },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  backText: { color: THEME.COLORS.champagneGold, marginLeft: 8, fontSize: 16, fontWeight: '600' },
  scrollContent: { paddingHorizontal: THEME.SPACING.xl, paddingBottom: THEME.SPACING.xxl },
  title: { color: THEME.COLORS.champagneGold, fontSize: THEME.FONTS.sizes.h3, fontWeight: 'bold', marginBottom: THEME.SPACING.xl, textAlign: 'center' },
  section: { marginBottom: THEME.SPACING.lg },
  sectionTitle: { color: THEME.COLORS.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: THEME.SPACING.sm },
  text: { color: THEME.COLORS.textSecondary, fontSize: 14, lineHeight: 22 }
});

export default TermsOfServiceScreen;