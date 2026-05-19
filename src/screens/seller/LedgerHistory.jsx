// src/screens/seller/LedgerHistory.jsx
import React, { useState, useRef } from 'react';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  StatusBar,
  useColorScheme
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetMyLedgerQuery, useClearLedgerEntryMutation } from '../../store/api/marketplaceApiSlice';
import { useDispatch } from 'react-redux';
import { showToast, showErrorToast } from '../../store/slices/uiSlice';
import ConfirmModal from '../../components/ui/ConfirmModal';
import THEME from '../../theme/theme';

const LedgerHistory = ({ navigation }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { data, isLoading, refetch } = useGetMyLedgerQuery();
  const [clearEntry, { isLoading: isClearing }] = useClearLedgerEntryMutation();
  const [confirmData, setConfirmData] = React.useState({ visible: false, entryId: null, amount: 0 });

  const [showScrollTop, setShowScrollTop] = useState(false);
  const listRef = useRef(null);

  const handleScroll = (event) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > 150);
  };

  const scrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const entries = data?.data || [];

  const handleClearPayment = (entryId, amount) => {
    setConfirmData({ visible: true, entryId, amount });
  };

  const confirmClear = async () => {
    try {
      await clearEntry(confirmData.entryId).unwrap();
      dispatch(showToast({ type: 'success', title: 'Succès', message: 'La dette a été épongée.' }));
      setConfirmData({ ...confirmData, visible: false });
      refetch();
    } catch (err) {
      dispatch(showErrorToast({ message: 'Impossible de valider le paiement.' }));
      setConfirmData({ ...confirmData, visible: false });
    }
  };

  const renderEntry = ({ item }) => (
    <View style={[styles.entryCard, item.status === 'cleared' && styles.clearedCard]}>
      <View style={styles.entryHeader}>
        <View style={styles.driverInfo}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={20} color={THEME.COLORS.primary} />
          </View>
          <Text style={styles.driverName}>{item.driver?.name || 'Livreur'}</Text>
        </View>
        <Text style={styles.amount}>{item.amount} FCFA</Text>
      </View>

      <View style={styles.entryFooter}>
        <View>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          <Text style={styles.statusLabel}>
            Statut: <Text style={item.status === 'cleared' ? styles.statusOk : styles.statusPending}>
              {item.status === 'cleared' ? 'Payé' : 'En attente de cash'}
            </Text>
          </Text>
        </View>

        {item.status === 'pending' && (
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => handleClearPayment(item._id, item.amount)}
            disabled={isClearing}
          >
            <Text style={styles.actionBtnText}>Reçu</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
      
      <View style={[styles.header, { paddingTop: insets.top + THEME.SPACING.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Journal de Caisse</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          data={entries}
          renderItem={renderEntry}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="book-open-variant" size={64} color={THEME.COLORS.textTertiary} />
              <Text style={styles.emptyText}>Aucune transaction enregistrée</Text>
            </View>
          )}
        />
      )}

      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />

      <ConfirmModal 
        visible={confirmData.visible}
        onClose={() => setConfirmData({ ...confirmData, visible: false })}
        onConfirm={confirmClear}
        isLoading={isClearing}
        title="Confirmer le paiement"
        message={`Confirmez-vous avoir reçu ${confirmData.amount} FCFA ? Cette action est irréversible.`}
        confirmText="Oui, encaissé"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.xl,
    paddingVertical: THEME.SPACING.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.COLORS.glassSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: THEME.FONTS.sizes.h3,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  listContent: {
    padding: THEME.SPACING.xl,
  },
  entryCard: {
    backgroundColor: THEME.COLORS.glassSurface,
    borderRadius: THEME.BORDERS.radius.lg,
    padding: THEME.SPACING.lg,
    marginBottom: THEME.SPACING.md,
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  clearedCard: {
    opacity: 0.6,
    borderWidth: 0,
    backgroundColor: THEME.COLORS.overlay,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.SPACING.md,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.SPACING.sm,
  },
  driverName: {
    fontSize: THEME.FONTS.sizes.body,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.textPrimary,
  },
  amount: {
    fontSize: THEME.FONTS.sizes.body,
    fontWeight: THEME.FONTS.weights.bold,
    color: THEME.COLORS.primary,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: THEME.COLORS.border,
    paddingTop: THEME.SPACING.sm,
  },
  date: {
    fontSize: THEME.FONTS.sizes.micro,
    color: THEME.COLORS.textTertiary,
  },
  statusLabel: {
    fontSize: 10,
    color: THEME.COLORS.textSecondary,
    marginTop: 2,
  },
  statusOk: {
    color: THEME.COLORS.success,
    fontWeight: 'bold',
  },
  statusPending: {
    color: THEME.COLORS.warning,
    fontWeight: 'bold',
  },
  actionBtn: {
    backgroundColor: THEME.COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: THEME.BORDERS.radius.pill,
  },
  actionBtnText: {
    color: THEME.COLORS.textInverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: THEME.COLORS.textTertiary,
    marginTop: THEME.SPACING.lg,
  }
});

export default LedgerHistory;
