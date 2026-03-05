// src/screens/legal/TermsOfServiceScreen.jsx
// ECRAN LEGAL - Conditions Generales d'Utilisation
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
        <Text style={styles.title}>Conditions d'Utilisation</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Objet du Service</Text>
          <Text style={styles.text}>
            Yely fournit une plateforme technologique permettant la mise en relation entre des utilisateurs cherchant un moyen de transport et des chauffeurs independants. Yely ne fournit pas directement de services de transport.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Engagements des Utilisateurs</Text>
          <Text style={styles.text}>
            Vous vous engagez a fournir des informations exactes lors de votre inscription. Tout comportement abusif, frauduleux ou dangereux entrainera la suspension immediate de votre compte.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Engagements des Chauffeurs</Text>
          <Text style={styles.text}>
            Les chauffeurs certifient disposer de toutes les autorisations, assurances et documents legaux requis pour le transport de passagers. Le reglement de l'abonnement a la plateforme est obligatoire pour recevoir des requetes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Responsabilites</Text>
          <Text style={styles.text}>
            Yely n'est pas responsable des incidents survenant pendant une course. Toutefois, nous mettons a disposition un systeme de signalement et de blocage pour assurer la qualite du reseau.
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

export default TermsOfServiceScreen;