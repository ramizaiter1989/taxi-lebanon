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
import AsyncStorage from '@react-native-async-storage/async-storage';
import mapHTML from '@/utils/mapHTML';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/constants/config';
import { getOSRMRoute } from '@/utils/getORSRoute';

// ----- TYPES -----
type RideStatus = 'accepted' | 'arrived' | 'in_progress' | 'completed';
type Ride = {
  id: string;
  clientId: string;
  pickup: Location;
  dropoff: Location;
  status: RideStatus;
  fare: number;
  estimatedDuration: number;
  createdAt: Date;
};

// ----- SCREEN -----
export default function RiderHomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { isDriverOnline, toggleDriverOnline } = useRide();
  const { setUserLocation } = useMap();

  const [hasIncomingRequest, setHasIncomingRequest] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [localUserLocation, setLocalUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location>({
    latitude: 33.8938,
    longitude: 35.5018,
    address: 'Current Location',
  });
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [availableRide, setAvailableRide] = useState<any>(null);
  const [liveRideData, setLiveRideData] = useState<any>(null);
  const [isCheckingActiveRide, setIsCheckingActiveRide] = useState(true);

  const webViewRef = useRef<WebView>(null);
  const currentRideRef = useRef<Ride | null>(null);
  const isAcceptingRideRef = useRef(false);
  const isFetchingRef = useRef(false);
  const liveRideIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    currentRideRef.current = currentRide;
  }, [currentRide]);

  // ----- API HELPERS -----
  const getAuthToken = async () => await AsyncStorage.getItem('token');

  const fetchAvailableRides = async () => {
    if (currentRideRef.current || isAcceptingRideRef.current || isFetchingRef.current) {
      console.log('Skipping fetch - ride already in progress or accepting');
      return;
    }
    isFetchingRef.current = true;
    try {
      const token = await getAuthToken();
      if (!token) {
        isFetchingRef.current = false;
        return;
      }
      const response = await fetch(`${API_BASE_URL}/rides/available`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch available rides');
      const data = await response.json();
      const ridesArray = Array.isArray(data) ? data : data?.rides || [];
      if (ridesArray.length > 0) {
        const ride = ridesArray[0];
        setAvailableRide(ride);
        setPickupLocation({
          latitude: parseFloat(ride.origin_lat),
          longitude: parseFloat(ride.origin_lng),
          address: ride.origin_address || 'Pickup Location',
        });
        setDropoffLocation({
          latitude: parseFloat(ride.destination_lat),
          longitude: parseFloat(ride.destination_lng),
          address: ride.destination_address || 'Destination',
        });
        setHasIncomingRequest(true);
      } else {
        setHasIncomingRequest(false);
        setAvailableRide(null);
      }
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      isFetchingRef.current = false;
    }
  };

  const acceptRideAPI = async (rideId: string) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/rides/${rideId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to accept ride');
    return data;
  };

  const markArrivedAPI = async (rideId: string) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/rides/${rideId}/arrived`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to mark ride as arrived');
    return response.json();
  };

  const completeRideAPI = async (rideId: string) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/rides/${rideId}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to complete ride');
    return response.json();
  };

  const cancelRideAPI = async (rideId: string) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/rides/${rideId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to cancel ride');
    return response.json();
  };

  const fetchLiveRideData = async () => {
  try {
    const token = await getAuthToken();
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/rides/live`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      console.warn('Failed to fetch live ride data');
      return;
    }

    const result = await response.json();
    console.log('Live ride data received:', result.data?.route_info?.phase);
    setLiveRideData(result.data);

    if (result.data && webViewRef.current && showMap) {
      const { origin, destination, driver, route_info } = result.data;

      // Clear existing markers and route
      webViewRef.current.postMessage(JSON.stringify({ type: 'clearRoute' }));
      webViewRef.current.postMessage(JSON.stringify({ type: 'clearMarkers' }));

      // Add driver current location marker
      if (driver?.current_location) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'setUserLocation',
          lat: driver.current_location.lat,
          lng: driver.current_location.lng,
        }));
      }

      // Add pickup marker
      webViewRef.current.postMessage(JSON.stringify({
        type: 'addRouteMarker',
        lat: origin.lat,
        lng: origin.lng,
        markerType: 'start',
        title: origin.address || 'Pickup',
      }));

      // Add destination marker
      webViewRef.current.postMessage(JSON.stringify({
        type: 'addRouteMarker',
        lat: destination.lat,
        lng: destination.lng,
        markerType: 'end',
        title: destination.address || 'Destination',
      }));

      // Draw route based on current phase
      try {
        if (route_info.phase === 'to_pickup' && driver?.current_location) {
          console.log('Drawing route: Driver → Pickup');
          const start: [number, number] = [driver.current_location.lng, driver.current_location.lat];
          const end: [number, number] = [origin.lng, origin.lat];
          const route = await getOSRMRoute(start, end);
          webViewRef.current.postMessage(JSON.stringify({
            type: 'drawRoute',
            coordinates: route.coordinates,
            color: '#FF85C0',
          }));
        } else if (route_info.phase === 'in_trip') {
          console.log('Drawing route: Pickup → Destination');
          const start: [number, number] = [origin.lng, origin.lat];
          const end: [number, number] = [destination.lng, destination.lat];
          const route = await getOSRMRoute(start, end);
          webViewRef.current.postMessage(JSON.stringify({
            type: 'drawRoute',
            coordinates: route.coordinates,
            color: '#10b981',
          }));
        }
      } catch (error) {
        console.error('Error drawing route:', error);
        // Fallback to simple line route
        if (route_info.phase === 'to_pickup' && driver?.current_location) {
          webViewRef.current.postMessage(JSON.stringify({
            type: 'showRoute',
            start: { lat: driver.current_location.lat, lng: driver.current_location.lng },
            end: { lat: origin.lat, lng: origin.lng },
          }));
        } else if (route_info.phase === 'in_trip') {
          webViewRef.current.postMessage(JSON.stringify({
            type: 'showRoute',
            start: { lat: origin.lat, lng: origin.lng },
            end: { lat: destination.lat, lng: destination.lng },
          }));
        }
      }
    }
    return result.data;
  } catch (error) {
    console.error('Error fetching live ride data:', error);
    return null;
  }
};


  // ----- EFFECTS -----
  useEffect(() => {
    const checkActiveRide = async () => {
      setIsCheckingActiveRide(true);
      if ((global as any).ridePollingInterval) {
        clearInterval((global as any).ridePollingInterval);
        (global as any).ridePollingInterval = null;
      }
      const liveData = await fetchLiveRideData();
      if (liveData && liveData.status !== 'completed' && liveData.status !== 'cancelled') {
        isAcceptingRideRef.current = true;
        isFetchingRef.current = true;
        const rideStatus = liveData.status === 'accepted' ? 'accepted' :
                          liveData.status === 'arrived' ? 'arrived' :
                          liveData.status === 'in_progress' ? 'in_progress' : 'accepted';
        const restoredRide = {
          id: String(liveData.id),
          clientId: String(liveData.passenger?.id || '1'),
          pickup: {
            latitude: parseFloat(liveData.origin.lat),
            longitude: parseFloat(liveData.origin.lng),
            address: liveData.origin.address,
          },
          dropoff: {
            latitude: parseFloat(liveData.destination.lat),
            longitude: parseFloat(liveData.destination.lng),
            address: liveData.destination.address,
          },
          status: rideStatus as RideStatus,
          fare: parseFloat(liveData.fare || '0'),
          estimatedDuration: liveData.duration || 15,
          createdAt: new Date(liveData.timestamps?.requested_at || Date.now()),
        };
        setCurrentRide(restoredRide);
        setLiveRideData(liveData);
      } else {
        isAcceptingRideRef.current = false;
        isFetchingRef.current = false;
        if (isDriverOnline) {
          await fetchAvailableRides();
          const pollInterval = setInterval(() => fetchAvailableRides(), 10000);
          (global as any).ridePollingInterval = pollInterval;
        }
      }
      setIsCheckingActiveRide(false);
    };
    checkActiveRide();
  }, []);

  useEffect(() => {
    if (currentRide && webViewRef.current && showMap) {
      console.log('Setting up route for ride:', currentRide.id);
      fetchLiveRideData();
      if (liveRideIntervalRef.current) {
        clearInterval(liveRideIntervalRef.current);
      }
      liveRideIntervalRef.current = setInterval(() => {
        fetchLiveRideData();
      }, 5000);
    }
    return () => {
      if (liveRideIntervalRef.current) {
        clearInterval(liveRideIntervalRef.current);
        liveRideIntervalRef.current = null;
      }
    };
  }, [currentRide, showMap]);

  // ----- HANDLERS -----
  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Map message received:', data);

      if (data.type === 'routeDrawn') {
        console.log('Route successfully drawn on map');
      } else if (data.type === 'error') {
        console.error('Map error:', data.message);
        Alert.alert('Map Error', data.message);
      } else if (data.type === 'locationUpdated') {
        console.log('User location updated:', data.lat, data.lng);
      }
    } catch (error) {
      console.error('Error parsing map message:', error);
    }
  };

  const handleAcceptRide = async () => {
    if (!availableRide || !pickupLocation || !dropoffLocation) {
      Alert.alert('Error', 'No ride data or locations.');
      return;
    }
    if (isAcceptingRideRef.current || currentRideRef.current) {
      console.log('Already accepting or have active ride');
      return;
    }
    isAcceptingRideRef.current = true;
    if ((global as any).ridePollingInterval) {
      clearInterval((global as any).ridePollingInterval);
      (global as any).ridePollingInterval = null;
    }
    isFetchingRef.current = true;
    setHasIncomingRequest(false);
    try {
      const response = await acceptRideAPI(availableRide.id);
      if (response.message || response.ride) {
        const newRide = {
          id: String(availableRide.id),
          clientId: String(availableRide.passenger_id || availableRide.passenger?.id || '1'),
          pickup: pickupLocation,
          dropoff: dropoffLocation,
          status: 'accepted' as RideStatus,
          fare: parseFloat(availableRide.fare || availableRide.calculated_fare || '0'),
          estimatedDuration: availableRide.duration || 15,
          createdAt: new Date(availableRide.created_at || Date.now()),
        };
        setCurrentRide(newRide);
        setAvailableRide(null);
        Alert.alert('Success', 'Ride accepted successfully!');
        await fetchLiveRideData();
      } else if (response.error) {
        Alert.alert('Error', response.error);
        isAcceptingRideRef.current = false;
        isFetchingRef.current = false;
        setHasIncomingRequest(true);
        if (isDriverOnline && !currentRideRef.current) {
          const pollInterval = setInterval(() => fetchAvailableRides(), 10000);
          (global as any).ridePollingInterval = pollInterval;
        }
      }
    } catch (error: any) {
      console.error('Accept ride error:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to accept ride';
      Alert.alert('Error', errorMessage);
      isAcceptingRideRef.current = false;
      isFetchingRef.current = false;
      setHasIncomingRequest(true);
      if (isDriverOnline && !currentRideRef.current) {
        const pollInterval = setInterval(() => fetchAvailableRides(), 10000);
        (global as any).ridePollingInterval = pollInterval;
      }
    }
  };

  // ----- RENDER -----
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {isCheckingActiveRide ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF85C0" />
          <Text style={styles.loadingText}>Checking for active rides...</Text>
        </View>
      ) : (
        <>
          <WebView
            ref={webViewRef}
            source={{ html: mapHTML }}
            style={styles.map}
            onMessage={handleMapMessage}
            onLoadEnd={() => {
              console.log('Map loaded in driver view');
              setIsLoading(false);
              if (localUserLocation) {
                webViewRef.current?.postMessage(JSON.stringify({
                  type: 'setUserLocation',
                  ...localUserLocation,
                }));
                webViewRef.current?.postMessage(JSON.stringify({
                  type: 'setView',
                  ...localUserLocation,
                  zoom: 14,
                }));
              }
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error: ', nativeEvent);
              setIsLoading(false);
            }}
          />
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF85C0" />
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          )}
          {/* Rest of your UI components */}
        </>
      )}
    </SafeAreaView>
  );
}

