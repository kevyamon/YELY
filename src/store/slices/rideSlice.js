// src/store/slices/rideSlice.js

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentRide: null,
  rideStatus: null, // 'idle', 'searching', 'requested', 'accepted', 'ongoing', 'completed', 'cancelled'
  pickup: null, // { latitude, longitude, address }
  destination: null, // { latitude, longitude, address }
  selectedForfait: 'STANDARD', // 'ECHO', 'STANDARD', 'VIP'
  estimatedPrice: 0,
  estimatedTime: 0,
  driverLocation: null, // Pour le tracking temps réel
  assignedDriver: null,
  isIdentifyMode: false, // Mode "Pancarte Numérique"
};

const rideSlice = createSlice({
  name: 'ride',
  initialState,
  reducers: {
    setPickup: (state, action) => {
      state.pickup = action.payload;
    },
    setDestination: (state, action) => {
      state.destination = action.payload;
    },
    setSelectedForfait: (state, action) => {
      state.selectedForfait = action.payload;
    },
    setEstimates: (state, action) => {
      state.estimatedPrice = action.payload.price;
      state.estimatedTime = action.payload.time;
    },
    setRideStatus: (state, action) => {
      state.rideStatus = action.payload;
    },
    setCurrentRide: (state, action) => {
      state.currentRide = action.payload;
      state.rideStatus = action.payload?.status || 'idle';
    },
    setAssignedDriver: (state, action) => {
      state.assignedDriver = action.payload;
    },
    updateDriverLocation: (state, action) => {
      state.driverLocation = action.payload;
    },
    activateIdentifyMode: (state) => {
      state.isIdentifyMode = true;
    },
    deactivateIdentifyMode: (state) => {
      state.isIdentifyMode = false;
    },
    resetRide: (state) => {
      return initialState;
    },
  },
});

export const {
  setPickup,
  setDestination,
  setSelectedForfait,
  setEstimates,
  setRideStatus,
  setCurrentRide,
  setAssignedDriver,
  updateDriverLocation,
  activateIdentifyMode,
  deactivateIdentifyMode,
  resetRide,
} = rideSlice.actions;

export default rideSlice.reducer;