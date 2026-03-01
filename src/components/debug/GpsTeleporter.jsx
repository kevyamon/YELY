// src/components/debug/GpsTeleporter.jsx
// OUTIL DE DEBUG - Teleportation et Simulation de mouvement (DEV ONLY)
// CSCSM Level: Bank Grade

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

import MapService from '../../services/mapService';
import socketService from '../../services/socketService';
import { showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const GpsTeleporter = ({ currentRide, realLocation, simulatedLocation, setSimulatedLocation }) => {
  const dispatch = useDispatch();

  if (!__DEV__ || !currentRide) return null;

  const getTargetCoordinates = () => {
    // 🛡️ REPARATION : On ne vise la destination QUE si la course a officiellement demarre ('in_progress')
    const targetType = currentRide.status === 'in_progress' ? 'destination' : 'pickup';
    const target = targetType === 'pickup' ? currentRide.origin : currentRide.destination;
    const lat = target?.coordinates?.[1] || target?.latitude;
    const lng = target?.coordinates?.[0] || target?.longitude;
    return { lat: Number(lat), lng: Number(lng), type: targetType };
  };

  const syncLocation = (newLocation) => {
    setSimulatedLocation(newLocation);
    socketService.emitLocation(newLocation);
  };

  const teleportTo = (targetType) => {
    const target = targetType === 'pickup' ? currentRide.origin : currentRide.destination;
    const lat = target?.coordinates?.[1] || target?.latitude;
    const lng = target?.coordinates?.[0] || target?.longitude;

    if (!lat || !lng) return;

    const newLocation = {
      latitude: Number(lat) + 0.00008,
      longitude: Number(lng) + 0.00008,
      accuracy: 5,
      heading: 0,
      speed: 0,
    };

    syncLocation(newLocation);

    dispatch(showSuccessToast({
      title: 'Simulation System',
      message: `Saut vers ${targetType === 'pickup' ? 'Client' : 'Destination'} effectue`,
    }));
  };

  const moveForward = () => {
    const targetInfo = getTargetCoordinates();
    if (!targetInfo.lat || !targetInfo.lng) return;

    const currentLat = simulatedLocation?.latitude || realLocation?.latitude;
    const currentLng = simulatedLocation?.longitude || realLocation?.longitude;

    if (!currentLat || !currentLng) return;

    const distance = MapService.calculateDistance(
      { latitude: currentLat, longitude: currentLng },
      { latitude: targetInfo.lat, longitude: targetInfo.lng }
    );

    if (distance <= 3) {
      const exactLocation = {
        latitude: targetInfo.lat,
        longitude: targetInfo.lng,
        accuracy: 5,
        heading: 0,
        speed: 0,
      };
      syncLocation(exactLocation);
      return;
    }

    const ratio = 3 / distance;
    const newLat = currentLat + (targetInfo.lat - currentLat) * ratio;
    const newLng = currentLng + (targetInfo.lng - currentLng) * ratio;

    syncLocation({
      latitude: newLat,
      longitude: newLng,
      accuracy: 5,
      heading: 0,
      speed: 0,
    });
  };

  const resetSimulation = () => {
    setSimulatedLocation(null);
    if (realLocation) {
      socketService.emitLocation(realLocation);
    }
  };

  return (
    <View style={styles.debugPanel}>
      <Text style={styles.debugTitle}>TEST GPS (MODE DEVELOPPEUR)</Text>
      <View style={styles.debugButtons}>
        <TouchableOpacity style={styles.debugBtn} onPress={() => teleportTo('pickup')}>
          <Text style={styles.debugBtnText}>SAUT CLIENT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.debugBtn} onPress={() => teleportTo('destination')}>
          <Text style={styles.debugBtnText}>SAUT DEST.</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.debugButtonsSecond}>
        <TouchableOpacity style={[styles.debugBtn, styles.debugBtnAdvance]} onPress={moveForward}>
          <Text style={styles.debugBtnText}>AVANCER DE 3M</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.debugBtn, styles.debugBtnReset]} onPress={resetSimulation}>
          <Text style={styles.debugBtnText}>RESTAURER GPS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  debugPanel: {
    position: 'absolute',
    top: 100,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    padding: 12,
    borderRadius: 12,
    zIndex: 999,
    borderWidth: 1,
    borderColor: THEME.COLORS.info,
  },
  debugTitle: {
    color: THEME.COLORS.info,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 1,
  },
  debugButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  debugButtonsSecond: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  debugBtn: {
    flex: 1,
    backgroundColor: THEME.COLORS.glassLight,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  debugBtnAdvance: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    borderColor: THEME.COLORS.success,
  },
  debugBtnReset: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderColor: THEME.COLORS.danger,
  },
  debugBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default GpsTeleporter;