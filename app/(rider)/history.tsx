import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { 
  MapPin, 
  Navigation, 
  Star, 
  Calendar, 
  DollarSign, 
  Clock, 
  User,
  X,
  Flag,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function RiderHistoryScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
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

      const response = await fetch(`${API_BASE_URL}/rides/history?page=${page}`, {
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

  useEffect(() => {
    isMountedRef.current = true;
    fetchTrips(1);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchTrips]);

  const onRefresh = useCallback(() => {
    fetchTrips(1, true);
  }, [fetchTrips]);

  const completedTrips = trips.filter(trip => trip.status === 'completed');
  const totalEarnings = completedTrips.reduce((sum, ride) => sum + (ride.final_fare || ride.fare), 0);
  const avgRating = completedTrips.length > 0 
    ? (completedTrips.reduce((sum, ride) => sum + (ride.driver?.rating || 0), 0) / completedTrips.length).toFixed(1)
    : '0.0';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && trips.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d65c9e" />
          <Text style={styles.loadingText}>Loading trips...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#f8e8f5', '#f4d0ec', '#f0b6d9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.title}>Trip History</Text>
        <Text style={styles.subtitle}>Your completed journeys</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Navigation size={20} color="#d65c9e" />
            </View>
            <Text style={styles.statNumber}>{completedTrips.length}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <DollarSign size={20} color="#d65c9e" />
            </View>
            <Text style={styles.statNumber}>€{totalEarnings.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Star size={20} color="#d65c9e" fill="#d65c9e" />
            </View>
            <Text style={styles.statNumber}>{avgRating}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#d65c9e']}
            tintColor="#d65c9e"
          />
        }
      >
        {trips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Navigation size={64} color="#f4d0ec" />
            <Text style={styles.emptyText}>No trips yet</Text>
            <Text style={styles.emptySubtext}>Your trip history will appear here</Text>
          </View>
        ) : (
          trips.map((ride) => (
            <TouchableOpacity 
              key={ride.id} 
              style={styles.rideCard}
              onPress={() => setSelectedTrip(ride)}
              activeOpacity={0.7}
            >
              <View style={styles.rideHeader}>
                <View style={styles.dateContainer}>
                  <Calendar size={18} color="#ad4a78" />
                  <Text style={styles.dateText}>{formatDate(ride.timestamps.requested_at)}</Text>
                </View>
                {ride.status === 'completed' ? (
                  <LinearGradient
                    colors={['#e879b8', '#f0a7c4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.fareContainer}
                  >
                    <DollarSign size={16} color="white" />
                    <Text style={styles.fareText}>€{(ride.final_fare || ride.fare).toFixed(2)}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.cancelledBadge}>
                    <Text style={styles.cancelledText}>Cancelled</Text>
                  </View>
                )}
              </View>

              <View style={styles.routeContainer}>
                <View style={styles.routeItem}>
                  <View style={styles.pickupDot} />
                  <View style={styles.routeTextContainer}>
                    <Text style={styles.routeLabel}>Pickup</Text>
                    <Text style={styles.routeText} numberOfLines={1}>
                      {ride.origin.address}
                    </Text>
                  </View>
                </View>

                <View style={styles.routeLine}>
                  <View style={styles.routeLineDashed} />
                </View>

                <View style={styles.routeItem}>
                  <View style={styles.dropoffDot} />
                  <View style={styles.routeTextContainer}>
                    <Text style={styles.routeLabel}>Drop-off</Text>
                    <Text style={styles.routeText} numberOfLines={1}>
                      {ride.destination.address}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.rideFooter}>
                <View style={styles.footerLeft}>
                  <View style={styles.passengerContainer}>
                    <View style={styles.passengerIcon}>
                      <User size={14} color="#d65c9e" />
                    </View>
                    <Text style={styles.passengerText}>{ride.passenger.name}</Text>
                  </View>
                  <View style={styles.durationContainer}>
                    <Clock size={14} color="#ad4a78" />
                    <Text style={styles.durationText}>
                      {Math.round(ride.route_info.trip_route.duration_minutes)} min
                    </Text>
                  </View>
                </View>

                {ride.status === 'completed' && ride.driver && (
                  <View style={styles.ratingContainer}>
                    <Star size={16} color="#f4c2c2" fill="#f4c2c2" />
                    <Text style={styles.ratingText}>{ride.driver.rating.toFixed(1)}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Trip Details Modal */}
      <Modal visible={!!selectedTrip} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#f8e8f5', '#f4d0ec']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>Trip Details</Text>
              <TouchableOpacity onPress={() => setSelectedTrip(null)}>
                <X size={24} color="#8a3b62" />
              </TouchableOpacity>
            </LinearGradient>
            {selectedTrip && (
              <ScrollView style={styles.modalDetailsContent} showsVerticalScrollIndicator={false}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Trip Information</Text>
                  <View style={styles.detailRow}>
                    <Calendar size={20} color="#d65c9e" />
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
                    <Clock size={20} color="#d65c9e" />
                    <Text style={styles.detailText}>{formatTime(selectedTrip.timestamps.requested_at)}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Route</Text>
                  <View style={styles.detailRoute}>
                    <View style={styles.detailRoutePoint}>
                      <MapPin size={20} color="#d65c9e" />
                      <View style={styles.detailRouteInfo}>
                        <Text style={styles.detailRouteLabel}>Pickup</Text>
                        <Text style={styles.detailRouteText}>{selectedTrip.origin.address}</Text>
                      </View>
                    </View>
                    <View style={styles.detailRouteLine} />
                    <View style={styles.detailRoutePoint}>
                      <Flag size={20} color="#8a3b62" />
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
                      <Navigation size={24} color="#d65c9e" />
                      <Text style={styles.statsValue}>{selectedTrip.route_info.trip_route.distance_km} km</Text>
                      <Text style={styles.statsLabel}>Distance</Text>
                    </View>
                    <View style={styles.statsBox}>
                      <Clock size={24} color="#d65c9e" />
                      <Text style={styles.statsValue}>{Math.round(selectedTrip.route_info.trip_route.duration_minutes)} min</Text>
                      <Text style={styles.statsLabel}>Duration</Text>
                    </View>
                  </View>
                </View>

                {selectedTrip.status === 'completed' && (
                  <>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Passenger</Text>
                      <View style={styles.passengerInfo}>
                        <View style={styles.passengerAvatar}>
                          <Text style={styles.passengerInitial}>
                            {selectedTrip.passenger.name.charAt(0)}
                          </Text>
                        </View>
                        <View style={styles.passengerDetails}>
                          <Text style={styles.passengerName}>{selectedTrip.passenger.name}</Text>
                          {selectedTrip.driver && (
                            <View style={styles.ratingBadge}>
                              <Star size={16} color="#FFB800" fill="#FFB800" />
                              <Text style={styles.ratingBadgeText}>{selectedTrip.driver.rating}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Payment</Text>
                      <View style={styles.paymentInfo}>
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Base Fare</Text>
                          <Text style={styles.paymentValue}>€{selectedTrip.fare.toFixed(2)}</Text>
                        </View>
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Payment Status</Text>
                          <Text style={styles.paymentValue}>{selectedTrip.payment_status}</Text>
                        </View>
                        <View style={styles.paymentDivider} />
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentTotalLabel}>Total Earned</Text>
                          <Text style={styles.paymentTotalValue}>
                            €{(selectedTrip.final_fare || selectedTrip.fare).toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </>
                )}

                {selectedTrip.status === 'cancelled' && (
                  <View style={styles.cancelledNotice}>
                    <Text style={styles.cancelledNoticeText}>
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
    backgroundColor: '#fff9fc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8a3b62',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#d65c9e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#8a3b62',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#ad4a78',
    marginBottom: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#d65c9e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#d65c9e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8a3b62',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#ad4a78',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8a3b62',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ad4a78',
    marginTop: 8,
  },
  rideCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#d65c9e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f8e8f5',
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#ad4a78',
    fontWeight: '600',
  },
  fareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  fareText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
  },
  cancelledBadge: {
    backgroundColor: '#fecaca',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cancelledText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f87171',
  },
  routeContainer: {
    marginBottom: 16,
    backgroundColor: '#fef7f9',
    borderRadius: 14,
    padding: 14,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#d65c9e',
    marginTop: 4,
  },
  dropoffDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#e879b8',
    marginTop: 4,
  },
  routeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  routeLabel: {
    fontSize: 11,
    color: '#ad4a78',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  routeText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },
  routeLine: {
    marginLeft: 5,
    marginVertical: 8,
    paddingLeft: 1,
  },
  routeLineDashed: {
    width: 2,
    height: 24,
    backgroundColor: '#f4d0ec',
    borderRadius: 1,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f8e8f5',
  },
  footerLeft: {
    flex: 1,
    gap: 8,
  },
  passengerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passengerIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fef7f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  passengerText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '600',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 32,
  },
  durationText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#9ca3af',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8fb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fce7f3',
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#d65c9e',
  },
  bottomSpacer: {
    height: 24,
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
    borderBottomColor: '#f8e8f5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8a3b62',
  },
  modalDetailsContent: {
    padding: 20,
    paddingBottom: 40,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8a3b62',
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
    color: '#4b5563',
  },
  detailRoute: {
    backgroundColor: '#fef7f9',
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
    color: '#ad4a78',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  detailRouteText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  detailRouteLine: {
    width: 2,
    height: 20,
    backgroundColor: '#f4d0ec',
    marginLeft: 9,
    marginVertical: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statsBox: {
    flex: 1,
    backgroundColor: '#fef7f9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8a3b62',
    marginTop: 8,
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: '#ad4a78',
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef7f9',
    borderRadius: 12,
    padding: 16,
  },
  passengerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#d65c9e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  passengerInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  passengerDetails: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8a3b62',
    marginBottom: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ad4a78',
  },
  paymentInfo: {
    backgroundColor: '#fef7f9',
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
    color: '#ad4a78',
  },
  paymentValue: {
    fontSize: 14,
    color: '#8a3b62',
    fontWeight: '500',
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#f4d0ec',
    marginVertical: 8,
  },
  paymentTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8a3b62',
  },
  paymentTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d65c9e',
  },
  cancelledNotice: {
    backgroundColor: '#fecaca',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelledNoticeText: {
    fontSize: 14,
    color: '#f87171',
    fontWeight: '600',
  },
});