// src/store/slices/authSlice.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userInfo: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.userInfo = user;
      state.token = token;
      state.isAuthenticated = true;
      // Persister
      AsyncStorage.setItem('userInfo', JSON.stringify(user));
      AsyncStorage.setItem('token', token);
    },
    updateUserInfo: (state, action) => {
      state.userInfo = { ...state.userInfo, ...action.payload };
      AsyncStorage.setItem('userInfo', JSON.stringify(state.userInfo));
    },
    logout: (state) => {
      state.userInfo = null;
      state.token = null;
      state.isAuthenticated = false;
      AsyncStorage.multiRemove(['userInfo', 'token']);
    },
    restoreAuth: (state, action) => {
      const { user, token } = action.payload;
      state.userInfo = user;
      state.token = token;
      state.isAuthenticated = true;
    },
  },
});

export const { setCredentials, updateUserInfo, logout, restoreAuth } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state) => state.auth.userInfo;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.userInfo?.role;
export const selectToken = (state) => state.auth.token;