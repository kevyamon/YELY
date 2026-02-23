// src/store/slices/rideSlice.js
// STORE RIDE - Séparation stricte Client/Chauffeur

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentRide: null,   // Course en cours (Passager ou Chauffeur ayant accepté)
  incomingRide: null,  // Demande entrante (Uniquement Chauffeur)
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
      // Merge intelligent pour sécuriser l'ID et les données racines
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
    clearCurrentRide: (state) => {
      state.currentRide = null;
    }
  },
});

export const { 
  setIncomingRide, 
  clearIncomingRide, 
  setCurrentRide, 
  updateRideStatus, 
  clearCurrentRide 
} = rideSlice.actions;

export const selectIncomingRide = (state) => state.ride.incomingRide;
export const selectCurrentRide = (state) => state.ride.currentRide;

export default rideSlice.reducer;