// src/hooks/useSocket.js
// Hook React : Orchestrateur du Cycle de Vie Socket & Couplage Redux

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../services/socketService';
import { logout, selectIsAuthenticated, selectToken } from '../store/slices/authSlice';

const useSocket = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const token = useSelector(selectToken);
  const wasConnected = useRef(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      if (!wasConnected.current) {
        socketService.connect(token);
        wasConnected.current = true;

        const handleForceDisconnect = () => {
          dispatch(logout());
        };

        const handleConnectError = (error) => {
          if (['AUTH_FAILED', 'AUTH_REJECTED', 'AUTH_TOKEN_MISSING'].includes(error.message)) {
            // On ne declenche plus de message d'erreur visuel ici.
            // Le systeme HTTP (apiSlice) gère dejà le rafraichissement du token en silence.
            // On se contente de fermer la socket proprement en attendant le nouveau token.
            socketService.disconnect();
            wasConnected.current = false;
          }
        };

        socketService.on('force_disconnect', handleForceDisconnect);
        socketService.on('connect_error', handleConnectError);
      }
    } 
    else {
      if (wasConnected.current) {
        socketService.disconnect();
        wasConnected.current = false;
      }
    }

  }, [isAuthenticated, token, dispatch]);

  return {
    isConnected: socketService.getIsConnected(),
    emit: (event, data) => socketService.emit(event, data),
    emitLocation: (coords) => socketService.emitLocation(coords),
    joinRoom: (roomId) => socketService.joinRoom(roomId),
    leaveRoom: (roomId) => socketService.leaveRoom(roomId),
  };
};

export default useSocket;