// ----- STYLES -----
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFE5F1',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 182, 217, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  loadingText: {
    color: '#FF85C0',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  // ... rest of your styles
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#FF85C0',
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
  floatingCard: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    maxHeight: '70%',
  },
  cardContent: {
    backgroundColor: 'rgba(255, 245, 250, 0.62)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#FF85C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  statusContainer: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FF85C0',
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
    shadowColor: '#FF85C0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    pointerEvents: 'auto',
  },
  statusText: {
    color: '#831843',
    fontSize: 15,
    fontWeight: '700',
  },
  toggleButton: {
    borderRadius: 16,
    marginBottom: 0,
    overflow: 'hidden',
    shadowColor: '#FF85C0',
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
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#FF85C0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  requestGradient: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFE5F1',
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
    backgroundColor: 'rgba(255, 133, 192, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: '#9d174d',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 15,
    color: '#831843',
    fontWeight: '600',
  },
  routeDivider: {
    width: 2,
    height: 20,
    backgroundColor: '#FFE5F1',
    marginLeft: 17,
    marginVertical: 4,
  },
  rideMetrics: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#FFE5F1',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 133, 192, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  metricText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#831843',
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
    color: '#831843',
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
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#FF85C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  activeRideGradient: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFE5F1',
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
    color: '#831843',
  },
  activeRideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 133, 192, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF85C0',
    marginRight: 6,
  },
  activeRideBadgeText: {
    color: '#FF85C0',
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
  fareDivider: {
    height: 1,
    backgroundColor: '#FFE5F1',
    marginVertical: 12,
  },
  fareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  fareAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#831843',
    marginLeft: 8,
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
  cancelButton: {
    borderRadius: 12,
    overflow: 'hidden',
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
    borderColor: '#FFE5F1',
    borderRadius: 18,
  },
  waitingPulse: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 133, 192, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  waitingText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 8,
  },
  waitingSubtext: {
    fontSize: 14,
    color: '#9d174d',
    fontWeight: '500',
  },
  navigationCard: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF85C0',
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
    color: '#831843',
    marginBottom: 8,
  },
  navigationAddress: {
    fontSize: 16,
    color: '#9d174d',
    marginBottom: 16,
  },
  navigationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  etaContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 133, 192, 0.1)',
    borderRadius: 10,
  },
  etaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#831843',
  },
  rideActionsMap: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    gap: 12,
  },
  passengerInfo: {
    backgroundColor: '#FFF5FA',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    marginBottom: 6,
    shadowColor: '#FF85C0',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  passengerLabel: {
    color: '#831843',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF2E78',
  },
});