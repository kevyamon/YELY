// src/components/ride/RiderBottomPanel.jsx
// COMPOSANT PASSAGER (WEB/MOBILE) - Tracé de courbe complet & RTK Query Ready
// CSCSM Level: Bank Grade

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import THEME from '../../theme/theme';
import PassengerCountModal from './PassengerCountModal';

const RiderBottomPanel = ({
  destination,
  isEstimating,
  estimationData,
  estimateError,
  onConfirmRide,
  isOrdering,
  onSelectVehicle,
  topContent = null 
}) => {
  const insets = useSafeAreaInsets();
  const [isPassengerModalVisible, setIsPassengerModalVisible] = useState(false);

  // Force le type standard en arriere-plan pour satisfaire l'API sans polluer l'UI
  useEffect(() => {
    if (onSelectVehicle) {
      onSelectVehicle({ type: 'standard', id: 'standard_1' });
    }
  }, [onSelectVehicle]);

  const handleInitialConfirm = () => {
    if (isOrdering) return;
    setIsPassengerModalVisible(true);
  };

  const handleFinalConfirm = (passengersCount) => {
    setIsPassengerModalVisible(false);
    onConfirmRide(passengersCount);
  };

  return (
    <View style={[
      styles.bottomPanel, 
      { paddingBottom: Math.max(insets.bottom + 20, THEME.SPACING.xl) }
    ]}>
      
      {topContent && (
        <View style={styles.topContentWrapper}>
          {topContent}
        </View>
      )}
      
      {destination ? (
         <View style={styles.estimationWrapper}>
           <TouchableOpacity 
             style={[styles.confirmButton, isOrdering && styles.confirmButtonDisabled]}
             disabled={isEstimating || isOrdering}
             onPress={handleInitialConfirm}
             activeOpacity={0.9}
           >
             <Text style={[styles.confirmButtonText, isOrdering && styles.confirmButtonTextDisabled]}>
               {isOrdering 
                 ? 'Recherche en cours...' 
                 : 'Commander un Yely'}
             </Text>
           </TouchableOpacity>
         </View>
      ) : (
         <View style={styles.emptyBox}>
           <Text style={styles.emptyText}>Selectionnez une destination</Text>
         </View>
      )}

      <PassengerCountModal 
        visible={isPassengerModalVisible}
        onClose={() => setIsPassengerModalVisible(false)}
        onConfirm={handleFinalConfirm}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: THEME.COLORS.background,
    paddingHorizontal: THEME.SPACING.lg,
    paddingTop: THEME.SPACING.xl,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    zIndex: 10,
    borderWidth: 2.5,
    borderBottomWidth: 0, 
    borderColor: THEME.COLORS.champagneGold,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 15,
  },
  topContentWrapper: {
    marginBottom: 15,
  },
  estimationWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  emptyBox: {
    width: '100%',
    height: 90,
    backgroundColor: THEME.COLORS.glassLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.COLORS.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyText: {
    color: THEME.COLORS.textTertiary,
    fontStyle: 'italic',
    fontSize: 13,
  },
  confirmButton: {
    backgroundColor: THEME.COLORS.champagneGold,
    paddingVertical: 16,
    width: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    shadowColor: THEME.COLORS.champagneGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  confirmButtonDisabled: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderColor: THEME.COLORS.border,
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    color: '#121418',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  confirmButtonTextDisabled: {
    color: THEME.COLORS.textTertiary,
  }
});

export default RiderBottomPanel;