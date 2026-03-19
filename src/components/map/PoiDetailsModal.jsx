// src/components/map/PoiDetailsModal.jsx
import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import THEME from '../../theme/theme';
import UniversalIcon from '../ui/UniversalIcon'; // AJOUT

const PoiDetailsModal = ({ visible, poi, onClose, onSelect, readOnly = false }) => {
  if (!visible || !poi) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        
        <TouchableOpacity style={styles.card} activeOpacity={1}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: poi.iconColor ? `${poi.iconColor}20` : 'rgba(212, 175, 55, 0.2)' }]}>
              {/* CORRECTION MAJEURE : Utilisation de l'UniversalIcon */}
              <UniversalIcon 
                iconString={poi.icon || "Ionicons/location"} 
                size={28} 
                color={poi.iconColor || THEME.COLORS.champagneGold} 
              />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle" size={28} color={THEME.COLORS.textTertiary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{poi.name}</Text>
          <Text style={styles.subtitle}>Maféré, Côte d'Ivoire</Text>

          {readOnly ? (
            <View style={styles.readOnlyBadge}>
              <Ionicons name="information-circle-outline" size={16} color={THEME.COLORS.textSecondary} />
              <Text style={styles.readOnlyText}>Point d'intérêt de la zone</Text>
            </View>
          ) : (
            onSelect && (
              <TouchableOpacity style={styles.button} onPress={() => onSelect(poi)}>
                <Text style={styles.buttonText}>Choisir comme destination</Text>
                <Ionicons name="arrow-forward" size={18} color={THEME.COLORS.background} style={styles.buttonIcon} />
              </TouchableOpacity>
            )
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: THEME.COLORS.overlayDark, justifyContent: 'flex-end', padding: THEME.SPACING.md, zIndex: 1000 },
  card: { backgroundColor: THEME.COLORS.glassSurface, borderRadius: THEME.BORDERS.radius.xl, padding: THEME.SPACING.xl, borderWidth: 1, borderColor: THEME.COLORS.glassBorder, marginBottom: THEME.SPACING.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: THEME.SPACING.md },
  iconContainer: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  closeButton: { padding: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: THEME.COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: THEME.COLORS.textSecondary, marginBottom: THEME.SPACING.xl },
  button: { backgroundColor: THEME.COLORS.champagneGold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: THEME.BORDERS.radius.full },
  buttonText: { color: THEME.COLORS.background, fontSize: 16, fontWeight: 'bold' },
  buttonIcon: { marginLeft: 8 },
  readOnlyBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 10, borderRadius: THEME.BORDERS.radius.md },
  readOnlyText: { color: THEME.COLORS.textSecondary, fontSize: 14, marginLeft: 6, fontStyle: 'italic' }
});

export default PoiDetailsModal;