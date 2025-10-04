import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MapPin,
  Flag,
  Calendar,
  Clock,
  DollarSign,
  Star,
  X,
  Navigation,
  ChevronRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

interface Trip {
  id: string;
  date: Date;
  pickup: string;
  destination: string;
  distance: number;
  duration: number;
  fare: number;
  vehicleType: string;
  paymentMethod: string;
  driverName: string;
  driverRating: number;
  status: 'completed' | 'cancelled';
}

// Mock data
const MOCK_TRIPS: Trip[] = [
  {
    id: '1',
    date: new Date('2024-10-03T14:30:00'),
    pickup: 'Home, Hamra Street',
    destination: 'AUB, Bliss Street',
    distance: 2.5,
    duration: 15,
    fare: 12500,
    vehicleType: 'Economy',
    paymentMethod: 'Cash',
    driverName: 'Fatima Khalil',
    driverRating: 4.9,
    status: 'completed',
  },
  {
    id: '2',
    date: new Date('2024-10-02T09:15:00'),
    pickup: 'Downtown, Saifi Village',
    destination: 'ABC Mall, Achrafieh',
    distance: 4.2,
    duration: 22,
    fare: 18000,
    vehicleType: 'Comfort',
    paymentMethod: 'Card',
    driverName: 'Nour Mansour',
    driverRating: 4.7,
    status: 'completed',
  },
  {
    id: '3',
    date: new Date('2024-10-01T18:45:00'),
    pickup: 'Verdun, Commodore Hotel',
    destination: 'Beirut Airport',
    distance: 8.5,
    duration: 35,
    fare: 32000,
    vehicleType: 'Premium',
    paymentMethod: 'Wallet',
    driverName: 'Ahmad Hassan',
    driverRating: 4.8,
    status: 'completed',
  },
  {
    id: '4',
    date: new Date('2024-09-30T12:00:00'),
    pickup: 'Raouche, Pigeon Rocks',
    destination: 'Jnah, Burj al-Barajneh',
    distance: 5.1,
    duration: 28,
    fare: 0,
    vehicleType: 'Economy',
    paymentMethod: 'Cash',
    driverName: 'Layla Ibrahim',
    driverRating: 4.6,
    status: 'cancelled',
  },
];

