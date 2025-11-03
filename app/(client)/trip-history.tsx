import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MapPin,
  Flag,
  Calendar,
  Clock,
  Navigation,
  Star,
  X,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/config';

interface Trip {
  id: number;
  status: 'completed' | 'cancelled';
  fare: number;
  distance: number;
  duration: number;
  is_pool: boolean;
  origin: {
    lat: number;
    lng: number;
    address: string;
  };
  destination: {
    lat: number;
    lng: number;
    address: string;
  };
  driver: {
    id: number;
    vehicle_type: string;
    vehicle_number: string;
    license_number: string;
    rating: number;
    user: {
      id: number;
      name: string;
      phone: string | null;
      email: string | null;
      gender: string;
      profile_photo: string | null;
    };
  } | null;
  route_info: {
    phase: string;
    description: string;
    trip_route: {
      distance_meters: number;
      distance_km: number;
      duration_seconds: number;
      duration_minutes: number;
      duration_text: string;
    };
  };
  passenger: {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    gender: string;
    profile_photo: string | null;
  };
  timestamps: {
    requested_at: string;
    accepted_at: string | null;
    started_at: string | null;
    arrived_at: string | null;
    completed_at: string | null;
    cancelled_at: string | null;
  };
  cancellation?: {
    reason: string | null;
    note: string | null;
    cancelled_by: number | null;
  };
  final_fare: number | null;
  payment_status: string;
}

