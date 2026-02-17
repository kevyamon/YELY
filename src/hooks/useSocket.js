// src/hooks/useSocket.js
// Hook React : Orchestrateur du Cycle de Vie Socket & Couplage Redux
// CSCSM Level: Bank Grade

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../services/socketService';
import { logout, selectIsAuthenticated, selectToken } from '../store/slices/authSlice';
import { showErrorToast } from '../store/slices/uiSlice';

const useSocket = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const token = useSelector(selectToken);
  const wasConnected = useRef(false);

  useEffect(() => {
    // 1. Connexion si auth valide
    if (isAuthenticated && token) {
      if (!wasConnected.current) {
        socketService.connect(token);
        wasConnected.current = true;

        // 🛡️ CÂBLAGE REDUX SÉCURISÉ : Écoute des rejets d'authentification
        const handleForceDisconnect = (data) => {
          const message = data?.message || 'Connexion interrompue par mesure de sécurité.';
          dispatch(showErrorToast({ title: 'Accès Révoqué', message }));
          dispatch(logout()); // Déconnexion propre de l'app
        };

        const handleConnectError = (error) => {
          if (['AUTH_FAILED', 'AUTH_REJECTED', 'AUTH_TOKEN_MISSING'].includes(error.message)) {
            dispatch(showErrorToast({ title: 'Session expirée', message: 'Veuillez vous reconnecter.' }));
            dispatch(logout());
          }
        };

        socketService.on('force_disconnect', handleForceDisconnect);
        socketService.on('connect_error', handleConnectError);
      }
    } 
    // 2. Déconnexion si logout
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