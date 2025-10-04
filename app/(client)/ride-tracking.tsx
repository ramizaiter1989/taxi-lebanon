import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Phone, 
  MessageCircle, 
  Star,
  Car,
  Clock,
  Navigation,
  X,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useRide } from '@/hooks/ride-store';
import { LinearGradient } from 'expo-linear-gradient';
import { Driver } from '@/types/user';
import { RideContext } from '@/types/ride';


export default function RideTrackingScreen() {
  const router = useRouter();
  
  const { 
  currentRide, 
  availableDrivers, 
  estimatedArrival,
  updateRideStatus, 
  cancelRide 
} = useRide();


  const [searchingDriver, setSearchingDriver] = useState(true);
  const driver = currentRide?.riderId 
    ? availableDrivers.find(d => d.id === currentRide.riderId)
    : null;

  useEffect(() => {
    if (currentRide?.status === 'accepted') {
      setSearchingDriver(false);
    }
  }, [currentRide?.status]);

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => {
            cancelRide();
            router.back();
          }
        }
      ]
    );
  };

  const handleCallDriver = () => {
    if (driver) {
      Alert.alert('Call Driver', `Call ${driver.name}?`);
    }
  };

  const handleMessageDriver = () => {
    if (driver) {
      Alert.alert('Message Driver', `Send message to ${driver.name}?`);
    }
  };

  if (!currentRide) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Car size={64} color="#CCC" />
          <Text style={styles.emptyText}>No active ride</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {searchingDriver ? 'Finding Driver...' : 'Your Ride'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {searchingDriver ? (
        <View style={styles.searchingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.searchingTitle}>Searching for drivers...</Text>
          <Text style={styles.searchingSubtext}>
            We're finding the best driver for you
          </Text>
          
          <View style={styles.rideInfoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pickup</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {currentRide.pickup.address}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Drop-off</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {currentRide.dropoff.address}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fare</Text>
              <Text style={styles.fareValue}>
                {currentRide.fare.toLocaleString()} LBP
              </Text>
            </View>
          </View>
        </View>
      ) : driver ? (
        <View style={styles.driverContainer}>
          <View style={styles.statusCard}>
            <LinearGradient 
              colors={['#34C759', '#28A745']} 
              style={styles.statusGradient}
            >
              <Text style={styles.statusText}>
                {currentRide.status === 'accepted' && 'Driver is on the way'}
                {currentRide.status === 'on_way' && 'Driver is arriving soon'}
                {currentRide.status === 'started' && 'Trip in progress'}
              </Text>
              {estimatedArrival > 0 && (
                <View style={styles.etaContainer}>
                  <Clock size={16} color="white" />
                  <Text style={styles.etaText}>{estimatedArrival} min</Text>
                </View>
              )}
            </LinearGradient>
          </View>

          <View style={styles.driverCard}>
            <View style={styles.driverHeader}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverInitial}>
                  {driver.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <View style={styles.ratingContainer}>
                  <Star size={16} color="#FFB800" fill="#FFB800" />
                  <Text style={styles.ratingText}>{driver.rating}</Text>
                </View>
              </View>
              <View style={styles.driverActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleCallDriver}
                >
                  <Phone size={20} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleMessageDriver}
                >
                  <MessageCircle size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.vehicleInfo}>
              <Car size={20} color="#666" />
              <Text style={styles.vehicleText}>
                {driver.vehicleInfo.color} {driver.vehicleInfo.make} {driver.vehicleInfo.model}
              </Text>
              <View style={styles.plateNumber}>
                <Text style={styles.plateText}>{driver.vehicleInfo.plateNumber}</Text>
              </View>
            </View>
          </View>

          <View style={styles.tripDetailsCard}>
            <Text style={styles.tripDetailsTitle}>Trip Details</Text>
            
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, { backgroundColor: '#FF5252' }]} />
              <View style={styles.locationContent}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationAddress}>
                  {currentRide.pickup.address}
                </Text>
              </View>
            </View>

            <View style={styles.locationConnector} />

            <View style={styles.locationRow}>
              <View style={[styles.locationDot, { backgroundColor: '#9C27B0' }]} />
              <View style={styles.locationContent}>
                <Text style={styles.locationLabel}>Drop-off</Text>
                <Text style={styles.locationAddress}>
                  {currentRide.dropoff.address}
                </Text>
              </View>
            </View>

            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Total Fare</Text>
              <Text style={styles.fareAmount}>
                {currentRide.fare.toLocaleString()} LBP
              </Text>
            </View>
          </View>

          {currentRide.status !== 'started' && (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelRide}
            >
              <X size={20} color="#FF3B30" />
              <Text style={styles.cancelButtonText}>Cancel Ride</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
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
  headerButton: {
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
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  searchingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 8,
  },
  searchingSubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  rideInfoCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  fareValue: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  driverContainer: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  statusGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  etaText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  driverCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  driverInfo: {
    flex: 1,
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
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  driverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  vehicleText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  plateNumber: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  plateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  tripDetailsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tripDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
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
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationAddress: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  locationConnector: {
    width: 2,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginLeft: 5,
    marginVertical: 8,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  fareLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
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
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});