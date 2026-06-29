import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  callState: 'idle', // 'idle' | 'calling' | 'ringing' | 'connected' | 'ended'
  targetUserId: null,
  targetName: '',
  targetAvatar: '',
  targetPhone: '',
  isIncoming: false,
  callDuration: 0,
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    startCall: (state, action) => {
      state.callState = 'calling';
      state.targetUserId = action.payload.targetUserId;
      state.targetName = action.payload.targetName;
      state.targetAvatar = action.payload.targetAvatar;
      state.targetPhone = action.payload.targetPhone;
      state.isIncoming = false;
      state.callDuration = 0;
    },
    receiveCall: (state, action) => {
      state.callState = 'ringing';
      state.targetUserId = action.payload.callerId;
      state.targetName = action.payload.callerName;
      state.targetAvatar = action.payload.callerAvatar;
      state.targetPhone = action.payload.callerPhone;
      state.isIncoming = true;
      state.callDuration = 0;
    },
    acceptCall: (state) => {
      state.callState = 'connected';
    },
    updateDuration: (state, action) => {
      state.callDuration = action.payload;
    },
    endCall: (state) => {
      state.callState = 'idle';
      state.targetUserId = null;
      state.targetName = '';
      state.targetAvatar = '';
      state.targetPhone = '';
      state.isIncoming = false;
      state.callDuration = 0;
    }
  }
});

export const { startCall, receiveCall, acceptCall, updateDuration, endCall } = callSlice.actions;

export const selectCallState = (state) => state.call.callState;
export const selectCallInfo = (state) => state.call;

export default callSlice.reducer;