export default function TripHistoryScreen() {
  const router = useRouter();
  const [trips] = useState<Trip[]>(MOCK_TRIPS);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'cancelled'>('all');

  const filteredTrips = trips.filter(trip => 
    filterStatus === 'all' ? true : trip.status === filterStatus
  );

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const renderTripItem = ({ item }: { item: Trip }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => setSelectedTrip(item)}
      activeOpacity={0.7}
    >
      <View style={styles.tripHeader}>
        <View style={styles.dateContainer}>
          <Calendar size={16} color="#666" />
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          <Text style={styles.timeText}>{formatTime(item.date)}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          item.status === 'completed' ? styles.statusCompleted : styles.statusCancelled
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'completed' ? styles.statusCompletedText : styles.statusCancelledText
          ]}>
            {item.status === 'completed' ? 'Completed' : 'Cancelled'}
          </Text>
        </View>
      </View>

      <View style={styles.tripRoute}>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: '#FF5252' }]} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.pickup}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: '#9C27B0' }]} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.destination}
          </Text>
        </View>
      </View>

      <View style={styles.tripFooter}>
        <View style={styles.tripStats}>
          <View style={styles.statItem}>
            <Navigation size={14} color="#666" />
            <Text style={styles.statText}>{item.distance} km</Text>
          </View>
          <View style={styles.statItem}>
            <Clock size={14} color="#666" />
            <Text style={styles.statText}>{item.duration} min</Text>
          </View>
        </View>
        <Text style={styles.fareText}>
          {item.status === 'completed' ? `${item.fare.toLocaleString()} LBP` : 'Cancelled'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip History</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === 'all' && styles.filterButtonActive
          ]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[
            styles.filterText,
            filterStatus === 'all' && styles.filterTextActive
          ]}>
            All ({trips.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === 'completed' && styles.filterButtonActive
          ]}
          onPress={() => setFilterStatus('completed')}
        >
          <Text style={[
            styles.filterText,
            filterStatus === 'completed' && styles.filterTextActive
          ]}>
            Completed ({trips.filter(t => t.status === 'completed').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === 'cancelled' && styles.filterButtonActive
          ]}
          onPress={() => setFilterStatus('cancelled')}
        >
          <Text style={[
            styles.filterText,
            filterStatus === 'cancelled' && styles.filterTextActive
          ]}>
            Cancelled ({trips.filter(t => t.status === 'cancelled').length})
          </Text>
        </TouchableOpacity>
      </View>

      {filteredTrips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MapPin size={64} color="#CCC" />
          <Text style={styles.emptyText}>No trips found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTrips}
          keyExtractor={(item) => item.id}
          renderItem={renderTripItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Trip Details Modal */}
      <Modal visible={!!selectedTrip} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trip Details</Text>
              <TouchableOpacity onPress={() => setSelectedTrip(null)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedTrip && (
              <View style={styles.detailsContent}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Trip Information</Text>
                  <View style={styles.detailRow}>
                    <Calendar size={20} color="#666" />
                    <Text style={styles.detailText}>
                      {selectedTrip.date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={20} color="#666" />
                    <Text style={styles.detailText}>{formatTime(selectedTrip.date)}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Route</Text>
                  <View style={styles.detailRoute}>
                    <View style={styles.detailRoutePoint}>
                      <MapPin size={20} color="#FF5252" />
                      <View style={styles.detailRouteInfo}>
                        <Text style={styles.detailRouteLabel}>Pickup</Text>
                        <Text style={styles.detailRouteText}>{selectedTrip.pickup}</Text>
                      </View>
                    </View>
                    <View style={styles.detailRouteLine} />
                    <View style={styles.detailRoutePoint}>
                      <Flag size={20} color="#9C27B0" />
                      <View style={styles.detailRouteInfo}>
                        <Text style={styles.detailRouteLabel}>Destination</Text>
                        <Text style={styles.detailRouteText}>{selectedTrip.destination}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Trip Stats</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statsBox}>
                      <Navigation size={24} color="#007AFF" />
                      <Text style={styles.statsValue}>{selectedTrip.distance} km</Text>
                      <Text style={styles.statsLabel}>Distance</Text>
                    </View>
                    <View style={styles.statsBox}>
                      <Clock size={24} color="#34C759" />
                      <Text style={styles.statsValue}>{selectedTrip.duration} min</Text>
                      <Text style={styles.statsLabel}>Duration</Text>
                    </View>
                  </View>
                </View>

                {selectedTrip.status === 'completed' && (
                  <>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Driver</Text>
                      <View style={styles.driverInfo}>
                        <View style={styles.driverAvatar}>
                          <Text style={styles.driverInitial}>
                            {selectedTrip.driverName.charAt(0)}
                          </Text>
                        </View>
                        <View style={styles.driverDetails}>
                          <Text style={styles.driverName}>{selectedTrip.driverName}</Text>
                          <View style={styles.ratingContainer}>
                            <Star size={16} color="#FFB800" fill="#FFB800" />
                            <Text style={styles.ratingText}>{selectedTrip.driverRating}</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Payment</Text>
                      <View style={styles.paymentInfo}>
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Vehicle Type</Text>
                          <Text style={styles.paymentValue}>{selectedTrip.vehicleType}</Text>
                        </View>
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Payment Method</Text>
                          <Text style={styles.paymentValue}>{selectedTrip.paymentMethod}</Text>
                        </View>
                        <View style={styles.paymentDivider} />
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentTotalLabel}>Total Fare</Text>
                          <Text style={styles.paymentTotalValue}>
                            {selectedTrip.fare.toLocaleString()} LBP
                          </Text>
                        </View>
                      </View>
                    </View>
                  </>
                )}

                {selectedTrip.status === 'cancelled' && (
                  <View style={styles.cancelledNotice}>
                    <Text style={styles.cancelledText}>This trip was cancelled</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  list: {
    padding: 16,
  },
  tripCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 14,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#E8F5E9',
  },
  statusCancelled: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusCompletedText: {
    color: '#34C759',
  },
  statusCancelledText: {
    color: '#FF3B30',
  },
  tripRoute: {
    marginBottom: 12,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#E0E0E0',
    marginLeft: 3,
    marginVertical: 2,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  fareText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  detailsContent: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  detailRoute: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  detailRoutePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailRouteInfo: {
    flex: 1,
  },
  detailRouteLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailRouteText: {
    fontSize: 14,
    color: '#333',
  },
  detailRouteLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginLeft: 9,
    marginVertical: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statsBox: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: '#666',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  paymentInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  paymentTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  cancelledNotice: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelledText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
  },
});