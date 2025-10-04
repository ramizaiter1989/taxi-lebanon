import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Phone,
  MessageSquare,
  Navigation,
  Clock,
  MapPin,
  Star,
  AlertCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function ActiveRideScreen() {
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState(5 * 60); // 5 minutes in seconds
  const [rideStatus, setRideStatus] = useState<'searching' | 'driver_assigned' | 'arriving' | 'picked_up'>('driver_assigned');

  // Mock driver data
  const driver = {
    name: 'Ahmad Hassan',
    rating: 4.8,
    vehicle: 'Toyota Camry',
    plateNumber: 'ABC 1234',
    photo: 'https://via.placeholder.com/100',
    eta: 5,
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
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
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            router.replace('/(client)/home');
          },
        },
      ]
    );
  };

  const getStatusInfo = () => {
    switch (rideStatus) {
      case 'searching':
        return {
          title: 'Finding Your Driver',
          subtitle: 'Please wait while we match you with a driver',
          color: '#FF9500',
        };
      case 'driver_assigned':
        return {
          title: 'Driver Assigned',
          subtitle: 'Your driver is on the way',
          color: '#007AFF',
        };
      case 'arriving':
        return {
          title: 'Driver Arriving',
          subtitle: 'Your driver will arrive shortly',
          color: '#34C759',
        };
      case 'picked_up':
        return {
          title: 'On Trip',
          subtitle: 'Enjoy your ride',
          color: '#9C27B0',
        };
      default:
        return {
          title: 'Active Ride',
          subtitle: '',
          color: '#007AFF',
        };
    }
  };

  const statusInfo = getStatusInfo();

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
          <Text style={styles.etaTime}>{driver.eta} min</Text>
        </View>
      </View>

      {/* Driver Card */}
      <View style={styles.driverCard}>
        <Image
          source={{ uri: driver.photo }}
          style={styles.driverPhoto}
        />
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{driver.name}</Text>
          <View style={styles.ratingContainer}>
            <Star size={16} color="#FFD700" fill="#FFD700" />
            <Text style={styles.rating}>{driver.rating}</Text>
          </View>
          <Text style={styles.vehicleInfo}>
            {driver.vehicle} • {driver.plateNumber}
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

      {/* Trip Details */}
      <View style={styles.tripDetails}>
        <Text style={styles.sectionTitle}>Trip Details</Text>
        
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: '#FF5252' }]} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>PICKUP</Text>
            <Text style={styles.locationText}>Hamra Street, Beirut</Text>
          </View>
        </View>

        <View style={styles.locationLine} />

        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: '#9C27B0' }]} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>DESTINATION</Text>
            <Text style={styles.locationText}>Beirut Airport</Text>
          </View>
        </View>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <View style={styles.fareInfo}>
          <Text style={styles.fareLabel}>Estimated Fare</Text>
          <Text style={styles.fareValue}>45,000 LBP</Text>
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
  emergencyButton: {
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
  statusBanner: {
    padding: 16,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  etaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  etaInfo: {
    marginLeft: 16,
  },
  etaLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  etaTime: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  driverCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  driverPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0E0E0',
  },
  driverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    color: '#333',
    marginLeft: 4,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#666',
  },
  driverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripDetails: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
    color: '#666',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  locationLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginLeft: 5,
    marginVertical: 8,
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
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
  },
  fareLabel: {
    fontSize: 14,
    color: '#666',
  },
  fareValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  trackButton: {
    borderRadius: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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