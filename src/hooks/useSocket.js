// src/hooks/useSocket.js
// Gère la connexion/déconnexion du socket selon l'état d'authentification

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import socketService from '../services/socketService';
import { selectIsAuthenticated, selectToken } from '../store/slices/authSlice';

const useSocket = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const token = useSelector(selectToken);
  const wasConnected = useRef(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      // Connecter le socket si authentifié
      if (!wasConnected.current) {
        console.log('[useSocket] Authentifié → connexion socket');
        socketService.connect(token);
        wasConnected.current = true;
      }
    } else {
      // Déconnecter le socket si pas authentifié
      if (wasConnected.current) {
        console.log('[useSocket] Déconnecté → fermeture socket');
        socketService.disconnect();
        wasConnected.current = false;
      }
    }

    // Cleanup à la destruction du composant
    return () => {
      if (wasConnected.current) {
        socketService.disconnect();
        wasConnected.current = false;
      }
    };
  }, [isAuthenticated, token]);

  return {
    isConnected: socketService.getIsConnected(),
    emit: (event, data) => socketService.emit(event, data),
    emitLocation: (coords) => socketService.emitLocation(coords),
    joinRoom: (roomId) => socketService.joinRoom(roomId),
    leaveRoom: (roomId) => socketService.leaveRoom(roomId),
  };
};

export default useSocket;