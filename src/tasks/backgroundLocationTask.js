// src/tasks/backgroundLocationTask.js
// TACHE DE FOND - Suivi GPS Indestructible (Headless JS)
// CSCSM Level: Bank Grade (Modularise < 325 lignes, Sans Emojis)

import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import socketService from '../services/socketService';

export const BACKGROUND_LOCATION_TASK = 'yely-background-location-task';

if (Platform.OS !== 'web' && TaskManager && typeof TaskManager.defineTask === 'function') {
  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }) => {
    if (error) {
      return;
    }
    
    if (data) {
      const { locations } = data;
      const loc = locations && locations[0];
      
      if (loc) {
        if (loc.mocked && !__DEV__) return;

        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          heading: loc.coords.heading || 0,
          speed: loc.coords.speed || 0,
          accuracy: loc.coords.accuracy || 0,
          timestamp: Date.now(),
        };

        socketService.emitLocation(coords);
      }
    }
  });
}