// src/store/slices/uiSlice.js
// Gestion de tout l'état UI : modales, sidebar, toasts, loading, drawer, updates

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  modal: {
    visible: false,
    type: null,       
    position: 'center', 
    data: null,        
  },
  toast: {
    visible: false,
    type: 'info',      
    title: '',
    message: '',
    duration: 3000,
  },
  sidebarOpen: false,
  loading: {
    visible: false,
    message: '',
  },
  bottomSheet: {
    snapPoint: 'collapsed', 
  },
  activeScreen: 'Landing',
  keyboardVisible: false,
  
  // NOUVEAU : Etat global des mises a jour (PWA/Native/OTA)
  appUpdate: {
    isAvailable: false,
    latestVersion: null,
    mandatoryUpdate: false,
    updateUrl: '',
    isOta: false,
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
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

    showSuccessToast: (state, action) => {
      state.toast.visible = true;
      state.toast.type = 'success';
      state.toast.title = action.payload?.title || 'Succes';
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

    openSidebar: (state) => {
      state.sidebarOpen = true;
    },
    closeSidebar: (state) => {
      state.sidebarOpen = false;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    showLoading: (state, action) => {
      state.loading.visible = true;
      state.loading.message = action.payload?.message || 'Chargement...';
    },
    hideLoading: (state) => {
      state.loading.visible = false;
      state.loading.message = '';
    },

    setBottomSheetSnap: (state, action) => {
      state.bottomSheet.snapPoint = action.payload; 
    },

    setActiveScreen: (state, action) => {
      state.activeScreen = action.payload;
    },

    setKeyboardVisible: (state, action) => {
      state.keyboardVisible = action.payload;
    },

    // NOUVEAU : Reducer pour la mise a jour globale
    setAppUpdate: (state, action) => {
      state.appUpdate = { ...state.appUpdate, ...action.payload };
    },

    resetUI: () => {
      return initialState;
    },
  },
});

export const {
  openModal,
  closeModal,
  updateModalData,
  showToast,
  hideToast,
  showSuccessToast,
  showErrorToast,
  openSidebar,
  closeSidebar,
  toggleSidebar,
  showLoading,
  hideLoading,
  setBottomSheetSnap,
  setActiveScreen,
  setKeyboardVisible,
  setAppUpdate, // EXPORT
  resetUI,
} = uiSlice.actions;

export const selectModal = (state) => state.ui.modal;
export const selectModalVisible = (state) => state.ui.modal.visible;
export const selectModalType = (state) => state.ui.modal.type;
export const selectModalData = (state) => state.ui.modal.data;
export const selectToast = (state) => state.ui.toast;
export const selectToastVisible = (state) => state.ui.toast.visible;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectLoading = (state) => state.ui.loading;
export const selectIsLoading = (state) => state.ui.loading.visible;
export const selectBottomSheetSnap = (state) => state.ui.bottomSheet.snapPoint;
export const selectActiveScreen = (state) => state.ui.activeScreen;
export const selectKeyboardVisible = (state) => state.ui.keyboardVisible;

// NOUVEAU SELECTOR
export const selectAppUpdate = (state) => state.ui.appUpdate;

export default uiSlice.reducer;