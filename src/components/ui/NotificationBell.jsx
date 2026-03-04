// src/components/ui/NotificationBell.jsx
// COMPOSANT ISOLÉ - Cloche de notification intelligente et autonome
// CSCSM Level: Bank Grade

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useGetNotificationsQuery } from '../../store/api/notificationsApiSlice';
import THEME from '../../theme/theme';

const NotificationBell = ({ onPress, style }) => {
  // La logique est encapsulée ici : le composant gère son propre état de données
  const { data: notificationsData } = useGetNotificationsQuery({ page: 1 });
  
  const notificationsList = notificationsData?.data?.notifications || notificationsData?.notifications || [];
  const hasUnreadNotifications = notificationsList.some(n => n.isRead === false);

  return (
    <TouchableOpacity onPress={onPress} style={[styles.iconButton, style]}>
      <Ionicons name="notifications-outline" size={24} color={THEME.COLORS.champagneGold} />
      
      {hasUnreadNotifications && <View style={styles.badge} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.COLORS.glassSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.COLORS.danger,
    borderWidth: 1.5,
    borderColor: THEME.COLORS.glassSurface,
  }
});

export default NotificationBell;