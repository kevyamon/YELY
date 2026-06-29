import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../services/socketService';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import { receiveCall, acceptCall, endCall } from '../store/slices/callSlice';
import { showErrorToast } from '../store/slices/uiSlice';

const useCallSocketEvents = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVoiceCallReceived = (data) => {
      dispatch(receiveCall(data));
    };

    const handleVoiceCallAccepted = () => {
      dispatch(acceptCall());
    };

    const handleVoiceCallDeclined = () => {
      dispatch(endCall());
      dispatch(showErrorToast({
        title: 'Appel refusé',
        message: 'L\'interlocuteur a décliné l\'appel.'
      }));
    };

    const handleVoiceCallEnded = () => {
      dispatch(endCall());
    };

    socketService.on('voice_call_received', handleVoiceCallReceived);
    socketService.on('voice_call_accepted', handleVoiceCallAccepted);
    socketService.on('voice_call_declined', handleVoiceCallDeclined);
    socketService.on('voice_call_ended', handleVoiceCallEnded);

    return () => {
      socketService.off('voice_call_received', handleVoiceCallReceived);
      socketService.off('voice_call_accepted', handleVoiceCallAccepted);
      socketService.off('voice_call_declined', handleVoiceCallDeclined);
      socketService.off('voice_call_ended', handleVoiceCallEnded);
    };
  }, [isAuthenticated, dispatch]);
};

export default useCallSocketEvents;
