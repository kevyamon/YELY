// src/components/debug/GpsTeleporter.jsx
// OUTIL DE DEBUG - Teleportation et Simulation de mouvement (DESACTIVE EN PROD)
// CSCSM Level: Bank Grade

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

import MapService from '../../services/mapService';
import socketService from '../../services/socketService';
import { showSuccessToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';

const GpsTeleporter = ({ currentRide, realLocation, simulatedLocation, setSimulatedLocation, mapRef }) => {
  const dispatch = useDispatch();

  // SECURITE DE PRODUCTION : Ce composant ne s'affiche jamais en production
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
  if (!isDev || !currentRide) return null;

  const getTargetCoordinates = () => {
    if (!currentRide) return { lat: 0, lng: 0, type: 'unknown' };

    const isOngoing = ['arrived', 'in_progress'].includes(currentRide.status);
    const isDelivery = currentRide.type === 'DELIVERY';

    if (isDelivery) {
      if (isOngoing) {
        // Destination finale (client)
        const lat = currentRide.destination?.coordinates?.[1] || currentRide.destination?.latitude;
        const lng = currentRide.destination?.coordinates?.[0] || currentRide.destination?.longitude;
        return { lat: Number(lat), lng: Number(lng), type: 'destination' };
      }

      // Prochain point de collecte vendeur
      const nextSeller = currentRide.collectionPoints?.find(cp => !cp.isCollected);
      if (nextSeller) {
        const lat = nextSeller.coordinates?.[1] || nextSeller.coordinates?.latitude;
        const lng = nextSeller.coordinates?.[0] || nextSeller.coordinates?.longitude;
        return { lat: Number(lat), lng: Number(lng), type: 'pickup_seller' };
      }
    }

    // Trajet standard VTC
    const targetType = isOngoing ? 'destination' : 'pickup';
    const target = targetType === 'pickup' ? currentRide.origin : currentRide.destination;
    const lat = target?.coordinates?.[1] || target?.latitude;
    const lng = target?.coordinates?.[0] || target?.longitude;
    return { lat: Number(lat), lng: Number(lng), type: targetType };
  };

  const syncLocation = (newLocation) => {
    setSimulatedLocation(newLocation);
    socketService.emitLocation(newLocation);

    // Animer la caméra de la carte pour centrer la voiture sur le nouveau point de simulation
    if (mapRef?.current) {
      mapRef.current.animateToRegion({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
      }, 1000);
    }
  };

  const teleportTo = (targetType) => {
    let lat, lng;
    let name = '';

    if (targetType === 'pickup') {
      const isDelivery = currentRide.type === 'DELIVERY';
      const nextSeller = isDelivery ? currentRide.collectionPoints?.find(cp => !cp.isCollected) : null;

      if (nextSeller) {
        lat = nextSeller.coordinates?.[1] || nextSeller.coordinates?.latitude;
        lng = nextSeller.coordinates?.[0] || nextSeller.coordinates?.longitude;
        name = 'Vendeur';
      } else {
        lat = currentRide.origin?.coordinates?.[1] || currentRide.origin?.latitude;
        lng = currentRide.origin?.coordinates?.[0] || currentRide.origin?.longitude;
        name = 'Client';
      }
    } else {
      lat = currentRide.destination?.coordinates?.[1] || currentRide.destination?.latitude;
      lng = currentRide.destination?.coordinates?.[0] || currentRide.destination?.longitude;
      name = 'Destination';
    }

    if (!lat || !lng) return;

    // Offset de sécurité minimal pour la détection
    const offset = targetType === 'destination' ? 0.0001 : 0.00008;

    const newLocation = {
      latitude: Number(lat) + offset,
      longitude: Number(lng) + offset,
      accuracy: 5,
      heading: 0,
      speed: 0,
    };

    syncLocation(newLocation);

    dispatch(showSuccessToast({
      title: 'Simulation System',
      message: `Saut vers ${name} effectué`,
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

    // Saut de 3 km (3000 mètres)
    if (distance <= 3000) {
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

    const ratio = 3000 / distance;
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
      <Text style={styles.debugTitle}>TEST GPS (SIMULATION ACTIVE)</Text>
      <View style={styles.debugButtons}>
        <TouchableOpacity style={styles.debugBtn} onPress={() => teleportTo('pickup')}>
          <Text style={styles.debugBtnText}>
            {currentRide.type === 'DELIVERY' && currentRide.status === 'accepted' ? 'SAUT VENDEUR' : 'SAUT CLIENT'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.debugBtn} onPress={() => teleportTo('destination')}>
          <Text style={styles.debugBtnText}>SAUT DEST.</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.debugButtonsSecond}>
        <TouchableOpacity style={[styles.debugBtn, styles.debugBtnAdvance]} onPress={moveForward}>
          <Text style={styles.debugBtnText}>AVANCER DE 3KM</Text>
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
    backgroundColor: THEME.COLORS.glassDark || THEME.COLORS.background,
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
    backgroundColor: THEME.COLORS.glassLight || THEME.COLORS.surface,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  debugBtnAdvance: {
    backgroundColor: THEME.COLORS.glassSurface || THEME.COLORS.surface,
    borderColor: THEME.COLORS.success,
  },
  debugBtnReset: {
    backgroundColor: THEME.COLORS.glassSurface || THEME.COLORS.surface,
    borderColor: THEME.COLORS.danger,
  },
  debugBtnText: {
    color: THEME.COLORS.textPrimary || THEME.COLORS.textInverse,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default GpsTeleporter;