// src/store/slices/rideSlice.js
// STORE RIDE - Separation stricte Client/Chauffeur & Telemetrie

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentRide: null,
  incomingRide: null,
  // Position effective du chauffeur (simulee en dev, GPS reel en prod).
  // Stockee ici pour etre accessible par tous les composants montes independamment.
  effectiveLocation: null,
};

const rideSlice = createSlice({
  name: 'ride',
  initialState,
  reducers: {
    setIncomingRide: (state, action) => {
      state.incomingRide = action.payload;
    },
    clearIncomingRide: (state) => {
      state.incomingRide = null;
    },
    setCurrentRide: (state, action) => {
      state.currentRide = { ...state.currentRide, ...action.payload };
    },
    updateRideStatus: (state, action) => {
      if (state.currentRide) {
        const { status, driverName, startedAt, finalPrice } = action.payload;
        if (status) state.currentRide.status = status;
        if (driverName) state.currentRide.driverName = driverName;
        if (startedAt) state.currentRide.startedAt = startedAt;
        if (finalPrice) state.currentRide.finalPrice = finalPrice;
      }
    },
    // Telemetrie recue depuis le serveur (cote rider via socket)
    updateDriverLocation: (state, action) => {
      if (state.currentRide) {
        state.currentRide.driverLocation = action.payload;
      }
    },
    // Position effective locale du chauffeur (simulee ou GPS reel).
    // Mise a jour par DriverHome a chaque changement de position.
    // Lue par DriverRideOverlay pour afficher la bonne distance.
    setEffectiveLocation: (state, action) => {
      state.effectiveLocation = action.payload;
    },
    clearCurrentRide: (state) => {
      state.currentRide = null;
      state.effectiveLocation = null;
    },
  },
});

export const {
  setIncomingRide,
  clearIncomingRide,
  setCurrentRide,
  updateRideStatus,
  updateDriverLocation,
  setEffectiveLocation,
  clearCurrentRide,
} = rideSlice.actions;

export const selectIncomingRide = (state) => state.ride.incomingRide;
export const selectCurrentRide = (state) => state.ride.currentRide;
export const selectEffectiveLocation = (state) => state.ride.effectiveLocation;

export default rideSlice.reducer;