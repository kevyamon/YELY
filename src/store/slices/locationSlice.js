// src/store/slices/locationSlice.js
import { createSlice } from '@reduxjs/toolkit';

const locationSlice = createSlice({
  name: 'location',
  initialState: {
    lastCoords: null, // { latitude, longitude, ... }
    lastAddress: null,
    isGpsActive: false,
  },
  reducers: {
    updateCoords: (state, action) => {
      state.lastCoords = action.payload;
      state.isGpsActive = true;
    },
    updateAddress: (state, action) => {
      state.lastAddress = action.payload;
    },
    setGpsStatus: (state, action) => {
      state.isGpsActive = action.payload;
    }
  }
});

export const { updateCoords, updateAddress, setGpsStatus } = locationSlice.actions;

export const selectLastCoords = (state) => state.location.lastCoords;
export const selectLastAddress = (state) => state.location.lastAddress;
export const selectIsGpsActive = (state) => state.location.isGpsActive;

export default locationSlice.reducer;
