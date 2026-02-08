// src/store/slices/uiSlice.js
// Gestion de tout l'état UI : modales, sidebar, toasts, loading, drawer

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // ─── Modal (utilisé par GlassModal) ───
  modal: {
    visible: false,
    type: null,       // 'commander', 'confirmation', 'forfaitDetail', 'rating', 'identify', etc.
    position: 'center', // 'center', 'bottom', 'top'
    data: null,        // Données dynamiques à passer à la modale
  },

  // ─── Toast / Snackbar (utilisé par AppToast) ───
  toast: {
    visible: false,
    type: 'info',      // 'success', 'error', 'warning', 'info'
    title: '',
    message: '',
    duration: 3000,
  },

  // ─── Sidebar / Drawer Navigation ───
  sidebarOpen: false,

  // ─── Loading global ───
  loading: {
    visible: false,
    message: '',
  },

  // ─── Bottom Sheet (drawer de course) ───
  bottomSheet: {
    snapPoint: 'collapsed', // 'collapsed', 'expanded', 'full'
  },

  // ─── Écran actif (pour tracking interne) ───
  activeScreen: 'Landing',

  // ─── Clavier ───
  keyboardVisible: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // ═══════════════════════════════════════
    // MODAL
    // ═══════════════════════════════════════
    openModal: (state, action) => {
      state.modal.visible = true;
      state.modal.type = action.payload?.type || 'default';
      state.modal.position = action.payload?.position || 'center';
      state.modal.data = action.payload?.data || null;
    },
    closeModal: (state) => {
      state.modal.visible = false;
      state.modal.type = null;
      state.modal.position = 'center';
      state.modal.data = null;
    },
    updateModalData: (state, action) => {
      state.modal.data = { ...state.modal.data, ...action.payload };
    },

    // ═══════════════════════════════════════
    // TOAST (AppToast)
    // ═══════════════════════════════════════
    showToast: (state, action) => {
      state.toast.visible = true;
      state.toast.type = action.payload?.type || 'info';
      state.toast.title = action.payload?.title || '';
      state.toast.message = action.payload?.message || '';
      state.toast.duration = action.payload?.duration || 3000;
    },
    hideToast: (state) => {
      state.toast.visible = false;
      state.toast.title = '';
      state.toast.message = '';
    },

    // Raccourcis toast
    showSuccessToast: (state, action) => {
      state.toast.visible = true;
      state.toast.type = 'success';
      state.toast.title = action.payload?.title || 'Succès';
      state.toast.message = action.payload?.message || '';
      state.toast.duration = action.payload?.duration || 3000;
    },
    showErrorToast: (state, action) => {
      state.toast.visible = true;
      state.toast.type = 'error';
      state.toast.title = action.payload?.title || 'Erreur';
      state.toast.message = action.payload?.message || '';
      state.toast.duration = action.payload?.duration || 4000;
    },

    // ═══════════════════════════════════════
    // SIDEBAR
    // ═══════════════════════════════════════
    openSidebar: (state) => {
      state.sidebarOpen = true;
    },
    closeSidebar: (state) => {
      state.sidebarOpen = false;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    // ═══════════════════════════════════════
    // LOADING GLOBAL
    // ═══════════════════════════════════════
    showLoading: (state, action) => {
      state.loading.visible = true;
      state.loading.message = action.payload?.message || 'Chargement...';
    },
    hideLoading: (state) => {
      state.loading.visible = false;
      state.loading.message = '';
    },

    // ═══════════════════════════════════════
    // BOTTOM SHEET
    // ═══════════════════════════════════════
    setBottomSheetSnap: (state, action) => {
      state.bottomSheet.snapPoint = action.payload; // 'collapsed', 'expanded', 'full'
    },

    // ═══════════════════════════════════════
    // NAVIGATION / ÉCRAN ACTIF
    // ═══════════════════════════════════════
    setActiveScreen: (state, action) => {
      state.activeScreen = action.payload;
    },

    // ═══════════════════════════════════════
    // CLAVIER
    // ═══════════════════════════════════════
    setKeyboardVisible: (state, action) => {
      state.keyboardVisible = action.payload;
    },

    // ═══════════════════════════════════════
    // RESET COMPLET UI
    // ═══════════════════════════════════════
    resetUI: () => {
      return initialState;
    },
  },
});

// ═══════════════════════════════════════════════════════════════
// EXPORT DES ACTIONS
// ═══════════════════════════════════════════════════════════════
export const {
  // Modal
  openModal,
  closeModal,
  updateModalData,

  // Toast
  showToast,
  hideToast,
  showSuccessToast,
  showErrorToast,

  // Sidebar
  openSidebar,
  closeSidebar,
  toggleSidebar,

  // Loading
  showLoading,
  hideLoading,

  // Bottom Sheet
  setBottomSheetSnap,

  // Navigation
  setActiveScreen,

  // Clavier
  setKeyboardVisible,

  // Reset
  resetUI,
} = uiSlice.actions;

// ═══════════════════════════════════════════════════════════════
// SELECTORS
// ═══════════════════════════════════════════════════════════════

// Modal
export const selectModal = (state) => state.ui.modal;
export const selectModalVisible = (state) => state.ui.modal.visible;
export const selectModalType = (state) => state.ui.modal.type;
export const selectModalData = (state) => state.ui.modal.data;

// Toast
export const selectToast = (state) => state.ui.toast;
export const selectToastVisible = (state) => state.ui.toast.visible;

// Sidebar
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;

// Loading
export const selectLoading = (state) => state.ui.loading;
export const selectIsLoading = (state) => state.ui.loading.visible;

// Bottom Sheet
export const selectBottomSheetSnap = (state) => state.ui.bottomSheet.snapPoint;

// Navigation
export const selectActiveScreen = (state) => state.ui.activeScreen;

// Clavier
export const selectKeyboardVisible = (state) => state.ui.keyboardVisible;

// ═══════════════════════════════════════════════════════════════
// EXPORT DU REDUCER
// ═══════════════════════════════════════════════════════════════
export default uiSlice.reducer;