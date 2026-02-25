// src/hooks/useSocketEvents.js
// ÉCOUTEURS SOCKET - Gestion stricte des flux et Timeouts
// CSCSM Level: Bank Grade

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../services/socketService';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import {
  clearCurrentRide,
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

    // GESTION COMMUNE (Chauffeur & Passager)
    const handleRideCancelled = (data) => {
      dispatch(clearCurrentRide());
      dispatch(clearIncomingRide()); // Tue la modale chauffeur si elle est ouverte
      dispatch(showErrorToast({ 
        title: 'Course annulée', 
        message: data?.reason || 'Cette course a été annulée.' 
      }));
    };

    // ÉVÉNEMENTS REÇUS PAR LE CHAUFFEUR
    const handleNewRideRequest = (data) => {
      if (data && data.rideId && data.origin && data.destination) {
        dispatch(setIncomingRide(data));
      }
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

    // ÉVÉNEMENTS REÇUS PAR LE PASSAGER
    const handleDriverFound = (data) => {
      dispatch(updateRideStatus({ 
        status: 'negotiating', 
        driverName: data?.driverName || 'Un chauffeur' 
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

    const handleSearchTimeout = (data) => {
      dispatch(clearCurrentRide()); 
      dispatch(showErrorToast({ 
        title: 'Recherche expirée', 
        message: data?.message || "Aucun chauffeur n'est disponible dans votre zone." 
      }));
    };

    // ENREGISTREMENT DES ÉCOUTEURS
    socketService.on('new_ride_request', handleNewRideRequest);
    socketService.on('ride_taken_by_other', handleRideTakenByOther);
    socketService.on('ride_cancelled', handleRideCancelled);
    socketService.on('driver_found', handleDriverFound);
    socketService.on('price_proposal_received', handlePriceProposal);
    socketService.on('proposal_accepted', handleProposalAccepted);
    socketService.on('proposal_rejected', handleProposalRejected);
    socketService.on('ride_started', handleRideStarted);
    socketService.on('ride_completed', handleRideCompleted);
    socketService.on('search_timeout', handleSearchTimeout);

    // NETTOYAGE
    return () => {
      socketService.off('new_ride_request', handleNewRideRequest);
      socketService.off('ride_taken_by_other', handleRideTakenByOther);
      socketService.off('ride_cancelled', handleRideCancelled);
      socketService.off('driver_found', handleDriverFound);
      socketService.off('price_proposal_received', handlePriceProposal);
      socketService.off('proposal_accepted', handleProposalAccepted);
      socketService.off('proposal_rejected', handleProposalRejected);
      socketService.off('ride_started', handleRideStarted);
      socketService.off('ride_completed', handleRideCompleted);
      socketService.off('search_timeout', handleSearchTimeout);
    };
  }, [isAuthenticated, dispatch]);
};

export default useSocketEvents;