import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useEmergencyCancelRideMutation } from '../../store/api/ridesApiSlice';
import { setCurrentRide } from '../../store/slices/rideSlice';
import { showErrorToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const EmergencyResetButton = ({ style }) => {
  const dispatch = useDispatch();
  const [emergencyCancelApi] = useEmergencyCancelRideMutation();
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await emergencyCancelApi().unwrap();
      
      setShowConfirm(false);

      setTimeout(() => {
        dispatch(setCurrentRide(null));
        dispatch(showErrorToast({ title: 'Succes', message: 'Votre session a ete reinitialisee.' }));
      }, 300);

    } catch (error) {
      dispatch(showErrorToast({ title: 'Erreur', message: 'Echec du nettoyage de la base de donnees.' }));
      setShowConfirm(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={[styles.emergencyBtn, style]} 
        onPress={() => setShowConfirm(true)}
      >
        <Ionicons name="trash-outline" size={16} color={THEME.COLORS.danger} style={styles.btnIcon} />
        <Text style={styles.emergencyBtnText}>Supprimer mes courses</Text>
      </TouchableOpacity>

      <Modal
        visible={showConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isProcessing && setShowConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.glassCard}>
            
            <View style={styles.iconCircle}>
              <Ionicons name="warning" size={32} color={THEME.COLORS.danger} />
            </View>
            
            <Text style={styles.modalTitle}>Nettoyage d'urgence</Text>
            <Text style={styles.modalText}>
              Cette action va forcer l'annulation de toutes vos courses en attente et liberer les chauffeurs. A utiliser uniquement si l'application est bloquee.
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setShowConfirm(false)}
                disabled={isProcessing}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.confirmBtn} 
                onPress={handleConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Oui, nettoyer</Text>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  btnIcon: {
    marginRight: 6,
  },
  emergencyBtnText: {
    color: THEME.COLORS.danger,
    fontWeight: '600',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.COLORS.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.SPACING.xl,
  },
  glassCard: {
    width: '100%',
    backgroundColor: THEME.COLORS.glassDark,
    borderRadius: THEME.BORDERS.radius.xl,
    padding: THEME.SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.glassBorder,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.SPACING.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.COLORS.textPrimary,
    marginBottom: THEME.SPACING.sm,
  },
  modalText: {
    fontSize: 14,
    color: THEME.COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.SPACING.xl,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: THEME.SPACING.md,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: THEME.COLORS.glassSurface,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  cancelBtnText: {
    color: THEME.COLORS.textPrimary,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: THEME.COLORS.danger,
  },
  confirmBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default EmergencyResetButton;