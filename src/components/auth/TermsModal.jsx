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
          style={styles.scrollView}
          nestedScrollEnabled={true}
        >
          <Text style={styles.sectionTitle}>1. Acceptation des conditions</Text>
          <Text style={styles.paragraph}>
            En créant un compte sur Yely, vous acceptez de vous conformer aux présentes conditions d'utilisation et à notre politique de confidentialité. Si vous n'acceptez pas ces termes, veuillez ne pas utiliser l'application.
          </Text>

          <Text style={styles.sectionTitle}>2. Utilisation du service</Text>
          <Text style={styles.paragraph}>
            Yely met en relation des passagers avec des chauffeurs indépendants. Nous nous engageons à fournir une plateforme sécurisée et fiable. Vous acceptez d'utiliser le service uniquement à des fins légales et de manière respectueuse envers les autres utilisateurs.
          </Text>

          <Text style={styles.sectionTitle}>3. Responsabilités</Text>
          <Text style={styles.paragraph}>
            En tant qu'utilisateur, vous êtes responsable des informations fournies lors de l'inscription. Les chauffeurs sont responsables du respect du code de la route et de la validité de leurs documents professionnels.
          </Text>

          <Text style={styles.sectionTitle}>4. Politique de confidentialité</Text>
          <Text style={styles.paragraph}>
            Vos données personnelles sont traitées de manière sécurisée et ne sont utilisées que dans le cadre du fonctionnement de l'application (mise en relation, facturation, support).
          </Text>
          
          <Text style={styles.sectionTitle}>5. Modifications</Text>
          <Text style={styles.paragraph}>
            Yely se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront informés des changements majeurs.
          </Text>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <GoldButton
          title="ACCEPTER ET M'INSCRIRE"
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
    maxHeight: 380, // Légèrement augmenté pour confort
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: THEME.BORDERS.radius.md,
    marginBottom: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    overflow: 'hidden', // Crucial pour le scroll interne
  },
  scrollView: {
    flexGrow: 0, // Ne pas forcer le remplissage si peu de contenu
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