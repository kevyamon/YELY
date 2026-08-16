// src/components/admin/RideDetailsModal.jsx
// COMPOSANT MODULAIRE - Modale des Détails Complets d'une Course (Espace Admin)
// CSCSM Level: Bank Grade / Modular Architecture

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import THEME from '../../theme/theme';

const RideDetailsModal = ({ visible, ride, onClose }) => {
  if (!ride) return null;

  const date = new Date(ride.createdAt || Date.now()).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return THEME.COLORS.success;
      case 'CANCELLED':
        return THEME.COLORS.danger;
      case 'IN_PROGRESS':
        return THEME.COLORS.warning || '#F39C12';
      default:
        return THEME.COLORS.primary;
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'Terminée avec succès';
      case 'CANCELLED':
        return 'Course annulée';
      case 'IN_PROGRESS':
        return 'Trajet en cours';
      case 'ARRIVED':
        return 'Chauffeur sur place';
      case 'ACCEPTED':
        return 'Chauffeur en approche';
      default:
        return status ? status.toUpperCase() : 'En attente';
    }
  };

  const statusColor = getStatusColor(ride.status);
  const isDelivery = ride.type === 'DELIVERY';
  const price = ride.deliveryPrice || ride.price || ride.proposedPrice || 0;
  const shortId = (ride._id || ride.id || '').toString().slice(-6).toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.idBadge}>
                <Text style={styles.idBadgeText}>#{shortId}</Text>
              </View>
              <View style={styles.typeBadge}>
                <Ionicons
                  name={isDelivery ? 'cube' : 'car-sport'}
                  size={12}
                  color={THEME.COLORS.champagneGold}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.typeBadgeText}>
                  {isDelivery ? 'LIVRAISON' : 'COURSE VTC'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={THEME.COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* STATUS & DATE */}
          <View style={styles.statusSection}>
            <View style={[styles.statusPill, { backgroundColor: statusColor + '18', borderColor: statusColor + '40' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusPillText, { color: statusColor }]}>
                {getStatusLabel(ride.status)}
              </Text>
            </View>
            <Text style={styles.dateText}>{date}</Text>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            
            {/* ITINÉRAIRE */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Itinéraire de la course</Text>
              
              <View style={styles.routeRow}>
                <Ionicons name="radio-button-on" size={16} color={THEME.COLORS.success} style={styles.routeIcon} />
                <View style={styles.routeTextWrap}>
                  <Text style={styles.routeLabel}>Point de départ (Origine)</Text>
                  <Text style={styles.routeValue}>{ride.origin?.address || 'Non spécifié'}</Text>
                </View>
              </View>

              <View style={styles.routeDivider} />

              <View style={styles.routeRow}>
                <Ionicons name="location" size={16} color={THEME.COLORS.danger} style={styles.routeIcon} />
                <View style={styles.routeTextWrap}>
                  <Text style={styles.routeLabel}>Destination finale</Text>
                  <Text style={styles.routeValue}>{ride.destination?.address || 'Non spécifiée'}</Text>
                </View>
              </View>

              {ride.distance ? (
                <View style={styles.distanceBadge}>
                  <Ionicons name="speedometer-outline" size={14} color={THEME.COLORS.champagneGold} style={{ marginRight: 6 }} />
                  <Text style={styles.distanceText}>Distance estimée : {ride.distance} km</Text>
                </View>
              ) : null}
            </View>

            {/* PERSONNES CONCERNÉES */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Intervenants</Text>

              {/* CHAUFFEUR */}
              <View style={styles.personRow}>
                <View style={styles.personAvatarCircle}>
                  <Ionicons name="car-sport" size={18} color={THEME.COLORS.champagneGold} />
                </View>
                <View style={styles.personDetails}>
                  <Text style={styles.personRoleLabel}>Chauffeur / Livreur</Text>
                  <Text style={styles.personName}>{ride.driver?.name || 'Non attribué'}</Text>
                  <Text style={styles.personSub}>{ride.driver?.phone || 'Téléphone non renseigné'}</Text>
                  {ride.driver?.vehicle?.model ? (
                    <Text style={styles.vehicleInfo}>
                      Véhicule : {ride.driver?.vehicle?.model} ({ride.driver?.vehicle?.plate || 'Sans plaque'})
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.personDivider} />

              {/* PASSAGER / CLIENT */}
              <View style={styles.personRow}>
                <View style={styles.personAvatarCircle}>
                  <Ionicons name="person" size={18} color={THEME.COLORS.champagneGold} />
                </View>
                <View style={styles.personDetails}>
                  <Text style={styles.personRoleLabel}>{isDelivery ? 'Client Destinataire' : 'Passager'}</Text>
                  <Text style={styles.personName}>{ride.rider?.name || 'Client Yely'}</Text>
                  <Text style={styles.personSub}>{ride.rider?.phone || 'Téléphone non renseigné'}</Text>
                </View>
              </View>
            </View>

            {/* DÉTAILS FINANCIERS */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Détails de facturation</Text>
              
              <View style={styles.infoLine}>
                <Text style={styles.infoLabel}>Forfait sélectionné</Text>
                <Text style={styles.infoValue}>{ride.forfait || 'STANDARD'}</Text>
              </View>

              <View style={styles.infoLine}>
                <Text style={styles.infoLabel}>Nombre de places</Text>
                <Text style={styles.infoValue}>{ride.passengersCount || 1} passager(s)</Text>
              </View>

              <View style={styles.infoLine}>
                <Text style={styles.infoLabel}>Mode de règlement</Text>
                <Text style={styles.infoValue}>Espèces (Cash)</Text>
              </View>

              <View style={[styles.infoLine, styles.totalLine]}>
                <Text style={styles.totalLabel}>Montant Total</Text>
                <Text style={styles.totalValue}>{price} FCFA</Text>
              </View>
            </View>

          </ScrollView>

          {/* CLOSE BUTTON */}
          <TouchableOpacity style={styles.closeActionBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeActionText}>Fermer</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: THEME.COLORS.background,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: THEME.COLORS.border,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  idBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  idBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.COLORS.champagneGold,
    letterSpacing: 0.5,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.glassSurface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.COLORS.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.COLORS.glassSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.border,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 11,
    color: THEME.COLORS.textSecondary,
    fontWeight: '500',
  },
  scrollArea: {
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.COLORS.champagneGold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  routeTextWrap: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    color: THEME.COLORS.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  routeValue: {
    fontSize: 13,
    color: THEME.COLORS.textPrimary,
    fontWeight: '600',
    lineHeight: 18,
  },
  routeDivider: {
    width: 2,
    height: 12,
    backgroundColor: THEME.COLORS.border,
    marginLeft: 7,
    marginVertical: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  distanceText: {
    fontSize: 12,
    color: THEME.COLORS.textPrimary,
    fontWeight: '700',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  personAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  personDetails: {
    flex: 1,
  },
  personRoleLabel: {
    fontSize: 10,
    color: THEME.COLORS.textTertiary,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 1,
  },
  personName: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.COLORS.textPrimary,
    marginBottom: 1,
  },
  personSub: {
    fontSize: 12,
    color: THEME.COLORS.textSecondary,
  },
  vehicleInfo: {
    fontSize: 11,
    color: THEME.COLORS.champagneGold,
    fontWeight: '600',
    marginTop: 2,
  },
  personDivider: {
    height: 1,
    backgroundColor: THEME.COLORS.border,
    marginVertical: 10,
  },
  infoLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: THEME.COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.COLORS.textPrimary,
  },
  totalLine: {
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.border,
    paddingTop: 10,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.COLORS.textPrimary,
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '950',
    color: THEME.COLORS.champagneGold,
  },
  closeActionBtn: {
    backgroundColor: THEME.COLORS.glassSurface,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  closeActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.COLORS.textPrimary,
  },
});

export default RideDetailsModal;
