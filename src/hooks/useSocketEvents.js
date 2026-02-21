// src/hooks/useSocketEvents.js
// ÉCOUTEURS SOCKET - Séparation stricte des rôles (Rider vs Driver)

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../services/socketService';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import {
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
      // Le client a dit OUI. Le chauffeur passe en course active.
      dispatch(setCurrentRide({ ...data, status: 'accepted' }));
      dispatch(clearIncomingRide());
      dispatch(showSuccessToast({ 
        title: 'Course confirmée', 
        message: 'Le client a accepté votre tarif. En route !' 
      }));
    };

    const handleProposalRejected = () => {
      // Le client a dit NON. On nettoie juste l'écran du chauffeur.
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

    // --- ABONNEMENTS ---
    socketService.on('new_ride_request', handleNewRideRequest);
    socketService.on('ride_taken_by_other', handleRideTakenByOther);
    socketService.on('driver_found', handleDriverFound);
    socketService.on('price_proposal_received', handlePriceProposal);
    socketService.on('proposal_accepted', handleProposalAccepted);
    socketService.on('proposal_rejected', handleProposalRejected);
    socketService.on('ride_started', handleRideStarted);
    socketService.on('ride_completed', handleRideCompleted);

    return () => {
      socketService.off('new_ride_request', handleNewRideRequest);
      socketService.off('ride_taken_by_other', handleRideTakenByOther);
      socketService.off('driver_found', handleDriverFound);
      socketService.off('price_proposal_received', handlePriceProposal);
      socketService.off('proposal_accepted', handleProposalAccepted);
      socketService.off('proposal_rejected', handleProposalRejected);
      socketService.off('ride_started', handleRideStarted);
      socketService.off('ride_completed', handleRideCompleted);
    };
  }, [isAuthenticated, dispatch]);
};

export default useSocketEvents;