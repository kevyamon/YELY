// src/screens/admin/AdminRides.jsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ScrollToTopButton from '../../components/admin/ScrollToTopButton';
import { useGetAllRidesQuery, useToggleRideArchiveMutation } from '../../store/api/adminApiSlice';
import THEME from '../../theme/theme';

const RideCard = ({ ride, onToggleArchive }) => {
  const date = new Date(ride.createdAt).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return THEME.COLORS.success;
      case 'CANCELLED': return THEME.COLORS.danger;
      default: return THEME.COLORS.primary; 
    }
  };

  const isArchived = ride.isArchivedByAdmin;
  const price = ride.price || ride.proposedPrice || 0; 

  return (
    <View style={[styles.card, isArchived && styles.cardArchived]}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Ionicons name="time-outline" size={14} color={THEME.COLORS.textSecondary} />
          <Text style={styles.dateText}>{date}</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(ride.status) }]}>
              {ride.status ? ride.status.toUpperCase() : 'EN COURS'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.archiveButton} 
            onPress={() => onToggleArchive(ride._id, isArchived)}
          >
            <Ionicons name={isArchived ? "arrow-undo" : "archive"} size={20} color={THEME.COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.peopleContainer}>
        <View style={styles.personBox}>
          <Ionicons name="car-sport" size={20} color={THEME.COLORS.textSecondary} />
          <View style={styles.personInfo}>
            <Text style={styles.personRole}>Chauffeur</Text>
            <Text style={styles.personName}>{ride.driver?.name || 'Recherche'}</Text>
            <Text style={styles.personPhone}>{ride.driver?.phone || '-'}</Text>
          </View>
        </View>
        
        <View style={styles.personBox}>
          <Ionicons name="person" size={20} color={THEME.COLORS.textSecondary} />
          <View style={styles.personInfo}>
            <Text style={styles.personRole}>Passager</Text>
            <Text style={styles.personName}>{ride.rider?.name || 'Inconnu'}</Text>
            <Text style={styles.personPhone}>{ride.rider?.phone || '-'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routePoint}>
          <Ionicons name="location" size={16} color={THEME.COLORS.success} />
          <Text style={styles.routeText} numberOfLines={1}>De: {ride.origin?.address || 'Lieu de depart'}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routePoint}>
          <Ionicons name="flag" size={16} color={THEME.COLORS.danger} />
          <Text style={styles.routeText} numberOfLines={1}>A: {ride.destination?.address || 'Lieu d\'arrivee'}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.priceText}>{price} FCFA</Text>
      </View>
    </View>
  );
};

const AdminRides = () => {
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  
  const [page, setPage] = useState(1);
  const [isArchivedView, setIsArchivedView] = useState(false); 
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { data, isLoading, refetch, isFetching } = useGetAllRidesQuery({ page, limit: 50, isArchived: isArchivedView });
  const [toggleArchive] = useToggleRideArchiveMutation();

  const rides = data?.data?.rides || [];

  const handleToggleArchive = (rideId, isArchived) => {
    const action = isArchived ? 'desarchiver' : 'archiver';
    Alert.alert(
      "Confirmation",
      `Voulez-vous vraiment ${action} cette course ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Oui", 
          onPress: async () => {
            try {
              await toggleArchive(rideId).unwrap();
            } catch (error) {
              Alert.alert("Erreur", "Impossible de modifier la course.");
            }
          } 
        }
      ]
    );
  };

  const handleScroll = (event) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > 100);
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Historique Courses</Text>
          <Text style={styles.headerSubtitle}>Tracabilite globale de Mafere</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, !isArchivedView && styles.activeTab]} 
          onPress={() => setIsArchivedView(false)}
        >
          <Text style={[styles.tabText, !isArchivedView && styles.activeTabText]}>En cours / Recentes</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, isArchivedView && styles.activeTab]} 
          onPress={() => setIsArchivedView(true)}
        >
          <Text style={[styles.tabText, isArchivedView && styles.activeTabText]}>Archives</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={rides}
        keyExtractor={(item) => item._id.toString()}
        renderItem={({ item }) => <RideCard ride={item} onToggleArchive={handleToggleArchive} />}
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={isLoading || isFetching} onRefresh={refetch} tintColor={THEME.COLORS.primary} />
        }
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.emptyContainer}>
              <Ionicons name={isArchivedView ? "archive-outline" : "car-sport-outline"} size={60} color={THEME.COLORS.textSecondary} />
              <Text style={styles.emptyText}>Aucune course {isArchivedView ? 'archivee' : 'recente'}.</Text>
            </View>
          )
        }
      />

      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: THEME.COLORS.overlay, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15, padding: 5 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: THEME.COLORS.primary },
  headerSubtitle: { fontSize: 13, color: THEME.COLORS.textSecondary, marginTop: 2 },
  
  tabsContainer: { flexDirection: 'row', backgroundColor: THEME.COLORS.overlay, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: THEME.COLORS.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: THEME.COLORS.primary },
  tabText: { color: THEME.COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  activeTabText: { color: THEME.COLORS.primary },

  listContent: { padding: 15, paddingBottom: 100 },
  
  card: { backgroundColor: THEME.COLORS.overlay, borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: THEME.COLORS.border },
  cardArchived: { opacity: 0.8 }, 
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: THEME.COLORS.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  dateText: { color: THEME.COLORS.textSecondary, fontSize: 13, fontWeight: '500', marginLeft: 5 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  archiveButton: { padding: 4 },
  
  peopleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  personBox: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  personInfo: { marginLeft: 10 },
  personRole: { color: THEME.COLORS.textSecondary, fontSize: 11, textTransform: 'uppercase' },
  personName: { color: THEME.COLORS.textPrimary, fontSize: 14, fontWeight: 'bold' },
  personPhone: { color: THEME.COLORS.textSecondary, fontSize: 12 },
  
  routeContainer: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8, marginBottom: 15 },
  routePoint: { flexDirection: 'row', alignItems: 'center' },
  routeLine: { width: 2, height: 10, backgroundColor: THEME.COLORS.border, marginLeft: 7, marginVertical: 2 },
  routeText: { color: THEME.COLORS.textPrimary, fontSize: 13, marginLeft: 8, flex: 1 },
  
  cardFooter: { alignItems: 'flex-end' },
  priceText: { color: THEME.COLORS.primary, fontSize: 18, fontWeight: 'bold' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: THEME.COLORS.textSecondary, marginTop: 15, fontSize: 16 }
});

export default AdminRides; 