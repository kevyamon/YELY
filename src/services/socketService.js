// src/services/socketService.js
// Singleton Socket.io - Service Reseau Agnostique & Resilient (Mise a jour a chaud)
// CSCSM Level: Bank Grade

import { io } from 'socket.io-client';

const API_URL = process.env.EXPO_PUBLIC_API_URL || '';
const SOCKET_URL = API_URL.split('/api')[0];

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this._listeners = []; // Memoire persistante des ecouteurs
  }

  connect(token) {
    if (!token || !SOCKET_URL) {
      return; 
    }

    if (this.socket?.connected) {
      if (this.socket.auth.token !== token) {
        if (__DEV__) console.log('[SOCKET_SERVICE] Mise a jour du token sur un socket actif.');
        this.socket.auth.token = token;
        this.socket.disconnect().connect();
      }
      return;
    }

    if (this.socket) {
      this.socket.auth.token = token;
      this.socket.connect();
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

    // REBRANCHEMENT AUTOMATIQUE : On reconnecte tous les ecouteurs en attente
    this._listeners.forEach(({ event, callback }) => {
      this.socket.on(event, callback);
    });

    this._setupCoreListeners();
  }

  updateToken(newToken) {
    if (!newToken) return;
    
    if (!this.socket) {
      this.connect(newToken);
      return;
    }

    this.socket.auth.token = newToken;
    
    if (!this.socket.connected) {
      if (__DEV__) console.log('[SOCKET_SERVICE] Reconnexion avec le nouveau token...');
      this.socket.connect(); 
    } else {
      if (__DEV__) console.log('[SOCKET_SERVICE] Redemarrage a chaud avec le nouveau token...');
      this.socket.disconnect().connect();
    }
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
      if (this.socket) {
        this.socket.disconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      if (['AUTH_FAILED', 'AUTH_REJECTED', 'AUTH_TOKEN_MISSING'].includes(error.message)) {
        if (__DEV__) console.warn('[SOCKET_SERVICE] Acces refuse (Token expire). En attente du Refresh Token...');
        return;
      }

      this.reconnectAttempts++;
      if (__DEV__) console.log(`[SOCKET_SERVICE] Tentative de reconnexion en arriere-plan... (${this.reconnectAttempts})`);
    });
  }

  on(event, callback) {
    // SECURITE ABSOLUE : On memorise l'ecouteur meme si le socket n'est pas pret
    const exists = this._listeners.some(l => l.event === event && l.callback === callback);
    if (!exists) {
      this._listeners.push({ event, callback });
      if (this.socket) {
        this.socket.on(event, callback);
      }
    }
  }

  off(event, callback) {
    this._listeners = this._listeners.filter(
      (l) => !(l.event === event && l.callback === callback)
    );
    if (this.socket) {
      this.socket.off(event, callback);
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