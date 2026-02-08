// src/services/socketService.js
// Singleton Socket.io - Le système nerveux temps réel

import Constants from 'expo-constants';
import { io } from 'socket.io-client';
import { setCurrentRide, setRideStatus, updateDriverLocation } from '../store/slices/rideSlice';
import { showToast } from '../store/slices/uiSlice';
import store from '../store/store';

const SOCKET_URL = Constants.expoConfig?.extra?.SOCKET_URL || 'https://your-backend.onrender.com';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.locationInterval = null;
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('[Socket] Déjà connecté');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    this._setupListeners();
  }

  _setupListeners() {
    this.socket.on('connect', () => {
      console.log('[Socket] ✅ Connecté:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] ❌ Déconnecté:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Erreur de connexion:', error.message);
      this.reconnectAttempts++;
    });

    // ═══ ÉVÉNEMENTS COURSE ═══
    this.socket.on('new_ride_request', (data) => {
      console.log('[Socket] 🚕 Nouvelle demande de course:', data);
      store.dispatch({
        type: 'ui/openModal',
        payload: { type: 'rideRequest', data },
      });
    });

    this.socket.on('ride_accepted', (data) => {
      console.log('[Socket] ✅ Course acceptée:', data);
      store.dispatch(setCurrentRide(data.ride));
      store.dispatch(setRideStatus('accepted'));
      store.dispatch(showToast({
        type: 'success',
        title: 'Course acceptée !',
        message: `${data.driver?.name || 'Un chauffeur'} arrive dans ~${data.estimatedTime || '?'} min`,
      }));
    });

    this.socket.on('ride_cancelled', (data) => {
      console.log('[Socket] ❌ Course annulée:', data);
      store.dispatch(setRideStatus('cancelled'));
      store.dispatch(showToast({
        type: 'warning',
        title: 'Course annulée',
        message: data.reason || 'La course a été annulée.',
      }));
    });

    this.socket.on('ride_started', (data) => {
      console.log('[Socket] 🚗 Course démarrée');
      store.dispatch(setRideStatus('ongoing'));
    });

    this.socket.on('ride_completed', (data) => {
      console.log('[Socket] 🏁 Course terminée');
      store.dispatch(setRideStatus('completed'));
      store.dispatch(setCurrentRide(data.ride));
    });

    // ═══ TRACKING GPS DU CHAUFFEUR ═══
    this.socket.on('driver_location_update', (data) => {
      store.dispatch(updateDriverLocation({
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading,
      }));
    });

    // ═══ NOTIFICATIONS ═══
    this.socket.on('notification', (data) => {
      store.dispatch(showToast({
        type: data.type || 'info',
        title: data.title,
        message: data.message,
      }));
    });

    // ═══ ABONNEMENT ═══
    this.socket.on('subscription_validated', (data) => {
      store.dispatch(showToast({
        type: 'success',
        title: 'Abonnement activé ! 🎉',
        message: `Votre abonnement ${data.plan} est maintenant actif.`,
      }));
    });

    // ═══ ADMIN - Nouvelle preuve soumise ═══
    this.socket.on('new_proof_submitted', (data) => {
      store.dispatch(showToast({
        type: 'info',
        title: 'Nouvelle preuve reçue',
        message: `${data.driverName} a soumis une preuve de paiement.`,
      }));
    });
  }

  // Envoyer la position GPS
  emitLocation(coords) {
    if (this.socket?.connected) {
      this.socket.emit('update_location', {
        latitude: coords.latitude,
        longitude: coords.longitude,
        heading: coords.heading || 0,
        speed: coords.speed || 0,
        timestamp: Date.now(),
      });
    }
  }

  // Démarrer l'envoi périodique de position
  startLocationTracking(getLocationFn, intervalMs = 5000) {
    this.stopLocationTracking();
    this.locationInterval = setInterval(async () => {
      try {
        const coords = await getLocationFn();
        if (coords) {
          this.emitLocation(coords);
        }
      } catch (error) {
        console.error('[Socket] Erreur GPS:', error);
      }
    }, intervalMs);
  }

  stopLocationTracking() {
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
      this.locationInterval = null;
    }
  }

  // Rejoindre une room spécifique (pour le suivi d'une course)
  joinRoom(roomId) {
    this.socket?.emit('join_room', roomId);
  }

  leaveRoom(roomId) {
    this.socket?.emit('leave_room', roomId);
  }

  disconnect() {
    this.stopLocationTracking();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

// Singleton
const socketService = new SocketService();
export default socketService;