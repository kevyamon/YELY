// src/hooks/useSocket.js
// Hook React : Orchestrateur du Cycle de Vie Socket & Couplage Redux
// STANDARD: Industriel / Bank Grade

import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../services/socketService';
import { logout, selectIsAuthenticated, selectToken } from '../store/slices/authSlice';

const useSocket = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const token = useSelector(selectToken);
  const wasConnected = useRef(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Gestion de la reconnexion au retour en premier plan
    const handleAppStateChange = (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (isAuthenticated && token && !socketService.getIsConnected()) {
          console.log('[useSocket] Retour premier plan : Reconnexion forcée');
          socketService.connect(token);
          wasConnected.current = true;
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    if (isAuthenticated && token) {
      if (!wasConnected.current) {
        socketService.connect(token);
        wasConnected.current = true;

        const handleForceDisconnect = () => {
          dispatch(logout());
        };

        const handleConnectError = (error) => {
          if (['AUTH_FAILED', 'AUTH_REJECTED', 'AUTH_TOKEN_MISSING'].includes(error.message)) {
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

    return () => {
      subscription.remove();
    };

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