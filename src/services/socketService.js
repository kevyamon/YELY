// src/services/socketService.js
// Singleton Socket.io - Le système nerveux temps réel (Sécurisé)

import { io } from 'socket.io-client';

// EXPO_PUBLIC_API_URL = https://yely-backend-xxx.onrender.com/api
// On retire le /api car Socket.io se connecte à la racine
const API_URL = process.env.EXPO_PUBLIC_API_URL || '';
const SOCKET_URL = API_URL.replace('/api', '');

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.locationInterval = null;
    this._listeners = [];
  }

  /**
   * Initialise la connexion Socket.io
   * @param {string} token - Token d'authentification JWT
   */
  connect(token) {
    if (!token || !SOCKET_URL) {
      if (__DEV__) console.warn('[Socket] Connexion impossible : Config manquante');
      return;
    }

    if (this.socket?.connected) {
      return; // Déjà connecté
    }

    // SECURITY: On ne loggue JAMAIS l'URL en clair
    if (__DEV__) console.log('[Socket] Initialisation du tunnel sécurisé...');

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      autoConnect: true,
    });

    this._setupCoreListeners();
  }

  /**
   * Listeners de base (Infrastructure)
   */
  _setupCoreListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      if (__DEV__) console.log('[Socket] ✅ Tunnel établi (Secure)');
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      if (__DEV__) console.log('[Socket] ❌ Tunnel fermé:', reason);
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      // On ne loggue l'erreur qu'en dev pour le debug
      if (__DEV__ && this.reconnectAttempts <= 3) {
        console.warn(`[Socket] Tentative ${this.reconnectAttempts} échouée.`);
      }
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.disconnect();
      }
    });
  }

  /**
   * Gestionnaire d'événements (Façade)
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      this._listeners.push({ event, callback });
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      this._listeners = this._listeners.filter(
        (l) => !(l.event === event && l.callback === callback)
      );
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Émission optimisée de la position GPS
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

  startLocationTracking(getLocationFn, intervalMs = 5000) {
    this.stopLocationTracking();
    if (__DEV__) console.log('[Socket] 🛰️ Tracking GPS actif');

    this.locationInterval = setInterval(async () => {
      try {
        const coords = await getLocationFn();
        if (coords) {
          this.emitLocation(coords);
        }
      } catch (error) {
        // Silencieux en prod
      }
    }, intervalMs);
  }

  stopLocationTracking() {
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
      this.locationInterval = null;
    }
  }

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
    // Nettoyage complet
    this._listeners.forEach(({ event, callback }) => {
      this.socket?.off(event, callback);
    });
    this._listeners = [];

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getIsConnected() {
    return this.socket?.connected || false;
  }
}

const socketService = new SocketService();
export default socketService;