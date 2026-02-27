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
    const targetType = currentRide.status === 'ongoing' ? 'destination' : 'pickup';
    const target = targetType === 'pickup' ? currentRide.origin : currentRide.destination;
    const lat = target?.coordinates?.[1] || target?.latitude;
    const lng = target?.coordinates?.[0] || target?.longitude;
    return { lat: Number(lat), lng: Number(lng), type: targetType };
  };

  const syncLocation = (newLocation) => {
    setSimulatedLocation(newLocation);
    socketService.emit('updateLocation', {
      latitude: newLocation.latitude,
      longitude: newLocation.longitude,
      heading: newLocation.heading,
      speed: newLocation.speed
    });
  };

  const teleportTo = (targetType) => {
    const target = targetType === 'pickup' ? currentRide.origin : currentRide.destination;
    const lat = target?.coordinates?.[1] || target?.latitude;
    const lng = target?.coordinates?.[0] || target?.longitude;

    if (lat && lng) {
      const newLocation = {
        latitude: Number(lat) + 0.00008,
        longitude: Number(lng) + 0.00008,
        accuracy: 5,
        heading: 0,
        speed: 0
      };
      
      syncLocation(newLocation);
      
      dispatch(showSuccessToast({
        title: "Simulation System",
        message: `Saut vers ${targetType === 'pickup' ? 'Client' : 'Destination'}`
      }));
    }
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
        speed: 0
      };
      syncLocation(exactLocation);
      return;
    }

    const ratio = 3 / distance;
    const newLat = currentLat + (targetInfo.lat - currentLat) * ratio;
    const newLng = currentLng + (targetInfo.lng - currentLng) * ratio;

    const advancedLocation = {
      latitude: newLat,
      longitude: newLng,
      accuracy: 5,
      heading: 0,
      speed: 0
    };
    
    syncLocation(advancedLocation);
  };

  const resetSimulation = () => {
    setSimulatedLocation(null);
    if (realLocation) {
      socketService.emit('updateLocation', {
        latitude: realLocation.latitude,
        longitude: realLocation.longitude,
        heading: realLocation.heading || 0,
        speed: realLocation.speed || 0
      });
    }
  };

  return (
    <View style={styles.debugPanel}>
      <Text style={styles.debugTitle}>TEST GPS (MODE DEVELOPPEUR)</Text>
      <View style={styles.debugButtons}>
        <TouchableOpacity style={styles.debugBtn} onPress={() => teleportTo('pickup')}>
          <Text style={styles.debugBtnText}>SAUT CLIENT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.debugBtn} onPress={() => teleportTo('dropoff')}>
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
    borderColor: THEME.COLORS.info
  },
  debugTitle: {
    color: THEME.COLORS.info,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 1
  },
  debugButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8
  },
  debugButtonsSecond: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  debugBtn: {
    flex: 1,
    backgroundColor: THEME.COLORS.glassLight,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.border
  },
  debugBtnAdvance: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    borderColor: THEME.COLORS.success
  },
  debugBtnReset: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderColor: THEME.COLORS.danger
  },
  debugBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  }
});

export default GpsTeleporter;