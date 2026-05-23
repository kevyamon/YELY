// src/screens/marketplace/ProductReviews.jsx
// ÉCRAN DES AVIS PRODUITS - Design Minimaliste & Industriel
// CSCSM Level: Bank Grade

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Dimensions,
  Image,
  ScrollView,
  Animated,
  Easing,
  TextInput
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  useGetProductReviewsQuery,
  useUpdateReviewMutation,
  useDeleteReviewMutation
} from '../../store/api/marketplaceApiSlice';
import { showToast } from '../../store/slices/uiSlice';
import THEME from '../../theme/theme';
import GlassCard from '../../components/ui/GlassCard';
import GlassModal from '../../components/ui/GlassModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';

const { height } = Dimensions.get('window');

const AnimatedStar = () => {
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const startRotation = () => {
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        rotateAnim.setValue(0);
      });
    };

    startRotation();
    const interval = setInterval(startRotation, 160000);
    return () => clearInterval(interval);
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <MaterialCommunityIcons name="star" size={14} color={THEME.COLORS.primary} />
    </Animated.View>
  );
};

const ProductReviews = ({ route, navigation }) => {
  const { productId, productName } = route.params;
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const currentUser = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

  const { data: reviewsData, isLoading, refetch } = useGetProductReviewsQuery(productId);
  const [updateReview, { isLoading: isUpdating }] = useUpdateReviewMutation();
  const [deleteReview, { isLoading: isDeleting }] = useDeleteReviewMutation();

  const reviews = reviewsData?.data || [];

  // State controls
  const [showScrollTop, setShowScrollTop] = useState(false);
  const flatListRef = useRef(null);

  // Full comment modal state
  const [selectedComment, setSelectedComment] = useState(null);
  const [showCommentModalScrollTop, setShowCommentModalScrollTop] = useState(false);
  const commentScrollRef = useRef(null);

  // Edit review state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  // Delete confirmation state
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [reviewToDeleteId, setReviewToDeleteId] = useState(null);

  const handleScroll = (event) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > 150);
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleOpenEdit = (review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editComment.trim()) {
      dispatch(showToast({ type: 'warning', title: 'Erreur', message: 'Le commentaire ne peut pas être vide.' }));
      return;
    }
    try {
      await updateReview({
        id: editingReview._id,
        rating: editRating,
        comment: editComment
      }).unwrap();
      setEditModalVisible(false);
      setEditingReview(null);
      dispatch(showToast({ type: 'success', title: 'Succès', message: 'Votre avis a été mis à jour.' }));
    } catch (err) {
      dispatch(showToast({ type: 'error', title: 'Erreur', message: err.data?.message || 'Impossible de mettre à jour.' }));
    }
  };

  const handleOpenDelete = (id) => {
    setReviewToDeleteId(id);
    setDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteReview(reviewToDeleteId).unwrap();
      setDeleteConfirmVisible(false);
      setReviewToDeleteId(null);
      dispatch(showToast({ type: 'success', title: 'Succès', message: 'Votre avis a été supprimé.' }));
    } catch (err) {
      setDeleteConfirmVisible(false);
      dispatch(showToast({ type: 'error', title: 'Erreur', message: err.data?.message || 'Impossible de supprimer.' }));
    }
  };

  const renderStars = (rating, size = 12) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <MaterialCommunityIcons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={size}
          color="#D4AF37"
        />
      );
    }
    return <View style={styles.starRow}>{stars}</View>;
  };

  const renderReviewItem = ({ item }) => {
    const isOwner = currentUser?._id === item.user?._id;
    const isLong = item.comment.length > 180;
    const displayedComment = isLong ? `${item.comment.slice(0, 175)}...` : item.comment;

    return (
      <GlassCard style={styles.reviewCard} padding={16}>
        <View style={styles.reviewHeader}>
          <View style={styles.userInfo}>
            {item.user?.profilePicture ? (
              <Image source={{ uri: item.user.profilePicture }} style={styles.userAvatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {item.user?.name ? item.user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{item.user?.name || 'Client Yély'}</Text>
              <Text style={styles.reviewDate}>
                {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            {renderStars(item.rating)}
          </View>
        </View>

        <Text style={styles.commentText}>{displayedComment}</Text>

        <View style={styles.reviewFooter}>
          {isLong ? (
            <TouchableOpacity
              style={styles.readMoreBtn}
              onPress={() => setSelectedComment(item.comment)}
            >
              <Text style={styles.readMoreText}>Lire plus</Text>
              <Ionicons name="chevron-forward" size={14} color={THEME.COLORS.primary} />
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {isOwner && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleOpenEdit(item)}
              >
                <MaterialCommunityIcons name="pencil-outline" size={16} color={THEME.COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { marginLeft: 10 }]}
                onPress={() => handleOpenDelete(item._id)}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={16} color={THEME.COLORS.danger} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </GlassCard>
    );
  };

  // Calcul du score moyen
  const avgScore = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <View style={[styles.container, { backgroundColor: THEME.COLORS.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>Avis clients</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{productName || 'Détails'}</Text>
        </View>
        <View style={styles.headerDummy} />
      </View>

      {/* SCORE CARD */}
      <View style={styles.scoreContainer}>
        <GlassCard style={styles.scoreCard} padding={20}>
          <View style={styles.scoreRow}>
            <View style={styles.avgBox}>
              <Text style={styles.avgText}>{avgScore}</Text>
              <View style={styles.starDisplay}>
                <AnimatedStar />
                <Text style={styles.outOfText}>/ 5</Text>
              </View>
            </View>
            <View style={styles.countBox}>
              <Text style={styles.countText}>{reviews.length} avis</Text>
              <Text style={styles.verifiedText}>100% vérifiés</Text>
            </View>
          </View>
        </GlassCard>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          data={reviews}
          renderItem={renderReviewItem}
          keyExtractor={item => item._id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          onRefresh={refetch}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="comment-question-outline" size={64} color={THEME.COLORS.textTertiary} />
              <Text style={styles.emptyText}>Aucun avis client laissé pour le moment</Text>
            </View>
          )}
        />
      )}

      {/* SCROLL TO TOP */}
      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />

      {/* DETAIL MODAL FOR LONG COMMENT */}
      <GlassModal
        visible={!!selectedComment}
        onClose={() => setSelectedComment(null)}
        position="center"
        closeOnBackdrop={true}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Ionicons name="document-text-outline" size={24} color={THEME.COLORS.primary} />
            <Text style={styles.modalTitle}>Avis Complet</Text>
          </View>

          <ScrollView
            ref={commentScrollRef}
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            onScroll={(e) => {
              setShowCommentModalScrollTop(e.nativeEvent.contentOffset.y > 100);
            }}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalDescText}>{selectedComment}</Text>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSelectedComment(null)}
            >
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>

          {showCommentModalScrollTop && (
            <TouchableOpacity
              style={styles.modalScrollTopBtn}
              onPress={() => commentScrollRef.current?.scrollTo({ y: 0, animated: true })}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-up" size={18} color="#000" />
            </TouchableOpacity>
          )}
        </View>
      </GlassModal>

      {/* EDIT MODAL */}
      <GlassModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        position="center"
        closeOnBackdrop={true}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <MaterialCommunityIcons name="pencil-outline" size={24} color={THEME.COLORS.primary} />
            <Text style={styles.modalTitle}>Modifier mon avis</Text>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Votre note :</Text>
            <View style={styles.ratingSelector}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setEditRating(star)}>
                  <MaterialCommunityIcons
                    name={star <= editRating ? "star" : "star-outline"}
                    size={36}
                    color="#D4AF37"
                    style={{ marginHorizontal: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Votre commentaire :</Text>
            <TextInput
              style={[
                styles.commentInput,
                {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                  color: THEME.COLORS.textPrimary
                }
              ]}
              multiline
              numberOfLines={6}
              maxLength={5000}
              placeholder="Écrivez votre commentaire ici..."
              placeholderTextColor={THEME.COLORS.textTertiary}
              value={editComment}
              onChangeText={setEditComment}
            />
            <Text style={styles.charCount}>{editComment.length} / 5000</Text>
          </ScrollView>

          <View style={styles.editFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit} disabled={isUpdating}>
              {isUpdating ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.saveBtnText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </GlassModal>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        visible={deleteConfirmVisible}
        onClose={() => setDeleteConfirmVisible(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Supprimer mon avis"
        message="Êtes-vous sûr de vouloir supprimer définitivement votre avis ? Cette action est irréversible."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.xl,
    paddingBottom: THEME.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)'
  },
  backBtn: { padding: 4 },
  headerTitleContainer: { flex: 1, alignItems: 'center', marginHorizontal: 16 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: THEME.COLORS.textPrimary },
  headerSubtitle: { fontSize: 12, color: THEME.COLORS.textSecondary, marginTop: 1 },
  headerDummy: { width: 32 },
  
  scoreContainer: { paddingHorizontal: THEME.SPACING.xl, marginTop: THEME.SPACING.lg },
  scoreCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)'
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avgBox: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  avgText: { fontSize: 32, fontWeight: '900', color: THEME.COLORS.textPrimary, lineHeight: 36 },
  starDisplay: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingBottom: 4 },
  outOfText: { fontSize: 14, color: THEME.COLORS.textSecondary, fontWeight: '700' },
  countBox: { alignItems: 'flex-end' },
  countText: { fontSize: 15, fontWeight: '800', color: THEME.COLORS.textPrimary },
  verifiedText: { fontSize: 11, color: THEME.COLORS.primary, fontWeight: '700', marginTop: 2 },

  listContent: { paddingHorizontal: THEME.SPACING.xl, paddingTop: THEME.SPACING.lg },
  reviewCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    marginBottom: THEME.SPACING.md
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  userAvatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)'
  },
  avatarText: { color: THEME.COLORS.primary, fontSize: 14, fontWeight: '800' },
  userDetails: { marginLeft: 10, flex: 1 },
  userName: { fontSize: 13, fontWeight: '800', color: THEME.COLORS.textPrimary },
  reviewDate: { fontSize: 10, color: THEME.COLORS.textTertiary, marginTop: 1 },
  headerRight: { alignItems: 'flex-end' },
  starRow: { flexDirection: 'row', gap: 1 },
  commentText: { fontSize: 13.5, color: THEME.COLORS.textSecondary, lineHeight: 20, marginBottom: 12 },
  
  reviewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  readMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  readMoreText: { color: THEME.COLORS.primary, fontWeight: '800', fontSize: 12 },
  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 4 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: THEME.SPACING.md, color: THEME.COLORS.textTertiary, fontSize: 14, textAlign: 'center' },

  // Modals styling
  modalContent: { maxHeight: height * 0.7, padding: 5 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)', paddingBottom: 15, marginBottom: 15 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: THEME.COLORS.textPrimary },
  modalScroll: { maxHeight: height * 0.45 },
  modalScrollContent: { paddingBottom: 20 },
  modalDescText: { fontSize: 14.5, color: THEME.COLORS.textSecondary, lineHeight: 22 },
  modalFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', paddingTop: 15, alignItems: 'center' },
  modalCloseBtn: { backgroundColor: THEME.COLORS.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20 },
  modalCloseText: { color: '#000000', fontWeight: 'bold', fontSize: 14 },
  modalScrollTopBtn: { position: 'absolute', bottom: 80, right: 15, width: 36, height: 36, borderRadius: 18, backgroundColor: THEME.COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },

  // Edit fields
  label: { fontSize: 13, fontWeight: '800', color: THEME.COLORS.textSecondary, marginBottom: 8, marginTop: 10 },
  ratingSelector: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  commentInput: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    height: 120,
    textAlignVertical: 'top'
  },
  charCount: { alignSelf: 'flex-end', fontSize: 10, color: THEME.COLORS.textTertiary, marginTop: 5, marginBottom: 10 },
  editFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', paddingTop: 15, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cancelBtnText: { color: THEME.COLORS.textSecondary, fontWeight: '700', fontSize: 13 },
  saveBtn: { backgroundColor: THEME.COLORS.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 18 },
  saveBtnText: { color: '#000', fontWeight: '800', fontSize: 13 }
});

export default ProductReviews;
