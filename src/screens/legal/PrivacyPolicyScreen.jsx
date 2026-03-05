// src/screens/legal/PrivacyPolicyScreen.jsx
// ECRAN LEGAL - Politique de Confidentialite (Conformite Apple/Google)
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
        <Text style={styles.title}>Politique de Confidentialite</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Collecte des donnees de localisation</Text>
          <Text style={styles.text}>
            Yely collecte les donnees de localisation (y compris en arriere-plan) pour permettre le fonctionnement central du service :
            {"\n"}- Pour les Passagers : Identifier votre position de depart et vous connecter aux chauffeurs a proximite.
            {"\n"}- Pour les Chauffeurs : Vous attribuer des courses de maniere pertinente et permettre aux clients de suivre votre approche en temps reel, meme lorsque l'application est reduite ou en arriere-plan.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Utilisation de vos informations</Text>
          <Text style={styles.text}>
            Vos donnees de profil (nom, numero de telephone) sont utilisees exclusivement pour securiser votre compte et permettre la mise en relation lors d'une course. Le numero de telephone est partage avec la contrepartie (chauffeur/passager) uniquement une fois la course validee.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Conservation et Securite</Text>
          <Text style={styles.text}>
            Nous mettons en oeuvre des mesures de securite de niveau industriel pour proteger vos donnees. Les historiques de geolocalisation sont purges periodiquement. Vous pouvez demander la suppression totale de votre compte a tout moment depuis l'application.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.COLORS.deepAsphalt },
  header: { paddingHorizontal: THEME.SPACING.xl, paddingTop: THEME.SPACING.md, paddingBottom: THEME.SPACING.sm },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  backText: { color: THEME.COLORS.champagneGold, marginLeft: 8, fontSize: 16, fontWeight: '600' },
  scrollContent: { paddingHorizontal: THEME.SPACING.xl, paddingBottom: THEME.SPACING.xxl },
  title: { color: THEME.COLORS.champagneGold, fontSize: THEME.FONTS.sizes.h3, fontWeight: 'bold', marginBottom: THEME.SPACING.xl, textAlign: 'center' },
  section: { marginBottom: THEME.SPACING.lg },
  sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: THEME.SPACING.sm },
  text: { color: THEME.COLORS.textSecondary, fontSize: 14, lineHeight: 22 }
});

export default PrivacyPolicyScreen;