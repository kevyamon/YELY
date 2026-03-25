// src/screens/admin/AdminRides.jsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGetAllRidesQuery } from '../../store/api/adminApiSlice';
import THEME from '../../theme/theme';

const RideCard = ({ ride }) => {
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

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}><Ionicons name="time-outline" size={14} /> {date}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(ride.status) }]}>
            {ride.status || 'EN COURS'}
          </Text>
        </View>
      </View>

      <View style={styles.peopleContainer}>
        <View style={styles.personBox}>
          <Ionicons name="car-sport" size={20} color={THEME.COLORS.textSecondary} />
          <View style={styles.personInfo}>
            <Text style={styles.personRole}>Chauffeur</Text>
            <Text style={styles.personName}>{ride.driver?.name || 'Inconnu'}</Text>
            <Text style={styles.personPhone}>{ride.driver?.phone || 'N/A'}</Text>
          </View>
        </View>
        
        <View style={styles.personBox}>
          <Ionicons name="person" size={20} color={THEME.COLORS.textSecondary} />
          <View style={styles.personInfo}>
            <Text style={styles.personRole}>Passager</Text>
            <Text style={styles.personName}>{ride.rider?.name || 'Inconnu'}</Text>
            <Text style={styles.personPhone}>{ride.rider?.phone || 'N/A'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routePoint}>
          <Ionicons name="location" size={16} color={THEME.COLORS.success} />
          <Text style={styles.routeText} numberOfLines={1}>De: {ride.pickup?.address || 'Adresse de départ'}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routePoint}>
          <Ionicons name="flag" size={16} color={THEME.COLORS.danger} />
          <Text style={styles.routeText} numberOfLines={1}>À: {ride.dropoff?.address || 'Adresse d\'arrivée'}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.priceText}>{ride.fare || 0} FCFA</Text>
      </View>
    </View>
  );
};

const AdminRides = () => {
  const navigation = useNavigation();
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch, isFetching } = useGetAllRidesQuery({ page, limit: 50 });

  const rides = data?.data?.rides || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={THEME.COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Historique Courses</Text>
          <Text style={styles.headerSubtitle}>Traçabilité globale de Maféré</Text>
        </View>
      </View>

      <FlatList
        data={rides}
        keyExtractor={(item) => item._id.toString()}
        renderItem={({ item }) => <RideCard ride={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading || isFetching} onRefresh={refetch} tintColor={THEME.COLORS.primary} />
        }
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="car-sport-outline" size={60} color={THEME.COLORS.textSecondary} />
              <Text style={styles.emptyText}>Aucune course enregistrée pour le moment.</Text>
            </View>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.COLORS.background },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: THEME.COLORS.overlay, flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15, padding: 5 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: THEME.COLORS.primary },
  headerSubtitle: { fontSize: 13, color: THEME.COLORS.textSecondary, marginTop: 2 },
  listContent: { padding: 15, paddingBottom: 100 },
  
  card: { backgroundColor: THEME.COLORS.overlay, borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: THEME.COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: THEME.COLORS.border },
  dateText: { color: THEME.COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  
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