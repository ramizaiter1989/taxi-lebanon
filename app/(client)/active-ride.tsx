import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Phone,
  MessageSquare,
  Navigation,
  Clock,
  Star,
  AlertCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ActiveRideScreen() {
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState(5 * 60);
  const [rideStatus, setRideStatus] = useState<'searching' | 'driver_assigned' | 'arriving' | 'picked_up'>('driver_assigned');
  const [driver, setDriver] = useState<any | null>(null);
  const [ride, setRide] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const placeholderPhoto = 'https://via.placeholder.com/150';

  const fetchLiveRide = async () => {
    try {
      const authToken = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/rides/live`, {
        headers: {
          'Accept': 'application/json',
          'content-type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      const liveRide = data.data;
      setRide(liveRide);
      setDriver(liveRide.driver?.user || null);
      switch (liveRide.status) {
        case 'pending':
        case 'accepted':
          setRideStatus('driver_assigned');
          break;
        case 'in_progress':
          setRideStatus('picked_up');
          break;
        case 'arrived':
          setRideStatus('arriving');
          break;
        default:
          setRideStatus('driver_assigned');
      }
      const createdAt = new Date(liveRide.timestamps.created_at);
      if (!timerStartTime || liveRide.status !== ride?.status) {
        setTimerStartTime(createdAt);
        setElapsedTime(Math.floor((new Date().getTime() - createdAt.getTime()) / 1000));
      }
    } catch (error) {
      console.error('Failed to fetch live ride:', error);
      Alert.alert('Error', 'Could not load live ride. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!timerStartTime) return;
    const timerInterval = setInterval(() => {
      const now = new Date();
      const newElapsedTime = Math.floor((now.getTime() - timerStartTime.getTime()) / 1000);
      setElapsedTime(newElapsedTime);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [timerStartTime]);

  useEffect(() => {
    fetchLiveRide();
    const interval = setInterval(() => {
      if (ride?.status === 'pending' || ride?.status === 'driver_assigned') {
        fetchLiveRide();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [ride?.status]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCall = () => {
    Linking.openURL('tel:+96170123456');
  };

  const handleMessage = () => {
    Alert.alert('Message Driver', 'Messaging feature coming soon!');
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride? You may be charged a cancellation fee.',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => router.replace('/(client)/home') },
      ]
    );
  };

  const getStatusInfo = () => {
    switch (rideStatus) {
      case 'searching': return { title: 'Finding Your Driver', subtitle: 'Please wait while we match you with a driver', color: '#fce7f3' };
      case 'driver_assigned': return { title: 'Driver Assigned', subtitle: 'Your driver is on the way', color: '#fbcfe8' };
      case 'arriving': return { title: 'Driver Arriving', subtitle: 'Your driver will arrive shortly', color: '#f9a8d4' };
      case 'picked_up': return { title: 'On Trip', subtitle: 'Enjoy your ride', color: '#ec4899' };
      default: return { title: 'Active Ride', subtitle: '', color: '#fce7f3' };
    }
  };

  const statusInfo = getStatusInfo();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ec4899" />
        <Text style={{ marginTop: 10, color: '#831843' }}>Loading ride...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#fdf2f8', '#fce7f3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.emergencyButton}>
            <AlertCircle size={24} color="#ec4899" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Active Ride</Text>
          <TouchableOpacity onPress={handleCancelRide}>
            <X size={24} color="#831843" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Ride Duration</Text>
          <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
        </View>
        <View style={[styles.statusBanner, { backgroundColor: statusInfo.color }]}>
          <Text style={styles.statusTitle}>{statusInfo.title}</Text>
          <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
        </View>
        <View style={styles.etaCard}>
          <Clock size={32} color="#ec4899" />
          <View style={styles.etaInfo}>
            <Text style={styles.etaLabel}>Driver arriving in</Text>
            <Text style={styles.etaTime}>{ride?.driver?.eta?.duration_text || 'N/A'}</Text>
            <Text style={styles.etaDistance}>
              {ride?.driver?.eta?.distance ? `${(ride.driver.eta.distance / 1000).toFixed(1)} km` : 'Distance not available'}
            </Text>
          </View>
        </View>
        {driver ? (
          <View style={styles.driverCard}>
            <Image source={{ uri: driver.profile_photo || placeholderPhoto }} style={styles.driverPhoto} />
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{driver.name || 'Driver Name'}</Text>
              <View style={styles.ratingContainer}>
                <Star size={16} color="#FFD700" fill="#FFD700" />
                <Text style={styles.rating}>{driver.rating ?? '-'}</Text>
              </View>
              <Text style={styles.vehicleInfo}>{ride?.driver?.vehicle_type ?? '-'}</Text>
            </View>
            <View style={styles.driverActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                <Phone size={24} color="#ec4899" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
                <MessageSquare size={24} color="#ec4899" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={{ textAlign: 'center', marginVertical: 20, color: '#831843' }}>No driver assigned yet.</Text>
        )}
        <View style={styles.tripDetails}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: '#ec4899' }]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>PICKUP</Text>
              <Text style={styles.locationAddress}>{ride?.origin?.address || 'Pickup address not available'}</Text>
              <Text style={styles.locationCoordinates}>
                {ride?.origin?.lat && ride?.origin?.lng ? `Lat: ${ride.origin.lat}, Lng: ${ride.origin.lng}` : 'No coordinates'}
              </Text>
            </View>
          </View>
          <View style={styles.locationLine} />
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: '#831843' }]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>DESTINATION</Text>
              <Text style={styles.locationAddress}>{ride?.destination?.address || 'Destination not available'}</Text>
              <Text style={styles.locationCoordinates}>
                {ride?.destination?.lat && ride?.destination?.lng ? `Lat: ${ride.destination.lat}, Lng: ${ride.destination.lng}` : 'No coordinates'}
              </Text>
            </View>
          </View>
          {ride?.trip?.time && (
            <View style={styles.tripTimeContainer}>
              <Clock size={16} color="#831843" />
              <Text style={styles.tripTimeLabel}>Estimated Trip Time:</Text>
              <Text style={styles.tripTimeText}>
                {ride.trip.time.duration_text} ({ride.trip.time.distance ? `${(ride.trip.time.distance / 1000).toFixed(1)} km` : 'N/A'})
              </Text>
            </View>
          )}
        </View>
        <View style={styles.bottomSection}>
          <View style={styles.fareInfo}>
            <Text style={styles.fareLabel}>Estimated Fare</Text>
            <Text style={styles.fareValue}>{ride?.fare ?? '45,000 LBP'}</Text>
          </View>
          <TouchableOpacity style={styles.trackButton}>
            <LinearGradient colors={['#ec4899', '#f472b6']} style={styles.trackGradient}>
              <Navigation size={20} color="white" />
              <Text style={styles.trackButtonText}>Track on Map</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  emergencyButton: {
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
  statusBanner: {
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#831843',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#9d174d',
  },
  etaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  etaInfo: {
    marginLeft: 16,
  },
  etaLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  etaTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#831843',
  },
  etaDistance: {
    fontSize: 14,
    color: '#9d174d',
    fontWeight: '600',
  },
  driverCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  driverPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
  },
  driverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 4,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#9ca3af',
  },
  driverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fdf2f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripDetails: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  locationAddress: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    marginBottom: 2,
  },
  locationCoordinates: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '400',
  },
  locationLine: {
    width: 2,
    height: 24,
    backgroundColor: '#fce7f3',
    marginLeft: 5,
    marginVertical: 8,
  },
  tripTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  tripTimeLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 8,
  },
  tripTimeText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    marginLeft: 4,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  timerLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#831843',
  },
  bottomSection: {
    padding: 16,
  },
  fareInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  fareLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  fareValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#831843',
  },
  trackButton: {
    borderRadius: 16,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  trackGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  trackButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
