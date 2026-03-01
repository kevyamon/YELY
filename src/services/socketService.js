// src/services/socketService.js
// Singleton Socket.io - Service Reseau Agnostique
// CSCSM Level: Bank Grade

import { io } from 'socket.io-client';

const API_URL = process.env.EXPO_PUBLIC_API_URL || '';
const SOCKET_URL = API_URL.split('/api')[0];

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
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
      reconnectionAttempts: Infinity, 
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      randomizationFactor: 0.5
    });

    this._setupCoreListeners();
  }

  _setupCoreListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      if (__DEV__) console.log('[SOCKET_SERVICE] Connecte avec succes au backend.');
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      if (__DEV__) console.log(`[SOCKET_SERVICE] Deconnecte. Raison: ${reason}`);
    });

    this.socket.on('force_disconnect', (data) => {
      if (__DEV__) console.warn(`[SOCKET_SERVICE] Deconnexion forcee par le serveur. Raison: ${data?.reason}`);
      this.disconnect();
    });

    this.socket.on('connect_error', (error) => {
      if (['AUTH_FAILED', 'AUTH_REJECTED', 'AUTH_TOKEN_MISSING'].includes(error.message)) {
        if (__DEV__) console.warn('[SOCKET_SERVICE] Acces refuse. Arret des tentatives de connexion.');
        this.disconnect();
        return;
      }

      this.reconnectAttempts++;
      if (__DEV__) console.log(`[SOCKET_SERVICE] Tentative de reconnexion en arriere-plan... (${this.reconnectAttempts})`);
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
    } else {
      if (__DEV__) console.warn(`[SOCKET_SERVICE] Tentative d'emission (${event}) annulee car deconnecte.`);
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