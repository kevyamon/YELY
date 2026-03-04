// src/hooks/useAdminSocketEvents.js
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../services/socketService';
import { logout, selectIsAuthenticated, updateSubscriptionStatus, updateUserInfo } from '../store/slices/authSlice';
import { showErrorToast, showSuccessToast } from '../store/slices/uiSlice';

const useAdminSocketEvents = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleUserRoleUpdated = (data) => {
      if (data?.newRole) {
        dispatch(updateUserInfo({ role: data.newRole }));
        dispatch(showSuccessToast({
          title: 'Droits d\'accès modifiés',
          message: `L'administration a mis à jour votre profil en tant que : ${data.newRole.toUpperCase()}.`
        }));
      }
    };

    const handleUserBanned = (data) => {
      dispatch(showErrorToast({
        title: 'Accès Révoqué',
        message: data?.reason || 'Votre compte a été suspendu par l\'administration.',
      }));
      setTimeout(() => {
        dispatch(logout());
      }, 3000);
    };

    const handleUserUnbanned = () => {
      dispatch(updateUserInfo({ isBanned: false }));
      dispatch(showSuccessToast({
        title: 'Accès Restauré',
        message: 'L\'administration a levé la restriction sur votre compte.',
      }));
    };

    const handleSubscriptionValidated = (data) => {
      dispatch(updateUserInfo({ 
        subscriptionStatus: 'active', 
        subscriptionExpiresAt: data?.expiresAt 
      }));
      dispatch(updateSubscriptionStatus({ isPending: false, isActive: true }));
      dispatch(showSuccessToast({
        title: 'Abonnement Validé',
        message: 'Félicitations, vous pouvez reprendre vos courses !'
      }));
    };

    const handleSubscriptionRejected = (data) => {
      dispatch(updateUserInfo({ subscriptionStatus: 'inactive' }));
      dispatch(updateSubscriptionStatus({ isPending: false, isActive: false }));
      dispatch(showErrorToast({
        title: 'Paiement Refusé',
        message: data?.reason || 'Votre preuve de paiement a été rejetée.'
      }));
    };

    // ÉCOUTEUR : Changement de la politique de distribution des validations
    const handleLoadReduceUpdated = (data) => {
      dispatch(showSuccessToast({
        title: 'Système mis à jour',
        message: data?.isLoadReduced 
          ? 'La répartition de charge (3 par 3) est maintenant ACTIVÉE.' 
          : 'La répartition de charge est DÉSACTIVÉE.',
      }));
    };

    socketService.on('user_role_updated', handleUserRoleUpdated);
    socketService.on('user_banned', handleUserBanned);
    socketService.on('user_unbanned', handleUserUnbanned);
    socketService.on('subscription_validated', handleSubscriptionValidated);
    socketService.on('subscription_rejected', handleSubscriptionRejected);
    socketService.on('load_reduce_updated', handleLoadReduceUpdated);

    return () => {
      socketService.off('user_role_updated', handleUserRoleUpdated);
      socketService.off('user_banned', handleUserBanned);
      socketService.off('user_unbanned', handleUserUnbanned);
      socketService.off('subscription_validated', handleSubscriptionValidated);
      socketService.off('subscription_rejected', handleSubscriptionRejected);
      socketService.off('load_reduce_updated', handleLoadReduceUpdated);
    };
  }, [isAuthenticated, dispatch]);
};

export default useAdminSocketEvents;