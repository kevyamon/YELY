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

    const handleNewAdminReport = () => {
      dispatch(apiSlice.util.invalidateTags(['Report']));
      dispatch(showSuccessToast({
        title: 'Nouveau Signalement',
        message: 'Un utilisateur a soumis un nouveau problème.'
      }));
    };

    const handleReportResolved = () => {
      dispatch(apiSlice.util.invalidateTags(['Report', 'Notification']));
      dispatch(showSuccessToast({
        title: 'Signalement Résolu',
        message: 'L\'administration a traité votre signalement. Consultez vos notifications.'
      }));
    };

    socketService.on('new_admin_report', handleNewAdminReport);
    socketService.on('report_resolved', handleReportResolved);

    return () => {
      socketService.off('new_admin_report', handleNewAdminReport);
      socketService.off('report_resolved', handleReportResolved);
    };
  }, [isAuthenticated, dispatch]);
};

export default useReportSocketEvents;