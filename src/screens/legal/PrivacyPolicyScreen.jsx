// src/screens/legal/PrivacyPolicyScreen.jsx
// ÉCRAN LÉGAL - Politique de Confidentialité (Conformité Apple/Google)
// STANDARD: Industriel / Bank Grade

import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import THEME from '../../theme/theme';

const NOTION_PRIVACY_URL = 'https://rumbling-kingfisher-ef0.notion.site/POLITIQUE-DE-CONFIDENTIALIT-Y-LY-3b4ba61912968085bbc0ce84d37ae1f4?pvs=143';

const PrivacyPolicyScreen = ({ navigation }) => {
  const handleOpenWebPolicy = async () => {
    try {
      await WebBrowser.openBrowserAsync(NOTION_PRIVACY_URL);
    } catch (err) {
      console.warn('[PrivacyPolicy] Impossible d ouvrir l URL WebBrowser:', err);
    }
  };

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

        <TouchableOpacity style={styles.webPolicyButton} onPress={handleOpenWebPolicy} activeOpacity={0.85}>
          <Ionicons name="open-outline" size={18} color="#121418" style={{ marginRight: 8 }} />
          <Text style={styles.webPolicyButtonText}>Consulter la version officielle en ligne (Notion)</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Introduction et Champ d'Application</Text>
          <Text style={styles.text}>
            Cette Politique de Confidentialité s'applique à la plateforme Yély (Passagers, Chauffeurs, Livreurs et Vendeurs) dans la zone de Maféré, Aboisso, Sud-Comoé, Abidjan et leurs environs.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Collecte et Utilisation des Données GPS (IMPORTANT)</Text>
          <Text style={styles.text}>
            Yély collecte vos données de localisation GPS pour assurer le fonctionnement du service :
            {"\n"}- Pour les Chauffeurs & Livreurs : Collecte en premier plan et en arrière-plan (ACCESS_BACKGROUND_LOCATION) indispensable pour l'attribution des demandes, le calcul d'itinéraire et le suivi par le client — même lorsque l'application est réduite ou que l'écran est verrouillé.
            {"\n"}- Pour les Passagers & Clients : Collecte en premier plan pour déterminer le point de prise en charge/livraison et afficher les véhicules à proximité.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Autres Permissions & Médias</Text>
          <Text style={styles.text}>
            - Appareil photo et Galerie (CAMERA, READ_MEDIA_IMAGES) : Photo de profil, soumission des pièces obligatoires KYC (permis, CNI, assurance) et preuves de livraison.
            {"\n"}- Communications Vocales VoIP (RECORD_AUDIO) : Permet les appels vocaux directs sécurisés en temps réel entre client et chauffeur sans enregistrement ni exposition du numéro réel.
            {"\n"}- Google OAuth & Paiements : Connexion sécurisée Google et gestion chiffrée des règlements Cash, Mobile Money et Cartes Bancaires.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Sécurité et Non-Vente des Données</Text>
          <Text style={styles.text}>
            Vos données sont transmises via des protocoles chiffrés bancaires (HTTPS / TLS 1.3 / AES-256). Yély s'engage solennellement à ne jamais vendre ni louer vos données personnelles à des régies publicitaires.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Droit à l'Oubli et Suppression du Compte</Text>
          <Text style={styles.text}>
            Vous pouvez demander la suppression immédiate et définitive de votre compte et de vos données :
            {"\n"}- Via l'application : Dans Profil → Paramètres → Supprimer mon compte.
            {"\n"}- Via E-mail : En envoyant votre demande à yelyinfos@gmail.com. Traitement et purge sous 48h.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Contact Administration</Text>
          <Text style={styles.text}>
            Pour toute question ou demande : yelyinfos@gmail.com
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
  title: { color: THEME.COLORS.champagneGold, fontSize: THEME.FONTS.sizes.h3, fontWeight: 'bold', marginBottom: THEME.SPACING.md, textAlign: 'center' },
  webPolicyButton: {
    backgroundColor: THEME.COLORS.champagneGold,
    borderRadius: THEME.BORDERS.radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.SPACING.xl,
  },
  webPolicyButtonText: { color: '#121418', fontWeight: 'bold', fontSize: 13 },
  section: { marginBottom: THEME.SPACING.lg },
  sectionTitle: { color: THEME.COLORS.textPrimary, fontSize: 15, fontWeight: 'bold', marginBottom: THEME.SPACING.xs },
  text: { color: THEME.COLORS.textSecondary, fontSize: 13, lineHeight: 21 }
});

export default PrivacyPolicyScreen;