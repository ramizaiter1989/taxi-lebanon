import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Navigation, Clock, DollarSign, Phone, AlertTriangle } from 'lucide-react-native';
import { useRide } from '@/hooks/ride-store';
import { useUser } from '@/hooks/user-store';
import { LEBANON_LOCATIONS } from '@/constants/lebanon-locations';
import MapView from '@/components/MapView';
import { Location } from '@/types/user';

export default function ClientHomeScreen() {
  const { user } = useUser();
  const { currentRide, requestRide, cancelRide, updateRideStatus, driverLocation, estimatedArrival, triggerSOSAlert } = useRide();
  const [pickup, setPickup] = useState<Location>(LEBANON_LOCATIONS[0]);
  const [dropoff, setDropoff] = useState<Location>(LEBANON_LOCATIONS[1]);
  const [isSelectingPickup, setIsSelectingPickup] = useState(false);
  const [isSelectingDropoff, setIsSelectingDropoff] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const handleBookRide = () => {
    if (currentRide) return;
    if (!pickup.address.trim() || !dropoff.address.trim()) {
      Alert.alert('Error', 'Please select both pickup and dropoff locations');
      return;
    }
    requestRide(pickup, dropoff);
    setShowMap(true);
  };

  const handleLocationSelect = (location: Location) => {
    if (isSelectingPickup) {
      setPickup(location);
      setIsSelectingPickup(false);
    } else if (isSelectingDropoff) {
      setDropoff(location);
      setIsSelectingDropoff(false);
    }
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
          onPress: () => triggerSOSAlert(pickup)
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
        { text: 'Yes', onPress: cancelRide }
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

  if (showMap && currentRide) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mapContainer}>
          <MapView
            pickup={currentRide.pickup}
            dropoff={currentRide.dropoff}
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
                  onPress={() => updateRideStatus('completed')}
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

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={styles.header}
      >
        <Text style={styles.greeting}>Hello, {user?.name}!</Text>
        <Text style={styles.subtitle}>Where would you like to go?</Text>
      </LinearGradient>

      {(isSelectingPickup || isSelectingDropoff) ? (
        <View style={styles.mapSelectionContainer}>
          <View style={styles.selectionHeader}>
            <Text style={styles.selectionTitle}>
              {isSelectingPickup ? 'Select Pickup Location' : 'Select Dropoff Location'}
            </Text>
            <TouchableOpacity 
              style={styles.cancelSelectionButton}
              onPress={() => {
                setIsSelectingPickup(false);
                setIsSelectingDropoff(false);
              }}
            >
              <Text style={styles.cancelSelectionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <MapView
            isSelectionMode={true}
            onLocationSelect={handleLocationSelect}
            testID="location-selection-map"
          />
        </View>
      ) : (
        <View style={styles.content}>
          {!currentRide ? (
            <>
              <View style={styles.locationContainer}>
                <TouchableOpacity 
                  style={styles.locationItem}
                  onPress={() => setIsSelectingPickup(true)}
                >
                  <MapPin size={20} color="#6366f1" />
                  <View style={styles.locationText}>
                    <Text style={styles.locationLabel}>From</Text>
                    <Text style={styles.locationAddress}>{pickup.address}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.locationItem}
                  onPress={() => setIsSelectingDropoff(true)}
                >
                  <Navigation size={20} color="#ec4899" />
                  <View style={styles.locationText}>
                    <Text style={styles.locationLabel}>To</Text>
                    <Text style={styles.locationAddress}>{dropoff.address}</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.fareContainer}>
                <DollarSign size={20} color="#10b981" />
                <Text style={styles.fareText}>
                  Estimated fare: {((Math.random() * 10000) + 5000).toFixed(0)} LBP
                </Text>
              </View>

              <TouchableOpacity
                style={styles.bookButton}
                onPress={handleBookRide}
                testID="book-ride-button"
              >
                <Text style={styles.bookButtonText}>Book Ride</Text>
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
                  <Text style={styles.rideInfoText}>Fare: {currentRide.fare} LBP</Text>
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

              <View style={styles.rideActions}>
                {currentRide.status === 'started' ? (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => updateRideStatus('completed')}
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
          )}
        </View>
      )}
    </SafeAreaView>
  );
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
  mapSelectionContainer: {
    flex: 1,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  cancelSelectionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
  },
  cancelSelectionText: {
    color: 'white',
    fontWeight: '600',
  },
  etaText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 4,
  },
  driverActions: {
    flexDirection: 'row',
    gap: 12,
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sosButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '600',
  },
  viewMapButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  viewMapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 24,
    paddingTop: 60,
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
    padding: 24,
  },
  locationContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  locationText: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  fareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  fareText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  bookButton: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
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
    marginBottom: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  rideDetails: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  rideInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rideInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
  },
  driverInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  callButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '600',
  },
  rideActions: {
    marginTop: 'auto',
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