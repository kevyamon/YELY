// src/screens/notifications/NotificationsScreen.jsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GlassCard from '../../components/ui/GlassCard';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { useGetNotificationsQuery, useMarkAsReadMutation } from '../../store/api/notificationsApiSlice';
import THEME from '../../theme/theme';

const NOTIF_ICONS = {
  SUBSCRIPTION: { icon: 'card', color: THEME.COLORS.primary },
  RIDE: { icon: 'car', color: THEME.COLORS.info },
  SYSTEM: { icon: 'notifications', color: THEME.COLORS.textSecondary },
  PAYMENT: { icon: 'cash', color: THEME.COLORS.success },
};

const NotificationsScreen = ({ navigation }) => {
  const { data, isLoading, refetch, isFetching } = useGetNotificationsQuery({ page: 1 });
  const [markRead] = useMarkAsReadMutation();

  const notifications = data?.data?.notifications || [];

  const handleRead = (id) => markRead(id);

  const renderItem = ({ item }) => {
    const config = NOTIF_ICONS[item.type] || NOTIF_ICONS.SYSTEM;
    
    return (
      <TouchableOpacity onPress={() => handleRead(item._id)} activeOpacity={0.8}>
        <GlassCard style={[styles.card, !item.isRead && styles.unreadCard]}>
          <View style={[styles.iconBox, { backgroundColor: config.color + '20' }]}>
            <Ionicons name={config.icon} size={24} color={config.color} />
          </View>
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
            <Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
          <Text style={styles.headerTitle}>Notifications</Text>
        </TouchableOpacity>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={() => markRead('all')}>
            <Text style={styles.markAll}>Tout lire</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={THEME.COLORS.primary} size="large" /></View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={64} color={THEME.COLORS.textTertiary} />
          <Text style={styles.emptyText}>Aucune notification pour le moment.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={isFetching}
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: THEME.COLORS.primary, fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  markAll: { color: THEME.COLORS.textSecondary, fontSize: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { flexDirection: 'row', padding: 15, marginBottom: 12, alignItems: 'center' },
  unreadCard: { borderColor: THEME.COLORS.primary, borderWidth: 1 },
  iconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  content: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { color: THEME.COLORS.textPrimary, fontSize: 16, fontWeight: 'bold', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.COLORS.primary },
  message: { color: THEME.COLORS.textSecondary, fontSize: 14, lineHeight: 20 },
  time: { color: THEME.COLORS.textTertiary, fontSize: 11, marginTop: 8 },
  emptyText: { color: THEME.COLORS.textSecondary, marginTop: 20, fontSize: 16 }
});

export default NotificationsScreen;