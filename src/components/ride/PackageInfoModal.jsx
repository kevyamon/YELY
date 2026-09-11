// src/components/ride/PackageInfoModal.jsx
// MODALE EXPLICATIVE DES FORFAITS - Affichage des details des offres Partage et Prive
// CSCSM Level: Bank Grade (Strictement modulaire < 325 lignes, Zero Emojis)

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import THEME from '../../theme/theme';

const PACKAGE_DETAILS = {
  echo: {
    title: 'Forfait Partagé',
    subtitle: 'Course économique et conviviale',
    badge: 'PARTAGÉ',
    icon: 'people-outline',
    accentColor: THEME.COLORS.success || '#27AE60',
    accentBg: 'rgba(39, 174, 96, 0.12)',
    accentBorder: 'rgba(39, 174, 96, 0.35)',
    features: [
      {
        icon: 'trending-down-outline',
        title: 'Tarif le plus avantageux',
        description: 'Économisez sur vos trajets quotidiens grâce à la mutualisation.',
      },
      {
        icon: 'git-merge-outline',
        title: 'Covoiturage intelligent',
        description: "Partagez le véhicule avec d'autres passagers empruntant le même axe.",
      },
      {
        icon: 'person-add-outline',
        title: 'Flexibilité passagers',
        description: 'Possibilité de réserver 1 à 3 places selon vos besoins.',
      },
    ],
  },
  vip: {
    title: 'Forfait Privé',
    subtitle: 'Exclusivité et confort supérieur',
    badge: 'PRIVÉ',
    icon: 'star-outline',
    accentColor: THEME.COLORS.champagneGold || '#D4AF37',
    accentBg: 'rgba(212, 175, 55, 0.12)',
    accentBorder: 'rgba(212, 175, 55, 0.35)',
    features: [
      {
        icon: 'shield-checkmark-outline',
        title: 'Véhicule exclusivement réservé',
        description: "Vous et vos accompagnants occupez seuls l'intégralité du taxi.",
      },
      {
        icon: 'navigate-outline',
        title: 'Trajet direct sans détour',
        description: 'Aucun arrêt supplémentaire ni passager tiers en cours de route.',
      },
      {
        icon: 'sparkles-outline',
        title: 'Tranquillité et intimité',
        description: 'Confort optimal pour vos déplacements professionnels ou personnels.',
      },
    ],
  },
};

const PackageInfoModal = ({ visible, onClose, vehicle }) => {
  if (!vehicle) return null;

  const isEcho = vehicle.type?.toLowerCase() === 'echo';
  const info = isEcho ? PACKAGE_DETAILS.echo : PACKAGE_DETAILS.vip;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.modalCard, { borderColor: info.accentBorder }]} onPress={(e) => e.stopPropagation()}>
          {/* En-tete du modal */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: info.accentBg }]}>
                <Ionicons name={info.icon} size={22} color={info.accentColor} />
              </View>
              <View style={styles.headerTextWrap}>
                <View style={styles.titleBadgeRow}>
                  <Text style={styles.title}>{info.title}</Text>
                  <View style={[styles.badge, { backgroundColor: info.accentColor }]}>
                    <Text style={styles.badgeText}>{info.badge}</Text>
                  </View>
                </View>
                <Text style={styles.subtitle}>{info.subtitle}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={THEME.COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Separateur */}
          <View style={styles.divider} />

          {/* Liste des points cles */}
          <View style={styles.featuresList}>
            {info.features.map((item, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.featureIconWrap, { backgroundColor: info.accentBg }]}>
                  <Ionicons name={item.icon} size={16} color={info.accentColor} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureDescription}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Bouton d'action de fermeture */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: info.accentColor }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.actionBtnText}>J'ai compris</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: THEME.COLORS.surface || '#121418',
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#121418',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: THEME.COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.COLORS.border || 'rgba(255, 255, 255, 0.08)',
    marginVertical: 16,
  },
  featuresList: {
    gap: 14,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.COLORS.textPrimary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    color: THEME.COLORS.textSecondary,
    lineHeight: 17,
  },
  actionBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#121418',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

export default PackageInfoModal;
