// src/services/socketService.js
// Singleton Socket.io - Le système nerveux temps réel

import Constants from 'expo-constants';
import { io } from 'socket.io-client';
import { setCurrentRide, setRideStatus, updateDriverLocation } from '../store/slices/rideSlice';
import { showToast } from '../store/slices/uiSlice';
import store from '../store/store';

// Récupération sécurisée de l'URL API
const SOCKET_URL = Constants.expoConfig?.extra?.SOCKET_URL || 'https://your-backend.onrender.com';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.locationInterval = null;
  }

  /**
   * Initialise la connexion Socket.io
   * @param {string} token - Token d'authentification JWT
   */
  connect(token) {
    if (this.socket?.connected) {
      console.log('[Socket] Déjà connecté');
      return;
    }

    console.log('[Socket] Tentative de connexion vers:', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'], // Force websocket pour éviter le long-polling (mieux pour React Native)
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      autoConnect: true,
    });

    this._setupListeners();
  }

  _setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[Socket] ✅ Connecté avec ID:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] ❌ Déconnecté:', reason);
      this.isConnected = false;
      if (reason === 'io server disconnect') {
        // La déconnexion a été initiée par le serveur, on ne reconnecte pas automatiquement
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Erreur de connexion:', error.message);
      this.reconnectAttempts++;
    });

    // ═══ ÉVÉNEMENTS COURSE ═══
    this.socket.on('new_ride_request', (data) => {
      console.log('[Socket] 🚕 Nouvelle demande de course reçue:', data);
      store.dispatch({
        type: 'ui/openModal',
        payload: { type: 'rideRequest', data },
      });
    });

    this.socket.on('ride_accepted', (data) => {
      console.log('[Socket] ✅ Course acceptée:', data);
      // Mise à jour du store Redux
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

    this.socket.on('ride_started', () => {
      console.log('[Socket] 🚗 Course démarrée');
      store.dispatch(setRideStatus('ongoing'));
    });

    this.socket.on('ride_completed', (data) => {
      console.log('[Socket] 🏁 Course terminée');
      store.dispatch(setRideStatus('completed'));
      if (data?.ride) {
        store.dispatch(setCurrentRide(data.ride));
      }
    });

    // ═══ TRACKING GPS DU CHAUFFEUR ═══
    this.socket.on('driver_location_update', (data) => {
      // Optimisation : ne dispatcher que si les données sont valides
      if (data && data.latitude && data.longitude) {
        store.dispatch(updateDriverLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading || 0,
        }));
      }
    });

    // ═══ NOTIFICATIONS GÉNÉRALES ═══
    this.socket.on('notification', (data) => {
      store.dispatch(showToast({
        type: data.type || 'info',
        title: data.title || 'Notification',
        message: data.message || '',
      }));
    });

    // ═══ ABONNEMENT CHAUFFEUR ═══
    this.socket.on('subscription_validated', (data) => {
      store.dispatch(showToast({
        type: 'success',
        title: 'Abonnement activé ! 🎉',
        message: `Votre abonnement ${data.plan} est maintenant actif.`,
      }));
    });

    // ═══ ADMIN - Alertes ═══
    this.socket.on('new_proof_submitted', (data) => {
      store.dispatch(showToast({
        type: 'info',
        title: 'Nouvelle preuve reçue',
        message: `${data.driverName || 'Un chauffeur'} a soumis une preuve de paiement.`,
      }));
    });
  }

  /**
   * Émet la position actuelle vers le serveur
   * @param {Object} coords - { latitude, longitude, heading, speed }
   */
  emitLocation(coords) {
    if (this.socket?.connected && coords) {
      this.socket.emit('update_location', {
        latitude: coords.latitude,
        longitude: coords.longitude,
        heading: coords.heading || 0,
        speed: coords.speed || 0,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Démarre le suivi GPS périodique
   * @param {Function} getLocationFn - Fonction async retournant la position
   * @param {number} intervalMs - Intervalle en ms (défaut 5000)
   */
  startLocationTracking(getLocationFn, intervalMs = 5000) {
    this.stopLocationTracking();
    console.log('[Socket] Démarrage du tracking GPS...');
    
    this.locationInterval = setInterval(async () => {
      try {
        const coords = await getLocationFn();
        if (coords) {
          this.emitLocation(coords);
        }
      } catch (error) {
        console.error('[Socket] Erreur récupération GPS:', error);
      }
    }, intervalMs);
  }

  stopLocationTracking() {
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
      this.locationInterval = null;
      console.log('[Socket] Arrêt du tracking GPS');
    }
  }

  // Rejoindre une "room" spécifique (ex: ride_12345)
  joinRoom(roomId) {
    if (this.socket?.connected && roomId) {
      this.socket.emit('join_room', roomId);
    }
  }

  leaveRoom(roomId) {
    if (this.socket?.connected && roomId) {
      this.socket.emit('leave_room', roomId);
    }
  }

  disconnect() {
    this.stopLocationTracking();
    if (this.socket) {
      console.log('[Socket] Déconnexion manuelle');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

// Instance unique (Singleton)
const socketService = new SocketService();
export default socketService;