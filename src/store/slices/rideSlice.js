// src/store/slices/rideSlice.js
// STORE RIDE - Gestion stricte de l'etat des courses et de la telemetrie
// CSCSM Level: Bank Grade

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentRide: null,
  incomingRide: null,
  effectiveLocation: null,
  rideToRate: null,
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
        const { status, driverName, startedAt, finalPrice, arrivedAt } = action.payload;
        if (status) state.currentRide.status = status;
        if (driverName) state.currentRide.driverName = driverName;
        if (startedAt) state.currentRide.startedAt = startedAt;
        if (finalPrice) state.currentRide.finalPrice = finalPrice;
        if (arrivedAt !== undefined) state.currentRide.arrivedAt = arrivedAt;
      }
    },
    updateDriverLocation: (state, action) => {
      if (state.currentRide) {
        state.currentRide.driverLocation = action.payload;
      }
    },
    setEffectiveLocation: (state, action) => {
      state.effectiveLocation = action.payload;
    },
    clearCurrentRide: (state) => {
      // Purge absolue garantissant l'effacement total des traces sur la Map
      state.currentRide = null;
      state.effectiveLocation = null;
      state.incomingRide = null;
    },
    setRideToRate: (state, action) => {
      state.rideToRate = action.payload;
    },
    clearRideToRate: (state) => {
      state.rideToRate = null;
    }
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
  setRideToRate,
  clearRideToRate
} = rideSlice.actions;

export const selectIncomingRide = (state) => state.ride.incomingRide;
export const selectCurrentRide = (state) => state.ride.currentRide;
export const selectEffectiveLocation = (state) => state.ride.effectiveLocation;
export const selectRideToRate = (state) => state.ride.rideToRate;

export default rideSlice.reducer;