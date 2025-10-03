import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Navigation, Clock, DollarSign, Phone, AlertTriangle, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import { useRide } from '@/hooks/ride-store';
import { useUser } from '@/hooks/user-store';
import { useMap } from '@/providers/MapProvider';
import MapView from '../../components/MapView';
import { Location } from '@/types/user';

export default function ClientHomeScreen() {
  const { user } = useUser();
  const { currentRide, requestRide, cancelRide, updateRideStatus, driverLocation, estimatedArrival, triggerSOSAlert } = useRide();
  const { routeStart, routeEnd, clearRoute } = useMap();
  const [showMap, setShowMap] = useState(false);
  const [calculatedFare, setCalculatedFare] = useState(0);

  // Convert map markers to ride locations
  const pickup: Location | undefined = routeStart ? {
    latitude: routeStart.lat,
    longitude: routeStart.lng,
    address: routeStart.description || routeStart.title
  } : undefined;

  const dropoff: Location | undefined = routeEnd ? {
    latitude: routeEnd.lat,
    longitude: routeEnd.lng,
    address: routeEnd.description || routeEnd.title
  } : undefined;

  // Calculate fare when both locations are selected
  useEffect(() => {
    if (pickup && dropoff) {
      const distance = calculateDistance(
        pickup.latitude,
        pickup.longitude,
        dropoff.latitude,
        dropoff.longitude
      );
      const baseFare = 3000; // Base fare in LBP
      const perKmRate = 1500; // Rate per km
      const estimated = baseFare + (distance * perKmRate);
      setCalculatedFare(Math.round(estimated));
    }
  }, [pickup, dropoff]);

  const handleBookRide = () => {
    if (currentRide) return;
    if (!pickup || !dropoff) {
      Alert.alert('Error', 'Please select both pickup and dropoff locations');
      return;
    }
    requestRide(pickup, dropoff);
    setShowMap(true);
  };

  const handleSOSPress = () => {
    Alert.alert(
      'Emergency SOS',
      'This will send an emergency alert to your emergency contacts and local authorities. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send SOS', 
          style: 'destructive',
          onPress: () => triggerSOSAlert(pickup || { latitude: 0, longitude: 0, address: 'Unknown' })
        }
      ]
    );
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: () => {
            cancelRide();
            clearRoute();
            setShowMap(false);
          }
        }
      ]
    );
  };

  const getRideStatusText = () => {
    switch (currentRide?.status) {
      case 'pending': return 'Looking for a driver...';
      case 'accepted': return 'Driver is on the way';
      case 'on_way': return 'Driver is coming to pick you up';
      case 'started': return 'Trip in progress';
      default: return '';
    }
  };

  const getRideStatusColor = () => {
    switch (currentRide?.status) {
      case 'pending': return '#f59e0b';
      case 'accepted': return '#10b981';
      case 'on_way': return '#3b82f6';
      case 'started': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  // Map view during active ride
  if (showMap && currentRide && pickup && dropoff) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mapContainer}>
          <MapView
            pickup={pickup}
            dropoff={dropoff}
            driverLocation={driverLocation || undefined}
            showRoute={true}
            followDriver={currentRide.status === 'accepted' || currentRide.status === 'on_way'}
            testID="client-map"
          />
          
          <View style={styles.mapOverlay}>
            <View style={[styles.statusContainer, { backgroundColor: getRideStatusColor() }]}>
              <Text style={styles.statusText}>{getRideStatusText()}</Text>
              {estimatedArrival > 0 && (
                <Text style={styles.etaText}>ETA: {estimatedArrival} min</Text>
              )}
            </View>
            
            {currentRide.status === 'accepted' && (
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>Fatima Khalil</Text>
                <Text style={styles.driverDetails}>Toyota Corolla • White • ⭐ 4.9</Text>
                <View style={styles.driverActions}>
                  <TouchableOpacity style={styles.callButton}>
                    <Phone size={16} color="white" />
                    <Text style={styles.callButtonText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sosButton} onPress={handleSOSPress}>
                    <AlertTriangle size={16} color="white" />
                    <Text style={styles.sosButtonText}>SOS</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            <View style={styles.rideActions}>
              {currentRide.status === 'started' ? (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => {
                    updateRideStatus('completed');
                    setShowMap(false);
                    clearRoute();
                  }}
                >
                  <Text style={styles.completeButtonText}>Complete Ride</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelRide}
                >
                  <Text style={styles.cancelButtonText}>Cancel Ride</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Main booking screen
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={styles.header}
      >
        <Text style={styles.greeting}>Hello, {user?.name}!</Text>
        <Text style={styles.subtitle}>Where would you like to go?</Text>
      </LinearGradient>

      <View style={styles.content}>
        {!currentRide ? (
          <>
            <View style={styles.locationContainer}>
              <TouchableOpacity 
                style={styles.locationItem}
                onPress={() => router.push({ pathname: '/search', params: { mode: 'pickup' } })}
              >
                <MapPin size={20} color="#10b981" />
                <View style={styles.locationText}>
                  <Text style={styles.locationLabel}>Pickup Location</Text>
                  <Text style={styles.locationAddress} numberOfLines={1}>
                    {pickup?.address || 'Select pickup location'}
                  </Text>
                </View>
                <Search size={18} color="#9ca3af" />
              </TouchableOpacity>

              <View style={styles.locationDivider} />

              <TouchableOpacity 
                style={styles.locationItem}
                onPress={() => router.push({ pathname: '/search', params: { mode: 'dropoff' } })}
              >
                <Navigation size={20} color="#ef4444" />
                <View style={styles.locationText}>
                  <Text style={styles.locationLabel}>Dropoff Location</Text>
                  <Text style={styles.locationAddress} numberOfLines={1}>
                    {dropoff?.address || 'Select dropoff location'}
                  </Text>
                </View>
                <Search size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {pickup && dropoff && (
              <View style={styles.fareContainer}>
                <DollarSign size={20} color="#10b981" />
                <Text style={styles.fareText}>
                  Estimated fare: {calculatedFare.toLocaleString()} LBP
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.bookButton, (!pickup || !dropoff) && styles.bookButtonDisabled]}
              onPress={handleBookRide}
              disabled={!pickup || !dropoff}
              testID="book-ride-button"
            >
              <LinearGradient
                colors={pickup && dropoff ? ['#6366f1', '#8b5cf6'] : ['#9ca3af', '#6b7280']}
                style={styles.bookButtonGradient}
              >
                <Text style={styles.bookButtonText}>Book Ride</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.rideContainer}>
            <View style={[styles.statusContainer, { backgroundColor: getRideStatusColor() }]}>
              <Text style={styles.statusText}>{getRideStatusText()}</Text>
            </View>

            <TouchableOpacity 
              style={styles.viewMapButton}
              onPress={() => setShowMap(true)}
            >
              <Text style={styles.viewMapButtonText}>View on Map</Text>
            </TouchableOpacity>

            <View style={styles.rideDetails}>
              <View style={styles.rideInfo}>
                <Clock size={16} color="#6b7280" />
                <Text style={styles.rideInfoText}>ETA: {estimatedArrival || currentRide.estimatedDuration} min</Text>
              </View>
              
              <View style={styles.rideInfo}>
                <DollarSign size={16} color="#6b7280" />
                <Text style={styles.rideInfoText}>Fare: {currentRide.fare.toLocaleString()} LBP</Text>
              </View>
            </View>

            {currentRide.status === 'accepted' && (
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>Fatima Khalil</Text>
                <Text style={styles.driverDetails}>Toyota Corolla • White • ⭐ 4.9</Text>
                <View style={styles.driverActions}>
                  <TouchableOpacity style={styles.callButton}>
                    <Phone size={16} color="white" />
                    <Text style={styles.callButtonText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sosButton} onPress={handleSOSPress}>
                    <AlertTriangle size={16} color="white" />
                    <Text style={styles.sosButtonText}>SOS</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelRide}
            >
              <Text style={styles.cancelButtonText}>Cancel Ride</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  mapContainer: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
    padding: 20,
  },
  header: {
    padding: 24,
    paddingTop: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  locationContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  locationDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 48,
  },
  locationText: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  fareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  fareText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  bookButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonGradient: {
    padding: 18,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rideContainer: {
    flex: 1,
  },
  statusContainer: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  etaText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 4,
  },
  viewMapButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  viewMapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  rideDetails: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  rideInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rideInfoText: {
    fontSize: 14,
    color: '#374151',
  },
  driverInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  driverDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  driverActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  callButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  sosButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  sosButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  rideActions: {
    marginTop: 'auto',
    pointerEvents: 'auto',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});