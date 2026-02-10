// src/services/socketService.js
// Singleton Socket.io - Le système nerveux temps réel

import { io } from 'socket.io-client';

// Utilise la même variable d'environnement que apiSlice
// EXPO_PUBLIC_API_URL = https://yely-backend-xxx.onrender.com/api
// On retire le /api pour le socket car Socket.io se connecte à la racine
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
    // Ne pas connecter si pas de token ou pas d'URL
    if (!token || !SOCKET_URL) {
      console.warn('[Socket] Connexion ignorée : token ou URL manquant');
      return;
    }

    if (this.socket?.connected) {
      console.log('[Socket] Déjà connecté');
      return;
    }

    console.log('[Socket] Tentative de connexion vers:', SOCKET_URL);

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
   * Listeners de base (connexion/déconnexion)
   * Les listeners métier seront ajoutés par les hooks/composants
   */
  _setupCoreListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[Socket] ✅ Connecté avec ID:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] ❌ Déconnecté:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      // Log uniquement les 3 premières tentatives pour ne pas spammer la console
      if (this.reconnectAttempts <= 3) {
        console.warn('[Socket] Erreur de connexion (tentative', this.reconnectAttempts + '):', error.message);
      }
      // Après le max de tentatives, on arrête
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[Socket] Nombre max de tentatives atteint. Arrêt.');
        this.disconnect();
      }
    });
  }

  /**
   * Écouter un événement
   * @param {string} event - Nom de l'événement
   * @param {Function} callback - Fonction à appeler
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      this._listeners.push({ event, callback });
    }
  }

  /**
   * Retirer un listener
   * @param {string} event - Nom de l'événement
   * @param {Function} callback - Fonction à retirer
   */
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      this._listeners = this._listeners.filter(
        (l) => !(l.event === event && l.callback === callback)
      );
    }
  }

  /**
   * Émettre un événement
   * @param {string} event - Nom de l'événement
   * @param {*} data - Données à envoyer
   */
  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
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

  /**
   * Arrête le suivi GPS
   */
  stopLocationTracking() {
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
      this.locationInterval = null;
      console.log('[Socket] Arrêt du tracking GPS');
    }
  }

  /**
   * Rejoindre une "room" spécifique
   * @param {string} roomId
   */
  joinRoom(roomId) {
    if (this.socket?.connected && roomId) {
      this.socket.emit('join_room', roomId);
    }
  }

  /**
   * Quitter une "room"
   * @param {string} roomId
   */
  leaveRoom(roomId) {
    if (this.socket?.connected && roomId) {
      this.socket.emit('leave_room', roomId);
    }
  }

  /**
   * Déconnexion propre
   */
  disconnect() {
    this.stopLocationTracking();
    // Retirer tous les listeners custom
    this._listeners.forEach(({ event, callback }) => {
      this.socket?.off(event, callback);
    });
    this._listeners = [];

    if (this.socket) {
      console.log('[Socket] Déconnexion manuelle');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Vérifie si le socket est connecté
   * @returns {boolean}
   */
  getIsConnected() {
    return this.socket?.connected || false;
  }
}

// Instance unique (Singleton)
const socketService = new SocketService();
export default socketService;