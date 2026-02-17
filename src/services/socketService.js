// src/services/socketService.js
// Singleton Socket.io - Système Nerveux Temps Réel (Sécurisé, Silencieux & Anti-Loop)

import { io } from 'socket.io-client';

const API_URL = process.env.EXPO_PUBLIC_API_URL || '';
const SOCKET_URL = API_URL.split('/api')[0];

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5; 
    this._listeners = [];
  }

  connect(token) {
    if (!token || !SOCKET_URL || this.socket?.connected) {
      return; 
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      path: '/socket.io/',
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 2000,
    });

    this._setupCoreListeners();
  }

  _setupCoreListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      if (__DEV__) console.log('[Socket] ✅ Connecté !');
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      if (__DEV__) console.log(`[Socket] Déconnecté: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      // 🛡️ SÉCURITÉ : Anti-Loop. Si le token est rejeté, on abandonne tout de suite.
      if (['AUTH_FAILED', 'AUTH_REJECTED', 'AUTH_TOKEN_MISSING'].includes(error.message)) {
        if (__DEV__) console.warn('[Socket] Accès refusé par le serveur. Arrêt des tentatives.');
        this.disconnect();
        return;
      }

      this.reconnectAttempts++;
      if (__DEV__) console.warn(`[Socket] Tentative connexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        if (__DEV__) console.error('[Socket] Échec définitif de connexion.');
        this.disconnect();
      }
    });
  }

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