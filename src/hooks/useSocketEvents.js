// src/hooks/useSocketEvents.js
// ÉCOUTEURS SOCKET - Gestion du Timeout (1m30) branchée !

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../services/socketService';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import {
  clearCurrentRide, // 🚀 NOUVEAU : Importé pour fermer la modale du passager
  clearIncomingRide,
  setCurrentRide,
  setIncomingRide,
  updateRideStatus
} from '../store/slices/rideSlice';
import { showErrorToast, showSuccessToast } from '../store/slices/uiSlice';

const useSocketEvents = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    // ==========================================
    // 🚖 ÉVÉNEMENTS REÇUS PAR LE CHAUFFEUR
    // ==========================================

    const handleNewRideRequest = (data) => {
      dispatch(setIncomingRide(data));
    };

    const handleRideTakenByOther = () => {
      dispatch(clearIncomingRide());
    };

    const handleProposalAccepted = (data) => {
      dispatch(setCurrentRide({ ...data, status: 'accepted' }));
      dispatch(clearIncomingRide());
      dispatch(showSuccessToast({ 
        title: 'Course confirmée', 
        message: 'Le client a accepté votre tarif. En route !' 
      }));
    };

    const handleProposalRejected = () => {
      dispatch(clearIncomingRide());
      dispatch(showErrorToast({ 
        title: 'Prix refusé', 
        message: 'Le client a décliné votre proposition.' 
      }));
    };

    // ==========================================
    // 👤 ÉVÉNEMENTS REÇUS PAR LE PASSAGER (CLIENT)
    // ==========================================

    const handleDriverFound = (data) => {
      dispatch(updateRideStatus({ 
        status: 'negotiating', 
        driverName: data.driverName 
      }));
    };

    const handlePriceProposal = (data) => {
      dispatch(setCurrentRide({ 
        proposedPrice: data.amount, 
        driverName: data.driverName, 
        status: 'negotiating' 
      }));
    };

    const handleRideStarted = (data) => {
      dispatch(updateRideStatus({ 
        status: 'ongoing', 
        startedAt: data.startedAt 
      }));
    };

    const handleRideCompleted = (data) => {
      dispatch(updateRideStatus({ 
        status: 'completed', 
        finalPrice: data.finalPrice 
      }));
    };

    // 🚀 NOUVEAU : Le passager écoute la fin du compte à rebours
    const handleSearchTimeout = (data) => {
      dispatch(clearCurrentRide()); // Ferme la salle d'attente (la modale)
      dispatch(showErrorToast({ 
        title: 'Recherche expirée', 
        message: data.message || "Aucun chauffeur n'est disponible pour le moment." 
      }));
    };

    // --- ABONNEMENTS ---
    socketService.on('new_ride_request', handleNewRideRequest);
    socketService.on('ride_taken_by_other', handleRideTakenByOther);
    socketService.on('driver_found', handleDriverFound);
    socketService.on('price_proposal_received', handlePriceProposal);
    socketService.on('proposal_accepted', handleProposalAccepted);
    socketService.on('proposal_rejected', handleProposalRejected);
    socketService.on('ride_started', handleRideStarted);
    socketService.on('ride_completed', handleRideCompleted);
    socketService.on('search_timeout', handleSearchTimeout); // 🚀 NOUVEAU BRANCHEMENT

    return () => {
      socketService.off('new_ride_request', handleNewRideRequest);
      socketService.off('ride_taken_by_other', handleRideTakenByOther);
      socketService.off('driver_found', handleDriverFound);
      socketService.off('price_proposal_received', handlePriceProposal);
      socketService.off('proposal_accepted', handleProposalAccepted);
      socketService.off('proposal_rejected', handleProposalRejected);
      socketService.off('ride_started', handleRideStarted);
      socketService.off('ride_completed', handleRideCompleted);
      socketService.off('search_timeout', handleSearchTimeout); // 🚀 NOUVEAU NETTOYAGE
    };
  }, [isAuthenticated, dispatch]);
};

export default useSocketEvents;