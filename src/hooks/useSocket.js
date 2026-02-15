// src/hooks/useSocket.js
// Hook de gestion du cycle de vie du Socket

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import socketService from '../services/socketService';
import { selectIsAuthenticated, selectToken } from '../store/slices/authSlice';

const useSocket = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const token = useSelector(selectToken);
  const wasConnected = useRef(false);

  useEffect(() => {
    // 1. Connexion si auth valide
    if (isAuthenticated && token) {
      if (!wasConnected.current) {
        socketService.connect(token);
        wasConnected.current = true;
      }
    } 
    // 2. Déconnexion si logout
    else {
      if (wasConnected.current) {
        socketService.disconnect();
        wasConnected.current = false;
      }
    }

    // 3. Cleanup au démontage du composant racine
    return () => {
      // On laisse la connexion active tant que l'app tourne, 
      // sauf changement explicite d'état (logout)
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