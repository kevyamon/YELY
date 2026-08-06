// src/screens/legal/PrivacyPolicyScreen.jsx
// ÉCRAN LÉGAL - Politique de Confidentialité (Conformité Apple/Google)
// STANDARD: Industriel / Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import THEME from '../../theme/theme';

const PrivacyPolicyScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.champagneGold} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Politique de Confidentialité</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Collecte des données de géolocalisation</Text>
          <Text style={styles.text}>
            Yély collecte vos données de localisation (y compris en arrière-plan) pour assurer le fonctionnement essentiel du service :
            {"\n"}- Pour les Passagers : Identifier votre point de départ et vous mettre en relation avec les chauffeurs à proximité.
            {"\n"}- Pour les Chauffeurs : Vous attribuer des demandes de trajet de manière optimale et permettre aux passagers de suivre votre arrivée en temps réel, y compris lorsque l'application est réduite ou en arrière-plan.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Utilisation de vos informations personnelles</Text>
          <Text style={styles.text}>
            Vos données de profil (nom, numéro de téléphone) sont utilisées exclusivement pour sécuriser votre compte et faciliter la mise en relation. Votre numéro de téléphone est transmis à la contrepartie (chauffeur ou passager) uniquement après la validation explicite d'une course.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Conservation et Sécurité des Données</Text>
          <Text style={styles.text}>
            Nous mettons en œuvre des mesures de sécurité de niveau bancaire pour protéger vos informations. Les historiques de géolocalisation sont purgés périodiquement. Vous pouvez demander la suppression intégrale de votre compte et de vos données personnelles à tout moment directement depuis l'application.
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

export default PrivacyPolicyScreen;