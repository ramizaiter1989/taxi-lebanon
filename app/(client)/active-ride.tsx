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
  const [timeRemaining, setTimeRemaining] = useState(5 * 60); // 5 minutes
  const [rideStatus, setRideStatus] = useState<'searching' | 'driver_assigned' | 'arriving' | 'picked_up'>('driver_assigned');
  const [driver, setDriver] = useState<any | null>(null);
  const [ride, setRide] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const placeholderPhoto = 'https://via.placeholder.com/150';


  useEffect(() => {
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

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Response is not JSON. Maybe unauthorized or wrong URL.');
        }

        const data = await response.json();
        // The API wraps ride in `data`
        const liveRide = data.data;

        setRide(liveRide);
        setDriver(liveRide.driver?.user || null);

        // Map backend status to your frontend statuses
        switch (liveRide.status) {
          case 'pending':
          case 'accepted':
            setRideStatus('driver_assigned');
            break;
          case 'in_progress':
          case 'arrived':
            setRideStatus('arriving');
            break;
          default:
            setRideStatus('driver_assigned');
        }
      } catch (error) {
        console.error('Failed to fetch live ride:', error);
        Alert.alert('Error', 'Could not load live ride. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLiveRide();
  }, []);

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
    Linking.openURL('tel:+96170123456'); // Replace with driver phone if available
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
      case 'searching': return { title: 'Finding Your Driver', subtitle: 'Please wait while we match you with a driver', color: '#FF9500' };
      case 'driver_assigned': return { title: 'Driver Assigned', subtitle: 'Your driver is on the way', color: '#007AFF' };
      case 'arriving': return { title: 'Driver Arriving', subtitle: 'Your driver will arrive shortly', color: '#34C759' };
      case 'picked_up': return { title: 'On Trip', subtitle: 'Enjoy your ride', color: '#9C27B0' };
      default: return { title: 'Active Ride', subtitle: '', color: '#007AFF' };
    }
  };

  const statusInfo = getStatusInfo();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Loading ride...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.emergencyButton}>
          <AlertCircle size={24} color="#FF3B30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Ride</Text>
        <TouchableOpacity onPress={handleCancelRide}>
          <X size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: statusInfo.color }]}>
        <Text style={styles.statusTitle}>{statusInfo.title}</Text>
        <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
      </View>

      {/* ETA Card */}
      <View style={styles.etaCard}>
        <Clock size={32} color="#007AFF" />
        <View style={styles.etaInfo}>
          <Text style={styles.etaLabel}>Driver arriving in</Text>
          <Text style={styles.etaTime}>{ride?.driver?.eta ?? 5} min</Text>
        </View>
      </View>

      {/* Driver Card */}
      {driver ? (
        <View style={styles.driverCard}>
          <Image
            source={{ uri: driver.profile_photo || placeholderPhoto }}
            style={styles.driverPhoto}
          />
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driver.name || 'Driver Name'}</Text>
            <View style={styles.ratingContainer}>
              <Star size={16} color="#FFD700" fill="#FFD700" />
              <Text style={styles.rating}>{driver.rating ?? '-'}</Text>
            </View>
            <Text style={styles.vehicleInfo}>
              {ride?.driver?.vehicle_type ?? '-'}
            </Text>
          </View>
          <View style={styles.driverActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Phone size={24} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
              <MessageSquare size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={{ textAlign: 'center', marginVertical: 20 }}>No driver assigned yet.</Text>
      )}

      {/* Trip Details */}
      <View style={styles.tripDetails}>
        <Text style={styles.sectionTitle}>Trip Details</Text>
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: '#FF5252' }]} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>PICKUP</Text>
            <Text style={styles.locationText}>
              {ride?.origin?.lat && ride?.origin?.lng
                ? `Lat: ${ride.origin.lat}, Lng: ${ride.origin.lng}`
                : 'Hamra Street, Beirut'}
            </Text>
          </View>
        </View>
        <View style={styles.locationLine} />
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: '#9C27B0' }]} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>DESTINATION</Text>
            <Text style={styles.locationText}>
              {ride?.destination?.lat && ride?.destination?.lng
                ? `Lat: ${ride.destination.lat}, Lng: ${ride.destination.lng}`
                : 'Beirut Airport'}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <View style={styles.fareInfo}>
          <Text style={styles.fareLabel}>Estimated Fare</Text>
          <Text style={styles.fareValue}>{ride?.fare ?? '45,000 LBP'}</Text>
        </View>
        <TouchableOpacity style={styles.trackButton}>
          <LinearGradient colors={['#007AFF', '#0051D5']} style={styles.trackGradient}>
            <Navigation size={20} color="white" />
            <Text style={styles.trackButtonText}>Track on Map</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  emergencyButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statusBanner: { padding: 16, alignItems: 'center' },
  statusTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  statusSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)' },
  etaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', margin: 16, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  etaInfo: { marginLeft: 16 },
  etaLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  etaTime: { fontSize: 28, fontWeight: 'bold', color: '#007AFF' },
  driverCard: { flexDirection: 'row', backgroundColor: 'white', marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  driverPhoto: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E0E0E0' },
  driverInfo: { flex: 1, marginLeft: 12 },
  driverName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  rating: { fontSize: 14, fontWeight: '600', color: '#333', marginLeft: 4 },
  vehicleInfo: { fontSize: 14, color: '#666' },
  driverActions: { flexDirection: 'row', gap: 8 },
  actionButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  tripDetails: { backgroundColor: 'white', marginHorizontal: 16, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start' },
  locationDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, marginRight: 12 },
  locationInfo: { flex: 1 },
  locationLabel: { fontSize: 11, color: '#666', marginBottom: 4, letterSpacing: 0.5 },
  locationText: { fontSize: 16, color: '#333', fontWeight: '500' },
  locationLine: { width: 2, height: 24, backgroundColor: '#E0E0E0', marginLeft: 5, marginVertical: 8 },
  bottomSection: { flex: 1, justifyContent: 'flex-end', padding: 16 },
  fareInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12 },
  fareLabel: { fontSize: 14, color: '#666' },
  fareValue: { fontSize: 20, fontWeight: 'bold', color: '#007AFF' },
  trackButton: { borderRadius: 16, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  trackGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, gap: 8 },
  trackButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
