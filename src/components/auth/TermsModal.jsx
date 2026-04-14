//src/components/auth/TermsModal.jsx
// MODALE CONDITIONS D'UTILISATION - Lecture obligatoire
// STANDARD: Industriel / Bank Grade

import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import THEME from '../../theme/theme';
import GlassModal from '../ui/GlassModal';
import GoldButton from '../ui/GoldButton';

const TermsModal = ({ visible, onClose, onAccept, isLoading }) => {
  return (
    <GlassModal
      visible={visible}
      onClose={onClose}
      title="Conditions d'utilisation"
      icon="document-text-outline"
    >
      <View style={styles.scrollContainer}>
        <ScrollView 
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.sectionTitle}>1. Acceptation des conditions</Text>
          <Text style={styles.paragraph}>
            En creant un compte sur Yely, vous acceptez de vous conformer aux presentes conditions d'utilisation et a notre politique de confidentialite. Si vous n'acceptez pas ces termes, veuillez ne pas utiliser l'application.
          </Text>

          <Text style={styles.sectionTitle}>2. Utilisation du service</Text>
          <Text style={styles.paragraph}>
            Yely met en relation des passagers avec des chauffeurs independants. Nous nous engageons a fournir une plateforme securisee et fiable. Vous acceptez d'utiliser le service uniquement a des fins legales et de maniere respectueuse envers les autres utilisateurs.
          </Text>

          <Text style={styles.sectionTitle}>3. Responsabilites</Text>
          <Text style={styles.paragraph}>
            En tant qu'utilisateur, vous etes responsable des informations fournies lors de l'inscription. Les chauffeurs sont responsables du respect du code de la route et de la validite de leurs documents professionnels.
          </Text>

          <Text style={styles.sectionTitle}>4. Politique de confidentialite</Text>
          <Text style={styles.paragraph}>
            Vos donnees personnelles sont traitees de maniere securisee et ne sont utilisees que dans le cadre du fonctionnement de l'application (mise en relation, facturation, support).
          </Text>
          
          <Text style={styles.sectionTitle}>5. Modifications</Text>
          <Text style={styles.paragraph}>
            Yely se reserve le droit de modifier ces conditions a tout moment. Les utilisateurs seront informes des changements majeurs.
          </Text>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <GoldButton
          title="J'ACCEPTE ET JE M'INSCRIS"
          onPress={onAccept}
          loading={isLoading}
          icon="checkmark-circle-outline"
          style={styles.acceptButton}
        />
        <Text style={styles.cancelText} onPress={onClose}>
          Refuser et annuler
        </Text>
      </View>
    </GlassModal>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    maxHeight: 350,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    marginBottom: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  scrollContent: {
    padding: THEME.SPACING.md,
  },
  sectionTitle: {
    color: THEME.COLORS.champagneGold,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: THEME.SPACING.xs,
    marginTop: THEME.SPACING.sm,
  },
  paragraph: {
    color: THEME.COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: THEME.SPACING.sm,
  },
  footer: {
    alignItems: 'center',
    marginTop: THEME.SPACING.sm,
  },
  acceptButton: {
    width: '100%',
    marginBottom: THEME.SPACING.md,
  },
  cancelText: {
    color: THEME.COLORS.textTertiary,
    fontSize: 14,
    textDecorationLine: 'underline',
    padding: THEME.SPACING.xs,
  }
});

export default TermsModal;