import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Power, MapPin, Navigation, Clock, DollarSign, Phone, AlertTriangle } from 'lucide-react-native';
import { useRide } from '@/hooks/ride-store';
import { useUser } from '@/hooks/user-store';
import MapView from '@/components/MapView';
import { LEBANON_LOCATIONS } from '@/constants/lebanon-locations';

export default function RiderHomeScreen() {
  const { user } = useUser();
  const { isDriverOnline, toggleDriverOnline, currentRide, acceptRide, updateRideStatus, updateDriverLocation, triggerSOSAlert } = useRide();
  const [hasIncomingRequest, setHasIncomingRequest] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(LEBANON_LOCATIONS[0]);

  const handleToggleOnline = () => {
    toggleDriverOnline();
    if (!isDriverOnline) {
      // Simulate incoming ride request after going online
      setTimeout(() => {
        setHasIncomingRequest(true);
      }, 5000);
    } else {
      setHasIncomingRequest(false);
    }
  };

  const handleAcceptRide = () => {
    setHasIncomingRequest(false);
    // Simulate accepting a ride
    const mockRide = {
      id: Date.now().toString(),
      clientId: '1',
      pickup: { latitude: 33.8938, longitude: 35.5018, address: 'Hamra, Beirut' },
      dropoff: { latitude: 33.8750, longitude: 35.4444, address: 'Achrafieh, Beirut' },
      status: 'accepted' as const,
      fare: 8500,
      estimatedDuration: 15,
      createdAt: new Date()
    };
    acceptRide(mockRide.id, user?.id || '2');
    setShowMap(true);
  };

  const handleDeclineRide = () => {
    setHasIncomingRequest(false);
    Alert.alert('Ride Declined', 'Looking for another ride request...');
  };

  const handleUpdateStatus = (status: 'on_way' | 'started' | 'completed') => {
    updateRideStatus(status);
    if (status === 'completed') {
      Alert.alert('Ride Completed', 'Great job! Payment has been processed.');
      setShowMap(false);
    }
  };

  const handleSOSPress = () => {
    Alert.alert(
      'Emergency SOS',
      'This will send an emergency alert to authorities and the passenger. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send SOS', 
          style: 'destructive',
          onPress: () => triggerSOSAlert(currentLocation)
        }
      ]
    );
  };

  const handleLocationUpdate = (location: any) => {
    const newLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
      address: 'Current Location'
    };
    setCurrentLocation(newLocation);
    updateDriverLocation(newLocation);
  };

  const getStatusColor = () => {
    if (!isDriverOnline) return '#6b7280';
    if (currentRide) return '#8b5cf6';
    return '#10b981';
  };

  const getStatusText = () => {
    if (!isDriverOnline) return 'You are offline';
    if (currentRide) {
      switch (currentRide.status) {
        case 'accepted': return 'Ride accepted - Navigate to pickup';
        case 'on_way': return 'On the way to pickup';
        case 'started': return 'Trip in progress';
        default: return 'Available for rides';
      }
    }
    return 'Available for rides';
  };

  if (showMap && currentRide) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mapContainer}>
          <MapView
            pickup={currentRide.pickup}
            dropoff={currentRide.dropoff}
            driverLocation={currentLocation}
            showRoute={true}
            testID="rider-map"
          />
          
          <View style={styles.mapOverlay}>
            <View style={[styles.statusContainer, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
            
            <View style={styles.navigationCard}>
              <Text style={styles.navigationTitle}>
                {currentRide.status === 'accepted' ? 'Navigate to Pickup' : 
                 currentRide.status === 'on_way' ? 'Pickup Passenger' :
                 'Navigate to Destination'}
              </Text>
              <Text style={styles.navigationAddress}>
                {currentRide.status === 'started' ? currentRide.dropoff.address : currentRide.pickup.address}
              </Text>
              
              <View style={styles.navigationActions}>
                <TouchableOpacity style={styles.callButton}>
                  <Phone size={16} color="white" />
                  <Text style={styles.callButtonText}>Call Passenger</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sosButton} onPress={handleSOSPress}>
                  <AlertTriangle size={16} color="white" />
                  <Text style={styles.sosButtonText}>SOS</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.rideActions}>
              {currentRide.status === 'accepted' && (
                <TouchableOpacity
                  style={styles.statusButton}
                  onPress={() => handleUpdateStatus('on_way')}
                >
                  <Text style={styles.statusButtonText}>I&apos;m on my way</Text>
                </TouchableOpacity>
              )}
              {currentRide.status === 'on_way' && (
                <TouchableOpacity
                  style={styles.statusButton}
                  onPress={() => handleUpdateStatus('started')}
                >
                  <Text style={styles.statusButtonText}>Start Trip</Text>
                </TouchableOpacity>
              )}
              {currentRide.status === 'started' && (
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: '#10b981' }]}
                  onPress={() => handleUpdateStatus('completed')}
                >
                  <Text style={styles.statusButtonText}>Complete Trip</Text>
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
        colors={isDriverOnline ? ['#10b981', '#059669'] : ['#6b7280', '#4b5563']}
        style={styles.header}
      >
        <Text style={styles.greeting}>Hello, {user?.name}!</Text>
        <Text style={styles.subtitle}>
          {isDriverOnline ? 'You are online and ready to drive' : 'Go online to start earning'}
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={[styles.statusContainer, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>

        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: isDriverOnline ? '#ef4444' : '#10b981' }]}
          onPress={handleToggleOnline}
          testID="toggle-online-button"
        >
          <Power size={24} color="white" />
          <Text style={styles.toggleButtonText}>
            {isDriverOnline ? 'Go Offline' : 'Go Online'}
          </Text>
        </TouchableOpacity>

        {hasIncomingRequest && (
          <View style={styles.requestContainer}>
            <Text style={styles.requestTitle}>New Ride Request!</Text>
            
            <View style={styles.requestDetails}>
              <View style={styles.locationItem}>
                <MapPin size={16} color="#10b981" />
                <Text style={styles.locationText}>Pickup: Hamra, Beirut</Text>
              </View>
              <View style={styles.locationItem}>
                <Navigation size={16} color="#ef4444" />
                <Text style={styles.locationText}>Dropoff: Achrafieh, Beirut</Text>
              </View>
              <View style={styles.locationItem}>
                <DollarSign size={16} color="#6366f1" />
                <Text style={styles.locationText}>Fare: 8,500 LBP</Text>
              </View>
              <View style={styles.locationItem}>
                <Clock size={16} color="#f59e0b" />
                <Text style={styles.locationText}>Distance: 3.2 km</Text>
              </View>
            </View>

            <View style={styles.requestActions}>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={handleDeclineRide}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAcceptRide}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {currentRide && (
          <View style={styles.activeRideContainer}>
            <Text style={styles.activeRideTitle}>Current Ride</Text>
            
            <TouchableOpacity 
              style={styles.viewMapButton}
              onPress={() => setShowMap(true)}
            >
              <Text style={styles.viewMapButtonText}>View Navigation</Text>
            </TouchableOpacity>
            
            <View style={styles.rideInfo}>
              <View style={styles.locationItem}>
                <MapPin size={16} color="#10b981" />
                <Text style={styles.locationText}>{currentRide.pickup.address}</Text>
              </View>
              <View style={styles.locationItem}>
                <Navigation size={16} color="#ef4444" />
                <Text style={styles.locationText}>{currentRide.dropoff.address}</Text>
              </View>
              <View style={styles.locationItem}>
                <DollarSign size={16} color="#6366f1" />
                <Text style={styles.locationText}>{currentRide.fare} LBP</Text>
              </View>
            </View>

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

            <View style={styles.rideActions}>
              {currentRide.status === 'accepted' && (
                <TouchableOpacity
                  style={styles.statusButton}
                  onPress={() => handleUpdateStatus('on_way')}
                >
                  <Text style={styles.statusButtonText}>I&apos;m on my way</Text>
                </TouchableOpacity>
              )}
              {currentRide.status === 'on_way' && (
                <TouchableOpacity
                  style={styles.statusButton}
                  onPress={() => handleUpdateStatus('started')}
                >
                  <Text style={styles.statusButtonText}>Start Trip</Text>
                </TouchableOpacity>
              )}
              {currentRide.status === 'started' && (
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: '#10b981' }]}
                  onPress={() => handleUpdateStatus('completed')}
                >
                  <Text style={styles.statusButtonText}>Complete Trip</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {isDriverOnline && !hasIncomingRequest && !currentRide && (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingText}>Waiting for ride requests...</Text>
            <Text style={styles.waitingSubtext}>Stay nearby for faster pickups</Text>
          </View>
        )}
      </View>
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
  navigationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 80,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  navigationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  navigationAddress: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  navigationActions: {
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
    marginBottom: 16,
  },
  viewMapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  driverActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
  statusContainer: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  requestContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  requestTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  requestDetails: {
    marginBottom: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  declineButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  activeRideContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activeRideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  rideInfo: {
    marginBottom: 16,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  callButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  rideActions: {
    gap: 12,
  },
  statusButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statusButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  waitingContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  waitingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  waitingSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
});