import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { Power, MapPin, Navigation, Clock, DollarSign, Phone, AlertTriangle, Zap } from 'lucide-react-native';
import { useRide } from '@/hooks/ride-store';
import { useUser } from '@/hooks/user-store';
import { useMap } from '@/providers/MapProvider';
import { Location } from '@/types/user';
import * as LocationService from 'expo-location';
import mapHTML from '@/utils/mapHTML';
import { useRouter } from 'expo-router';

// --- Types ---
type RideStatus = 'accepted' | 'in_progress' | 'started' | 'completed';

// --- Component ---
export default function RiderHomeScreen() {

  const router = useRouter();
   const rideId = 4; 
  // --- State and Refs ---
  const { user } = useUser();
  const {
    isDriverOnline,
    toggleDriverOnline,
    currentRide,
    acceptRide,
    updateRideStatus,
    updateDriverLocation,
    triggerSOSAlert,
  } = useRide();
  const { setUserLocation } = useMap();
  const [hasIncomingRequest, setHasIncomingRequest] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const [localUserLocation, setLocalUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location>({
    latitude: 33.8938,
    longitude: 35.5018,
    address: 'Current Location',
  });

  // --- Location Tracking ---
  useEffect(() => {
    let locationSubscription: LocationService.LocationSubscription | null = null;
    const startLocationTracking = async () => {
      try {
        const { status } = await LocationService.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }
        const location = await LocationService.getCurrentPositionAsync({
          accuracy: LocationService.Accuracy.High,
        });

        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: 'Current Location',
        };
        const mapCoords = { lat: location.coords.latitude, lng: location.coords.longitude };

        setCurrentLocation(coords);
        setLocalUserLocation(mapCoords);
        setUserLocation(mapCoords);
        updateDriverLocation(coords);

        if (webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({ type: 'setUserLocation', ...mapCoords }));
        }

        if (isDriverOnline) {
          locationSubscription = await LocationService.watchPositionAsync(
            {
              accuracy: LocationService.Accuracy.High,
              timeInterval: 10000,
              distanceInterval: 50,
            },
            (location) => {
              const newCoords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                address: 'Current Location',
              };
              const newMapCoords = { lat: location.coords.latitude, lng: location.coords.longitude };

              setCurrentLocation(newCoords);
              setLocalUserLocation(newMapCoords);
              setUserLocation(newMapCoords);
              updateDriverLocation(newCoords);

              if (webViewRef.current) {
                webViewRef.current.postMessage(JSON.stringify({ type: 'setUserLocation', ...newMapCoords }));
              }
            }
          );
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    startLocationTracking();

    return () => {
      if (locationSubscription && typeof locationSubscription.remove === 'function') {
        locationSubscription.remove();
      }
    };
  }, [isDriverOnline, setUserLocation, updateDriverLocation]);

  // --- Map Route Handling ---
  useEffect(() => {
    if (currentRide && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'showRoute',
        start: { lat: currentRide.pickup.latitude, lng: currentRide.pickup.longitude },
        end: { lat: currentRide.dropoff.latitude, lng: currentRide.dropoff.longitude },
      }));

      webViewRef.current.postMessage(JSON.stringify({
        type: 'addRouteMarker',
        lat: currentRide.pickup.latitude,
        lng: currentRide.pickup.longitude,
        markerType: 'start',
      }));

      webViewRef.current.postMessage(JSON.stringify({
        type: 'addRouteMarker',
        lat: currentRide.dropoff.latitude,
        lng: currentRide.dropoff.longitude,
        markerType: 'end',
      }));
    }
  }, [currentRide]);

  // --- Handlers ---
  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Map message:', data);
    } catch (error) {
      console.error('Error parsing map message:', error);
    }
  };

  const handleToggleOnline = () => {
    toggleDriverOnline();
    if (!isDriverOnline) {
      setTimeout(() => setHasIncomingRequest(true), 5000);
    } else {
      setHasIncomingRequest(false);
    }
  };

  const handleAcceptRide = () => {
    setHasIncomingRequest(false);
    const mockRide = {
      id: Date.now().toString(),
      clientId: '1',
      pickup: { latitude: 33.8938, longitude: 35.5018, address: 'Hamra, Beirut' },
      dropoff: { latitude: 33.8750, longitude: 35.4444, address: 'Achrafieh, Beirut' },
      status: 'accepted' as const,
      fare: 8500,
      estimatedDuration: 15,
      createdAt: new Date(),
    };
    acceptRide(mockRide.id, user?.id || '2');
    setShowMap(true);
  };

  const handleDeclineRide = () => {
    setHasIncomingRequest(false);
    Alert.alert('Ride Declined', 'Looking for another ride request...');
  };

  const handleUpdateStatus = (status: RideStatus) => {
    updateRideStatus(status);
    if (status === 'completed') {
      Alert.alert('Ride Completed', 'Great job! Payment has been processed.');
      setShowMap(false);
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({ type: 'clearRoute' }));
      }
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
          onPress: () => triggerSOSAlert(currentLocation),
        },
      ]
    );
  };

  // --- UI Helpers ---
  const getStatusColor = (): readonly [string, string] => {
    if (!isDriverOnline) return ['#4b5563', '#374151'];
    if (currentRide) return ['#a855f7', '#9333ea'];
    return ['#ec4899', '#db2777'];
  };

  const getStatusText = () => {
    if (!isDriverOnline) return 'You are offline';
    if (currentRide) {
      switch (currentRide.status) {
        case 'accepted': return 'Ride accepted - Navigate to pickup';
        case 'in_progress': return 'On the way to pickup';
        case 'started': return 'Trip in progress';
        default: return 'Available for rides';
      }
    }
    return 'Available for rides';
  };

  // --- Render Map View ---
  if (showMap && currentRide) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.overlay}>
          <LinearGradient
            colors={getStatusColor()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statusContainerMap}
          >
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </LinearGradient>
          <View style={styles.navigationCard}>
            <LinearGradient colors={['#1f1f1f', '#2d2d2d']} style={styles.navigationCardGradient}>
              <Text style={styles.navigationTitle}>
                {currentRide.status === 'accepted' ? 'Navigate to Pickup' :
                 currentRide.status === 'in_progress' ? 'Pickup Passenger' :
                 'Navigate to Destination'}
              </Text>
              <Text style={styles.navigationAddress}>
                {currentRide.status === 'started' ? currentRide.dropoff.address : currentRide.pickup.address}
              </Text>
              <View style={styles.navigationActions}>
                <TouchableOpacity style={styles.callButton}>
                  <LinearGradient colors={['#ec4899', '#db2777']} style={styles.actionButtonGradient}>
                    <Phone size={16} color="white" />
                    <Text style={styles.callButtonText}>Call</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sosButton} onPress={handleSOSPress}>
                  <LinearGradient colors={['#dc2626', '#b91c1c']} style={styles.actionButtonGradient}>
                    <AlertTriangle size={16} color="white" />
                    <Text style={styles.sosButtonText}>SOS</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
          <View style={styles.rideActionsMap}>
            {currentRide.status === 'accepted' && (
              <TouchableOpacity style={styles.statusButton} onPress={() => handleUpdateStatus('in_progress')}>
                <LinearGradient colors={['#ec4899', '#db2777']} style={styles.statusButtonGradient}>
                  <Text style={styles.statusButtonText}>I'm on my way</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            {currentRide.status === 'in_progress' && (
              <TouchableOpacity style={styles.statusButton} onPress={() => handleUpdateStatus('started')}>
                <LinearGradient colors={['#ec4899', '#db2777']} style={styles.statusButtonGradient}>
                  <Text style={styles.statusButtonText}>Start Trip</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            {currentRide.status === 'started' && (
              <TouchableOpacity style={styles.statusButton} onPress={() => handleUpdateStatus('completed')}>
                <LinearGradient colors={['#10b981', '#059669']} style={styles.statusButtonGradient}>
                  <Text style={styles.statusButtonText}>Complete Trip</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <WebView
          ref={webViewRef}
          source={{ html: mapHTML }}
          style={styles.map}
          onMessage={handleMapMessage}
          onLoadEnd={() => {
            setIsLoading(false);
            if (localUserLocation) {
              webViewRef.current?.postMessage(JSON.stringify({ type: 'setUserLocation', ...localUserLocation }));
              webViewRef.current?.postMessage(JSON.stringify({ type: 'setView', ...localUserLocation, zoom: 15 }));
            }
          }}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error: ', nativeEvent);
          }}
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ec4899" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // --- Render Main Dashboard ---
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={isDriverOnline ? ['#831843', '#9d174d', '#be185d'] : ['#1f1f1f', '#2d2d2d', '#3d3d3d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Hello, {user?.name}! ✨</Text>
              <Text style={styles.subtitle}>
                {isDriverOnline ? 'You are online and ready to drive' : 'Go online to start earning'}
              </Text>
            </View>
            {isDriverOnline && (
              <View style={styles.onlinePulse}>
                <Zap size={20} color="#fbbf24" fill="#fbbf24" />
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
<View style={{ margin: 20 }}>
  <TouchableOpacity
    style={{
      backgroundColor: '#007AFF',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    }}
    onPress={() => router.push('./TestChat')}
  >
    <Text style={{ color: 'white', fontWeight: 'bold' }}>Open Chat</Text>
  </TouchableOpacity>
</View>

      <View style={styles.content}>
        <LinearGradient colors={getStatusColor()} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.statusContainer}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </LinearGradient>

        <TouchableOpacity style={styles.toggleButton} onPress={handleToggleOnline} testID="toggle-online-button">
          <LinearGradient colors={isDriverOnline ? ['#dc2626', '#b91c1c'] : ['#ec4899', '#db2777']} style={styles.toggleButtonGradient}>
            <Power size={24} color="white" />
            <Text style={styles.toggleButtonText}>{isDriverOnline ? 'Go Offline' : 'Go Online'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {hasIncomingRequest && <RideRequestCard onAccept={handleAcceptRide} onDecline={handleDeclineRide} />}
        {currentRide && !showMap && <ActiveRideCard ride={currentRide} onSOSPress={handleSOSPress} onViewMap={() => setShowMap(true)} onUpdateStatus={handleUpdateStatus} />}
        {isDriverOnline && !hasIncomingRequest && !currentRide && <WaitingForRide />}
      </View>
    </SafeAreaView>
  );
}

// --- Subcomponents ---
const RideRequestCard = ({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) => (
  <View style={styles.requestContainer}>
    <LinearGradient colors={['#1f1f1f', '#2d2d2d']} style={styles.requestGradient}>
      <View style={styles.requestHeader}>
        <LinearGradient colors={['#ec4899', '#f472b6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.requestBadge}>
          <Text style={styles.requestTitle}>New Ride Request! 🚗</Text>
        </LinearGradient>
      </View>
      <View style={styles.requestDetails}>
        <LocationItem icon={<MapPin size={16} color="#ec4899" />} label="Pickup" text="Hamra, Beirut" />
        <View style={styles.routeDivider} />
        <LocationItem icon={<Navigation size={16} color="#f472b6" />} label="Drop-off" text="Achrafieh, Beirut" />
        <View style={styles.rideMetrics}>
          <MetricItem icon={<DollarSign size={18} color="#fbbf24" />} text="8,500 LBP" />
          <MetricItem icon={<Clock size={18} color="#a78bfa" />} text="3.2 km" />
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
          <LinearGradient colors={['#374151', '#4b5563']} style={styles.actionButtonGradient}>
            <Text style={styles.declineButtonText}>Decline</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
          <LinearGradient colors={['#ec4899', '#db2777']} style={styles.actionButtonGradient}>
            <Text style={styles.acceptButtonText}>Accept Ride</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  </View>
);

const ActiveRideCard = ({ ride, onSOSPress, onViewMap, onUpdateStatus }: {
  ride: any;
  onSOSPress: () => void;
  onViewMap: () => void;
  onUpdateStatus: (status: RideStatus) => void;
}) => (
  <View style={styles.activeRideContainer}>
    <LinearGradient colors={['#1f1f1f', '#2d2d2d']} style={styles.activeRideGradient}>
      <View style={styles.activeRideHeader}>
        <Text style={styles.activeRideTitle}>Current Ride</Text>
        <View style={styles.activeRideBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.activeRideBadgeText}>In Progress</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.viewMapButton} onPress={onViewMap}>
        <LinearGradient colors={['#ec4899', '#db2777']} style={styles.viewMapButtonGradient}>
          <Navigation size={18} color="white" />
          <Text style={styles.viewMapButtonText}>View Navigation</Text>
        </LinearGradient>
      </TouchableOpacity>
      <View style={styles.rideInfo}>
        <LocationItem icon={<MapPin size={16} color="#ec4899" />} text={ride.pickup.address} />
        <LocationItem icon={<Navigation size={16} color="#f472b6" />} text={ride.dropoff.address} />
        <LocationItem icon={<DollarSign size={16} color="#fbbf24" />} text={`${ride.fare} LBP`} />
      </View>
      <View style={styles.driverActions}>
        <TouchableOpacity style={styles.callButton}>
          <LinearGradient colors={['#ec4899', '#db2777']} style={styles.actionButtonGradient}>
            <Phone size={16} color="white" />
            <Text style={styles.callButtonText}>Call</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sosButton} onPress={onSOSPress}>
          <LinearGradient colors={['#dc2626', '#b91c1c']} style={styles.actionButtonGradient}>
            <AlertTriangle size={16} color="white" />
            <Text style={styles.sosButtonText}>SOS</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <View style={styles.rideActions}>
        {ride.status === 'accepted' && (
          <TouchableOpacity style={styles.statusButton} onPress={() => onUpdateStatus('in_progress')}>
            <LinearGradient colors={['#ec4899', '#db2777']} style={styles.statusButtonGradient}>
              <Text style={styles.statusButtonText}>I'm on my way</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {ride.status === 'in_progress' && (
          <TouchableOpacity style={styles.statusButton} onPress={() => onUpdateStatus('started')}>
            <LinearGradient colors={['#ec4899', '#db2777']} style={styles.statusButtonGradient}>
              <Text style={styles.statusButtonText}>Start Trip</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {ride.status === 'started' && (
          <TouchableOpacity style={styles.statusButton} onPress={() => onUpdateStatus('completed')}>
            <LinearGradient colors={['#10b981', '#059669']} style={styles.statusButtonGradient}>
              <Text style={styles.statusButtonText}>Complete Trip</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  </View>
);

const WaitingForRide = () => (
  <View style={styles.waitingContainer}>
    <LinearGradient colors={['#1f1f1f', '#2d2d2d']} style={styles.waitingGradient}>
      <View style={styles.waitingPulse}>
        <Zap size={32} color="#ec4899" fill="#ec4899" />
      </View>
      <Text style={styles.waitingText}>Waiting for ride requests...</Text>
      <Text style={styles.waitingSubtext}>Stay nearby for faster pickups</Text>
    </LinearGradient>
  </View>
);

const LocationItem = ({ icon, label, text }: { icon: React.ReactNode; label?: string; text: string }) => (
  <View style={styles.locationItem}>
    <View style={styles.iconCircle}>{icon}</View>
    {label && <Text style={styles.locationLabel}>{label}</Text>}
    <Text style={styles.locationText}>{text}</Text>
  </View>
);

const MetricItem = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <View style={styles.metricItem}>
    {icon}
    <Text style={styles.metricText}>{text}</Text>
  </View>
);

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    pointerEvents: 'box-none',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  loadingText: {
    color: '#ec4899',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    paddingTop: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  onlinePulse: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusContainer: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  statusContainerMap: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    pointerEvents: 'auto',
  },
  statusText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  toggleButton: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  toggleButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  requestContainer: {
    borderRadius: 18,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  requestGradient: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#ec4899',
    borderRadius: 18,
  },
  requestHeader: {
    marginBottom: 18,
  },
  requestBadge: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  requestDetails: {
    marginBottom: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
  },
  routeDivider: {
    width: 2,
    height: 20,
    backgroundColor: '#374151',
    marginLeft: 17,
    marginVertical: 4,
  },
  rideMetrics: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  metricText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  declineButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  activeRideContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  activeRideGradient: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#ec4899',
    borderRadius: 18,
  },
  activeRideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activeRideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  activeRideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ec4899',
    marginRight: 6,
  },
  activeRideBadgeText: {
    color: '#ec4899',
    fontSize: 12,
    fontWeight: '700',
  },
  viewMapButton: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  viewMapButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  viewMapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  rideInfo: {
    marginBottom: 16,
  },
  callButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  callButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '700',
  },
  sosButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sosButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '700',
  },
  driverActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  rideActions: {
    gap: 12,
  },
  statusButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusButtonGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  waitingContainer: {
    marginTop: 40,
    borderRadius: 18,
    overflow: 'hidden',
  },
  waitingGradient: {
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 18,
  },
  waitingPulse: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  waitingText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  waitingSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  navigationCard: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  navigationCardGradient: {
    padding: 20,
  },
  navigationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  navigationAddress: {
    fontSize: 16,
    color: '#d1d5db',
    marginBottom: 16,
  },
  navigationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rideActionsMap: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    gap: 12,
  },
});
