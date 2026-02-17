import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentRide: null, 
  incomingRide: null, 
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