export default function TripHistoryScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const isMountedRef = useRef(true);

  // Fetch trips from API
  const fetchTrips = useCallback(async (page: number = 1, isRefresh: boolean = false) => {
    try {
      const authToken = await AsyncStorage.getItem('token');
      if (!authToken) {
        console.error('No auth token found');
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setLoading(true);
      }

      const response = await fetch(`${API_BASE_URL}/passenger/rides/history?page=${page}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!isMountedRef.current) return;

      const fetchedTrips = result.data || [];
      
      if (page === 1 || isRefresh) {
        setTrips(fetchedTrips);
      } else {
        setTrips(prev => [...prev, ...fetchedTrips]);
      }

      // Check if there are more pages
      setHasMore(result.meta?.current_page < result.meta?.last_page);
      setCurrentPage(result.meta?.current_page || 1);

    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchTrips(1);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchTrips]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    fetchTrips(1, true);
  }, [fetchTrips]);

  // Load more trips
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchTrips(currentPage + 1);
    }
  }, [loading, hasMore, currentPage, fetchTrips]);

  // Filter trips
  const filteredTrips = trips.filter(trip =>
    filterStatus === 'all' ? true : trip.status === filterStatus
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
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
          <Calendar size={16} color="#ec4899" />
          <Text style={styles.dateText}>{formatDate(item.timestamps.requested_at)}</Text>
          <Text style={styles.timeText}>{formatTime(item.timestamps.requested_at)}</Text>
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
          <View style={[styles.routeDot, { backgroundColor: '#ec4899' }]} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.origin.address}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: '#831843' }]} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.destination.address}
          </Text>
        </View>
      </View>
      <View style={styles.tripFooter}>
        <View style={styles.tripStats}>
          <View style={styles.statItem}>
            <Navigation size={14} color="#ec4899" />
            <Text style={styles.statText}>{item.route_info.trip_route.distance_km} km</Text>
          </View>
          <View style={styles.statItem}>
            <Clock size={14} color="#ec4899" />
            <Text style={styles.statText}>{Math.round(item.route_info.trip_route.duration_minutes)} min</Text>
          </View>
        </View>
        <Text style={styles.fareText}>
          {item.status === 'completed' ? `€${item.final_fare?.toFixed(2) || item.fare.toFixed(2)}` : 'Cancelled'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#ec4899" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#fdf2f8', '#fce7f3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#831843" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip History</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>
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
      {loading && trips.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ec4899" />
          <Text style={styles.loadingText}>Loading trips...</Text>
        </View>
      ) : filteredTrips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MapPin size={64} color="#f472b6" />
          <Text style={styles.emptyText}>No trips found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTrips}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTripItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#ec4899']}
              tintColor="#ec4899"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      )}
      <Modal visible={!!selectedTrip} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#fdf2f8', '#fce7f3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>Trip Details</Text>
              <TouchableOpacity onPress={() => setSelectedTrip(null)}>
                <X size={24} color="#831843" />
              </TouchableOpacity>
            </LinearGradient>
            {selectedTrip && (
              <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Trip Information</Text>
                  <View style={styles.detailRow}>
                    <Calendar size={20} color="#ec4899" />
                    <Text style={styles.detailText}>
                      {new Date(selectedTrip.timestamps.requested_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={20} color="#ec4899" />
                    <Text style={styles.detailText}>{formatTime(selectedTrip.timestamps.requested_at)}</Text>
                  </View>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Route</Text>
                  <View style={styles.detailRoute}>
                    <View style={styles.detailRoutePoint}>
                      <MapPin size={20} color="#ec4899" />
                      <View style={styles.detailRouteInfo}>
                        <Text style={styles.detailRouteLabel}>Pickup</Text>
                        <Text style={styles.detailRouteText}>{selectedTrip.origin.address}</Text>
                      </View>
                    </View>
                    <View style={styles.detailRouteLine} />
                    <View style={styles.detailRoutePoint}>
                      <Flag size={20} color="#831843" />
                      <View style={styles.detailRouteInfo}>
                        <Text style={styles.detailRouteLabel}>Destination</Text>
                        <Text style={styles.detailRouteText}>{selectedTrip.destination.address}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Trip Stats</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statsBox}>
                      <Navigation size={24} color="#ec4899" />
                      <Text style={styles.statsValue}>{selectedTrip.route_info.trip_route.distance_km} km</Text>
                      <Text style={styles.statsLabel}>Distance</Text>
                    </View>
                    <View style={styles.statsBox}>
                      <Clock size={24} color="#ec4899" />
                      <Text style={styles.statsValue}>{Math.round(selectedTrip.route_info.trip_route.duration_minutes)} min</Text>
                      <Text style={styles.statsLabel}>Duration</Text>
                    </View>
                  </View>
                </View>
                {selectedTrip.status === 'completed' && selectedTrip.driver && (
                  <>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Driver</Text>
                      <View style={styles.driverInfo}>
                        <View style={styles.driverAvatar}>
                          <Text style={styles.driverInitial}>
                            {selectedTrip.driver.user.name.charAt(0)}
                          </Text>
                        </View>
                        <View style={styles.driverDetails}>
                          <Text style={styles.driverName}>{selectedTrip.driver.user.name}</Text>
                          <View style={styles.ratingContainer}>
                            <Star size={16} color="#FFB800" fill="#FFB800" />
                            <Text style={styles.ratingText}>{selectedTrip.driver.rating}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Payment</Text>
                      <View style={styles.paymentInfo}>
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Vehicle Type</Text>
                          <Text style={styles.paymentValue}>{selectedTrip.driver.vehicle_type}</Text>
                        </View>
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Payment Status</Text>
                          <Text style={styles.paymentValue}>{selectedTrip.payment_status}</Text>
                        </View>
                        <View style={styles.paymentDivider} />
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentTotalLabel}>Total Fare</Text>
                          <Text style={styles.paymentTotalValue}>
                            €{selectedTrip.final_fare?.toFixed(2) || selectedTrip.fare.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </>
                )}
                {selectedTrip.status === 'cancelled' && (
                  <View style={styles.cancelledNotice}>
                    <Text style={styles.cancelledText}>
                      {selectedTrip.cancellation?.note || 'This trip was cancelled'}
                    </Text>
                  </View>
                )}
              </ScrollView>
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
    backgroundColor: '#fdf4ff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    color: '#831843',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#fce7f3',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fdf2f8',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#ec4899',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#831843',
  },
  filterTextActive: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#831843',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#831843',
    marginTop: 16,
  },
  list: {
    padding: 16,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  tripCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#fce7f3',
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
    color: '#831843',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 14,
    color: '#9d174d',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#fce7f3',
  },
  statusCancelled: {
    backgroundColor: '#fecaca',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusCompletedText: {
    color: '#ec4899',
  },
  statusCancelledText: {
    color: '#f87171',
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
    color: '#831843',
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#fce7f3',
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
    color: '#831843',
  },
  fareText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#831843',
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
    borderBottomColor: '#fce7f3',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#831843',
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
    color: '#831843',
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
    color: '#831843',
  },
  detailRoute: {
    backgroundColor: '#fdf2f8',
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
    color: '#9d174d',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailRouteText: {
    fontSize: 14,
    color: '#831843',
  },
  detailRouteLine: {
    width: 2,
    height: 20,
    backgroundColor: '#fce7f3',
    marginLeft: 9,
    marginVertical: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statsBox: {
    flex: 1,
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#831843',
    marginTop: 8,
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: '#9d174d',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    padding: 16,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ec4899',
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
    color: '#831843',
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
    color: '#9d174d',
  },
  paymentInfo: {
    backgroundColor: '#fdf2f8',
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
    color: '#9d174d',
  },
  paymentValue: {
    fontSize: 14,
    color: '#831843',
    fontWeight: '500',
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#fce7f3',
    marginVertical: 8,
  },
  paymentTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#831843',
  },
  paymentTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ec4899',
  },
  cancelledNotice: {
    backgroundColor: '#fecaca',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelledText: {
    fontSize: 14,
    color: '#f87171',
    fontWeight: '600',
  },
});