// src/hooks/useReportSocketEvents.js
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../services/socketService';
import { apiSlice } from '../store/slices/apiSlice';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import { showSuccessToast } from '../store/slices/uiSlice';

const useReportSocketEvents = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    // CORRECTION SENIOR : Suppression de l'écouteur new_admin_report d'ici.
    // L'événement a été transféré dans useAdminSocketEvents.js pour un cloisonnement parfait.

    const handleReportResolved = () => {
      dispatch(apiSlice.util.invalidateTags(['Report', 'Notification']));
      dispatch(showSuccessToast({
        title: 'Signalement Résolu',
        message: 'L\'administration a traité votre signalement. Consultez vos notifications.'
      }));
    };

    socketService.on('report_resolved', handleReportResolved);

    return () => {
      socketService.off('report_resolved', handleReportResolved);
    };
  }, [isAuthenticated, dispatch]);
};

export default useReportSocketEvents;