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
    // CRITICAL SAFEGUARDS: Multiple layers of protection
    if (currentRideRef.current) {
      console.log('🛑 Skipping fetch - ride already in progress:', currentRideRef.current.id);
      return;
    }
    
    if (isAcceptingRideRef.current) {
      console.log('🛑 Skipping fetch - currently accepting a ride');
      return;
    }
    
    if (isFetchingRef.current) {
      console.log('🛑 Skipping fetch - fetch already in progress');
      return;
    }
    
    // Mark that we're fetching
    isFetchingRef.current = true;
    
    try {
      const token = await getAuthToken();
      if (!token) {
        isFetchingRef.current = false;
        return;
      }
      
      // Double-check before making the API call
      if (currentRideRef.current || isAcceptingRideRef.current) {
        console.log('🛑 Aborting fetch - state changed during setup');
        isFetchingRef.current = false;
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/rides/available`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        isFetchingRef.current = false;
        throw new Error('Failed to fetch available rides');
      }
      
      const data = await response.json();
      
      // Triple-check after API call completes
      if (currentRideRef.current || isAcceptingRideRef.current) {
        console.log('🛑 Discarding fetch results - state changed during fetch');
        isFetchingRef.current = false;
        return;
      }
      
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
        console.log('✅ New ride available:', ride.id);
      } else {
        setHasIncomingRequest(false);
        setAvailableRide(null);
      }
    } catch (error) {
      console.error('❌ Error fetching rides:', error);
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
    
    if (!response.ok) {
      // Throw error with backend message
      throw new Error(data.error || 'Failed to accept ride');
    }
    
    return data;
  };

  const markArrivedAPI = async (rideId: string) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/rides/${rideId}/arrived`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to mark arrived');
    return response.json();
  };
  const completeRideAPI = async (rideId: string) => {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}/rides/${rideId}/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',  // ensures Laravel returns JSON
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to complete ride');
  }
  return response.json();
};


  const cancelRideAPI = async (rideId: string) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/rides/${rideId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        
    body: JSON.stringify({
      reason: 'changed_mind',  // choose one of your backend's allowed reasons
      note: 'User cancelled from app' // optional
    }),
    });
    const data = await response.json();

    if (!response.ok) {
      // Throw error with backend message
      throw new Error(data.error || 'Failed to cancel ride');
    }
    
    return data;
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
      console.log('📍 Live ride data received:', result.data?.route_info?.phase);
      setLiveRideData(result.data);
      
      // Update map with live route data
      if (result.data && webViewRef.current && showMap) {
        const { origin, destination, driver, route_info } = result.data;
        
        // Clear existing markers and route
        // webViewRef.current.postMessage(JSON.stringify({ type: 'clearRoute' }));
        webViewRef.current.postMessage(JSON.stringify({ type: 'clearMarkers' }));
        
        setTimeout(async () => {
          // Add driver current location marker
         

          if (driver?.current_location) {
            webViewRef.current?.postMessage(JSON.stringify({ 
              type: 'setUserLocation',
              lat: driver.current_location.lat,
              lng: driver.current_location.lng,
            }));
          }
          
          // Add pickup marker
          webViewRef.current?.postMessage(JSON.stringify({ 
            type: 'addRouteMarker', 
            lat: origin.lat, 
            lng: origin.lng, 
            markerType: 'start',
            title: origin.address || 'Pickup'
          }));
          
          // Add destination marker
          webViewRef.current?.postMessage(JSON.stringify({ 
            type: 'addRouteMarker', 
            lat: destination.lat, 
            lng: destination.lng, 
            markerType: 'end',
            title: destination.address || 'Destination'
          }));
          
          // Draw route based on current phase using OSRM
          try {
            let routeResponse;

// Check if driver is far from pickup
const isDriverNearPickup = driver?.current_location && origin
  ? Math.hypot(driver.current_location.lat - origin.lat, driver.current_location.lng - origin.lng) < 0.0005
  : false;

if (driver?.current_location && !isDriverNearPickup) {
  // Draw driver → pickup route
  console.log('🛣️ Drawing route: Driver → Pickup');
  routeResponse = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${driver.current_location.lng},${driver.current_location.lat};${origin.lng},${origin.lat}?overview=full&geometries=geojson`
  );
} else if (origin && destination) {
  // Draw pickup → destination route
  console.log('🛣️ Drawing route: Pickup → Destination');
  routeResponse = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
  );
}

            
            if (routeResponse && routeResponse.ok) {
              const routeData = await routeResponse.json();
              
              if (routeData.routes && routeData.routes.length > 0) {
                const route = routeData.routes[0];
                const color = route_info.phase === 'to_pickup' ? '#ff0000ff' : '#05ff0dff';
                
                // Send route coordinates to map
                webViewRef.current?.postMessage(JSON.stringify({
                  type: 'drawRoute',
                  coordinates: route.geometry.coordinates,
                  color: color
                }));
                
                console.log(`✅ Route drawn with ${route.geometry.coordinates.length} coordinates`);
              }
            }
          } catch (error) {
            console.error('Error drawing route:', error);
            // Fallback to simple line route
            if (route_info.phase === 'to_pickup' && driver?.current_location) {
              webViewRef.current?.postMessage(JSON.stringify({
                type: 'showRoute',
                start: { lat: driver.current_location.lat, lng: driver.current_location.lng },
                end: { lat: origin.lat, lng: origin.lng },
              }));
            } else if (route_info.phase === 'in_trip') {
              webViewRef.current?.postMessage(JSON.stringify({
                type: 'showRoute',
                start: { lat: origin.lat, lng: origin.lng },
                end: { lat: destination.lat, lng: destination.lng },
              }));
            }
          }
        }, 200);
      }
      
      return result.data;
      
    } catch (error) {
      console.error('❌ Error fetching live ride data:', error);
      return null;
    }
  };

  // Check for active ride on mount
  useEffect(() => {
    const checkActiveRide = async () => {
      setIsCheckingActiveRide(true);
      
      // STOP any existing polling FIRST
      if ((global as any).ridePollingInterval) {
        clearInterval((global as any).ridePollingInterval);
        (global as any).ridePollingInterval = null;
        console.log('🧹 Cleared existing polling before checking active ride');
      }
      
      const liveData = await fetchLiveRideData();
      
      if (liveData && liveData.status !== 'completed' && liveData.status !== 'cancelled') {
        // Driver has an active ride
        console.log('✅ Active ride found on mount:', liveData.id);
        
        // Set flags to prevent new ride acceptance
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
        // No active ride - reset flags and start polling if online
        console.log('ℹ️ No active ride found');
        isAcceptingRideRef.current = false;
        isFetchingRef.current = false;
        
        if (isDriverOnline) {
          await fetchAvailableRides();
          const pollInterval = setInterval(() => fetchAvailableRides(), 10000);
          (global as any).ridePollingInterval = pollInterval;
          console.log('✅ Started polling after no active ride found');
        }
      }
      
      setIsCheckingActiveRide(false);
    };
    
    checkActiveRide();
  }, []);

  // ----- MAP ROUTE -----
  useEffect(() => {
    if (currentRide && webViewRef.current && showMap) {
      console.log('🗺️ Setting up route for ride:', currentRide.id);
      
      // Start fetching live ride data
      fetchLiveRideData();
      
      // Poll live ride data every 5 seconds
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

  useEffect(() => {
    let locationSubscription: LocationService.LocationSubscription | null = null;
    
    const startLocationTracking = async () => {
      try {
        const { status } = await LocationService.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        
        const location = await LocationService.getCurrentPositionAsync({ accuracy: LocationService.Accuracy.High });
        const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude, address: 'Current Location' };
        const mapCoords = { lat: location.coords.latitude, lng: location.coords.longitude };
        
        setCurrentLocation(coords);
        setLocalUserLocation(mapCoords);
        setUserLocation(mapCoords);
        if (!pickupLocation) setPickupLocation(coords);
        
        if (webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({ type: 'setUserLocation', ...mapCoords }));
        }
        
        if (isDriverOnline) {
          locationSubscription = await LocationService.watchPositionAsync(
            { accuracy: LocationService.Accuracy.High, timeInterval: 10000, distanceInterval: 50 },
            async (location) => {
              const newCoords = { latitude: location.coords.latitude, longitude: location.coords.longitude, address: 'Current Location' };
              const newMapCoords = { lat: location.coords.latitude, lng: location.coords.longitude };
              
              setCurrentLocation(newCoords);
              setLocalUserLocation(newMapCoords);
              setUserLocation(newMapCoords);
              
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
      if (locationSubscription) locationSubscription.remove?.();
    };
  }, [isDriverOnline, setUserLocation]);

  // ----- STREAM + SAVE LOCATION INTERVALS -----
  useEffect(() => {
    let streamInterval: ReturnType<typeof setInterval> | null = null;
    let saveInterval: ReturnType<typeof setInterval> | null = null;

    const startLocationUpdates = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const getCurrentPosition = async () => {
        const location = await LocationService.getCurrentPositionAsync({ accuracy: LocationService.Accuracy.High });
        return {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
      };

      // Every 4 seconds: broadcast location (real-time)
      streamInterval = setInterval(async () => {
        try {
          const pos = await getCurrentPosition();
          await fetch(`${API_BASE_URL}/api/driver/location/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(pos),
          });
          console.log('📡 Streamed location:', pos);
        } catch (err) {
          console.warn('⚠️ Stream location failed:', err);
        }
      }, 4000);

      // Every 60 seconds: save to DB
      saveInterval = setInterval(async () => {
        try {
          const pos = await getCurrentPosition();
          await fetch(`${API_BASE_URL}/api/driver/location/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(pos),
          });
          console.log('💾 Saved location:', pos);
        } catch (err) {
          console.warn('⚠️ Save location failed:', err);
        }
      }, 60000);
    };

    // Start intervals when driver is online
    if (isDriverOnline) {
      startLocationUpdates();
    }

    // Cleanup when going offline or unmounting
    return () => {
      if (streamInterval) clearInterval(streamInterval);
      if (saveInterval) clearInterval(saveInterval);
      console.log('🧹 Location intervals cleared');
    };
  }, [isDriverOnline]);

  // ----- STOP POLLING WHEN RIDE IS ACTIVE -----
  useEffect(() => {
    if (currentRide && (global as any).ridePollingInterval) {
      clearInterval((global as any).ridePollingInterval);
      (global as any).ridePollingInterval = null;
      console.log('✅ Polling stopped - ride is active:', currentRide.id);
    }
  }, [currentRide]);

  // ----- HANDLERS -----
  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📨 Map message received:', data);
      
      if (data.type === 'routeDrawn') {
        console.log('✅ Route successfully drawn on map');
      } else if (data.type === 'error') {
        console.error('❌ Map error:', data.message);
      }
    } catch (error) {
      console.error('Error parsing map message:', error);
    }
  };

  const handleToggleOnline = async () => {
    // Prevent going online if there's an active ride
    if (currentRide) {
      Alert.alert(
        'Active Ride in Progress',
        'You cannot go online/offline while you have an active ride. Please complete or cancel the current ride first.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    toggleDriverOnline();
    
    if (!isDriverOnline) {
      // Going online - start polling
      await fetchAvailableRides();
      const pollInterval = setInterval(() => fetchAvailableRides(), 10000);
      (global as any).ridePollingInterval = pollInterval;
      console.log('✅ Driver online - polling started');
    } else {
      // Going offline - clear everything
      setHasIncomingRequest(false);
      setAvailableRide(null);
      
      if ((global as any).ridePollingInterval) {
        clearInterval((global as any).ridePollingInterval);
        (global as any).ridePollingInterval = null;
        console.log('✅ Driver offline - polling stopped');
      }
    }
  };

  const handleAcceptRide = async () => {
    if (!availableRide || !pickupLocation || !dropoffLocation) {
      Alert.alert('Error', 'No ride data or locations.');
      return;
    }
    
    console.log('🎯 Attempting to accept ride:', availableRide.id);
    
    // Prevent double-accept - CRITICAL: Check and set in single atomic operation
    if (isAcceptingRideRef.current || currentRideRef.current) {
      console.log('🛑 Already accepting or have active ride');
      return;
    }
    
    // Set accepting flag IMMEDIATELY - THIS MUST BE FIRST
    isAcceptingRideRef.current = true;
    console.log('✅ isAcceptingRideRef set to true');
    
    // STOP polling IMMEDIATELY
    if ((global as any).ridePollingInterval) {
      clearInterval((global as any).ridePollingInterval);
      (global as any).ridePollingInterval = null;
      console.log('✅ Polling stopped - accepting ride');
    }
    
    // ALSO set isFetchingRef to prevent any in-flight fetches from processing
    isFetchingRef.current = true;
    console.log('✅ isFetchingRef set to true');
    
    // Hide incoming request UI immediately
    setHasIncomingRequest(false);
    console.log('✅ Incoming request hidden');
    
    try {
      console.log('📡 Calling acceptRideAPI...');
      const response = await acceptRideAPI(availableRide.id);
      console.log('📥 Response received:', response);
      
      // Backend returns { message, ride, pickup_eta } on success
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
        
        console.log('✅ Creating ride object:', newRide);
        
        // Set ride state IMMEDIATELY - button will change instantly
        setCurrentRide(newRide);
        setAvailableRide(null);
        
        console.log('✅ Ride accepted successfully:', newRide.id);
        console.log('✅ currentRide state updated');
        Alert.alert('Success', 'Ride accepted successfully!');
        
        // Fetch live ride data in background
        console.log('📡 Fetching live ride data...');
        await fetchLiveRideData();
        console.log('✅ Live ride data fetched');
        
      } else if (response.error) {
        // Backend returned an error
        console.log('❌ Backend error:', response.error);
        Alert.alert('Error', response.error);
        isAcceptingRideRef.current = false;
        isFetchingRef.current = false;
        setHasIncomingRequest(true);
        
        // Restart polling if accept failed
        if (isDriverOnline && !currentRideRef.current) {
          const pollInterval = setInterval(() => fetchAvailableRides(), 10000);
          (global as any).ridePollingInterval = pollInterval;
          console.log('🔄 Polling restarted after failed accept');
        }
      }
    } catch (error: any) {
      console.error('❌ Accept ride error:', error);
      
      // Check if error response contains a message
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to accept ride';
      Alert.alert('Error', errorMessage);
      
      isAcceptingRideRef.current = false;
      isFetchingRef.current = false;
      setHasIncomingRequest(true);
      
      // Restart polling on error
      if (isDriverOnline && !currentRideRef.current) {
        const pollInterval = setInterval(() => fetchAvailableRides(), 10000);
        (global as any).ridePollingInterval = pollInterval;
        console.log('🔄 Polling restarted after error');
      }
    }
  };

  const handleDeclineRide = async () => {
    setHasIncomingRequest(false);
    setAvailableRide(null);
    setPickupLocation(currentLocation);
    setDropoffLocation(null);
    
    // Fetch next available ride immediately
    if (isDriverOnline && !currentRide && !isAcceptingRideRef.current) {
      await fetchAvailableRides();
    }
  };

  const handleUpdateStatus = async (status: RideStatus) => {
    if (!currentRide) return;
    
    try {
      switch (status) {
        case 'arrived':
          await markArrivedAPI(currentRide.id);
          setCurrentRide({ ...currentRide, status: 'arrived' });
          // Refresh live ride data to update route phase
          await fetchLiveRideData();
          break;
          
        case 'in_progress':
          setCurrentRide({ ...currentRide, status: 'in_progress' });
          // Refresh live ride data to update route phase
          await fetchLiveRideData();
          break;
          
        case 'completed':
          await completeRideAPI(currentRide.id);
          Alert.alert('Ride Completed', 'Great job! Payment has been processed.');
          
          // Stop live ride polling
          if (liveRideIntervalRef.current) {
            clearInterval(liveRideIntervalRef.current);
            liveRideIntervalRef.current = null;
          }
          
          // Clear ride state
          setShowMap(false);
          // webViewRef.current?.postMessage(JSON.stringify({ type: 'clearRoute' }));
          webViewRef.current?.postMessage(JSON.stringify({ type: 'clearMarkers' }));
          setCurrentRide(null);
          setLiveRideData(null);
          
          // Reset ALL flags BEFORE restarting polling
          isAcceptingRideRef.current = false;
          isFetchingRef.current = false;
          
          // Small delay to ensure state is fully cleared
          setTimeout(async () => {
            // Restart polling if driver is still online
            if (isDriverOnline) {
              await fetchAvailableRides();
              const pollInterval = setInterval(() => fetchAvailableRides(), 10000);
              (global as any).ridePollingInterval = pollInterval;
              console.log('✅ Ride completed - polling restarted');
            }
          }, 500);
          break;
          
        default:
          break;
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update ride status');
      console.error(error);
    }
  };

  const handleSOSPress = () => {
    Alert.alert(
      'Emergency SOS',
      'This will send an emergency alert to authorities and the passenger. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send SOS', style: 'destructive', onPress: () => console.log('SOS sent') }
      ]
    );
  };

  const handleCancelRide = async () => {
    if (!currentRide) return;
    
    try {
      await cancelRideAPI(currentRide.id);
      
      Alert.alert('Ride Cancelled', 'The ride has been cancelled.');
      
      // Stop live ride polling
      if (liveRideIntervalRef.current) {
        clearInterval(liveRideIntervalRef.current);
        liveRideIntervalRef.current = null;
      }
      
      // Clear ride state
      setCurrentRide(null);
      setShowMap(false);
      setLiveRideData(null);
      webViewRef.current?.postMessage(JSON.stringify({ type: 'clearRoute' }));
      webViewRef.current?.postMessage(JSON.stringify({ type: 'clearMarkers' }));
      
      // Reset ALL flags BEFORE restarting polling
      isAcceptingRideRef.current = false;
      isFetchingRef.current = false;
      
      // Small delay to ensure state is fully cleared
      setTimeout(async () => {
        // Restart polling if driver is still online
        if (isDriverOnline) {
          await fetchAvailableRides();
          const pollInterval = setInterval(() => fetchAvailableRides(), 10000);
          (global as any).ridePollingInterval = pollInterval;
          console.log('✅ Ride cancelled - polling restarted');
        }
      }, 500);
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel ride');
    }
  };

  const getStatusColor = (): readonly [string, string] => {
    if (!isDriverOnline) return ['#FFE5F1', '#FFB6D9'];
    if (currentRide) return ['#FF85C0', '#ec4899'];
    return ['#FFB6D9', '#FF85C0'];
  };

  const getStatusText = () => {
    if (currentRide) {
      switch (currentRide.status) {
        case 'accepted': return 'Ride accepted - Tap "Get Route" to navigate';
        case 'arrived': return 'At pickup location - Ready to start trip';
        case 'in_progress': return 'Trip in progress - On the way to destination';
        default: return 'Active ride in progress';
      }
    }
    if (!isDriverOnline) return 'You are offline';
    return 'Available for rides';
  };

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
                setTimeout(() => {
                  webViewRef.current?.postMessage(JSON.stringify({
                    type: 'setUserLocation',
                    ...localUserLocation
                  }));
                  webViewRef.current?.postMessage(JSON.stringify({
                    type: 'setView',
                    ...localUserLocation,
                    zoom: 14
                  }));
                }, 300);
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

          <View style={styles.overlay}>
        {showMap && currentRide ? (
          <>
            <LinearGradient
              colors={getStatusColor()}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.statusContainerMap}
            >
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </LinearGradient>

            <View style={styles.navigationCard}>
              <LinearGradient colors={['#FFF5FA', '#FFE5F1']} style={styles.navigationCardGradient}>
                <Text style={styles.navigationTitle}>
                  {liveRideData?.route_info?.phase === 'to_pickup' ? 'Navigate to Pickup' :
                   liveRideData?.route_info?.phase === 'in_trip' ? 'Navigate to Destination' :
                   currentRide.status === 'accepted' ? 'Navigate to Pickup' :
                   currentRide.status === 'in_progress' ? 'Navigate to Destination' :
                   'Passenger on Board'}
                </Text>
                <Text style={styles.navigationAddress}>
                  {liveRideData?.route_info?.phase === 'to_pickup' 
                    ? liveRideData?.origin?.address 
                    : liveRideData?.destination?.address || 
                      (currentRide.status === 'arrived' || currentRide.status === 'in_progress' 
                        ? currentRide.dropoff.address 
                        : currentRide.pickup.address)}
                </Text>
                
                {/* ETA Info */}
                {liveRideData?.route_info && (
                  <View style={styles.etaContainer}>
                    <View style={styles.etaItem}>
                      <Clock size={14} color="#9d174d" />
                      <Text style={styles.etaText}>
                        {liveRideData.route_info.phase === 'to_pickup' 
                          ? liveRideData.route_info.pickup_eta?.duration_text || 'Calculating...'
                          : liveRideData.route_info.trip_route?.duration_text || 'Calculating...'}
                      </Text>
                    </View>
                    <View style={styles.etaItem}>
                      <Navigation size={14} color="#9d174d" />
                      <Text style={styles.etaText}>
                        {liveRideData.route_info.phase === 'to_pickup' 
                          ? `${liveRideData.route_info.pickup_eta?.distance_km?.toFixed(1) || 0} km`
                          : `${liveRideData.route_info.trip_route?.distance_km?.toFixed(1) || 0} km`}
                      </Text>
                    </View>
                  </View>
                )}
                
                <View style={styles.navigationActions}>
                  <TouchableOpacity style={styles.callButton}>
                    <LinearGradient colors={['#FFB6D9', '#FF85C0']} style={styles.actionButtonGradient}>
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
              {currentRide?.status === 'accepted' && (
                <TouchableOpacity style={styles.statusButton} onPress={() => handleUpdateStatus('arrived')}>
                  <LinearGradient colors={['#FFB6D9', '#FF85C0']} style={styles.statusButtonGradient}>
                    <Text style={styles.statusButtonText}>I've Arrived</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {currentRide?.status === 'arrived' && (
                <TouchableOpacity style={styles.statusButton} onPress={() => handleUpdateStatus('in_progress')}>
                  <LinearGradient colors={['#FFB6D9', '#FF85C0']} style={styles.statusButtonGradient}>
                    <Text style={styles.statusButtonText}>Start Trip</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {currentRide?.status === 'in_progress' && (
                <TouchableOpacity style={styles.statusButton} onPress={() => handleUpdateStatus('completed')}>
                  <LinearGradient colors={['#10b981', '#059669']} style={styles.statusButtonGradient}>
                    <Text style={styles.statusButtonText}>Complete Trip</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRide}>
                <LinearGradient colors={['#dc2626', '#b91c1c']} style={styles.statusButtonGradient}>
                  <Text style={styles.statusButtonText}>Cancel Ride</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <LinearGradient
              colors={isDriverOnline ? ['#FFE5F1', '#FF85C0', '#ec4899'] : ['#f5429bff', '#FFE5F1', '#FFB6D9']}
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

            <View style={styles.floatingCard}>
              <View style={styles.cardContent}>
                <LinearGradient colors={getStatusColor()} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.statusContainer}>
                  <Text style={styles.statusText}>{getStatusText()}</Text>
                </LinearGradient>
                
                {/* Show toggle button only when no active ride */}
                {!currentRide ? (
                  <TouchableOpacity style={styles.toggleButton} onPress={handleToggleOnline} testID="toggle-online-button">
                    <LinearGradient colors={isDriverOnline ? ['#dc2626', '#b91c1c'] : ['#FFB6D9', '#FF85C0']} style={styles.toggleButtonGradient}>
                      <Power size={24} color="white" />
                      <Text style={styles.toggleButtonText}>{isDriverOnline ? 'Go Offline' : 'Go Online'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.toggleButton} onPress={() => setShowMap(true)}>
                    <LinearGradient colors={['#10b981', '#059669']} style={styles.toggleButtonGradient}>
                      <Navigation size={24} color="white" />
                      <Text style={styles.toggleButtonText}>Get Route</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>

              {hasIncomingRequest && (
                <View style={styles.requestContainer}>
                  <LinearGradient colors={['#FFF5FA', '#FFE5F1']} style={styles.requestGradient}>
                    <View style={styles.requestHeader}>
                      <LinearGradient colors={['#FF85C0', '#FFB6D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.requestBadge}>
                        <Text style={styles.requestTitle}>New Ride Request! 🚗</Text>
                      </LinearGradient>
                    </View>
                    
                    <View style={styles.requestDetails}>
                      <LocationItem 
                        icon={<MapPin size={16} color="#FF85C0" />} 
                        label="Pickup" 
                        text={pickupLocation?.address || 'Pickup Location'} 
                      />
                      <View style={styles.routeDivider} />
                      <LocationItem 
                        icon={<Navigation size={16} color="#FFB6D9" />} 
                        label="Drop-off" 
                        text={dropoffLocation?.address || 'Destination'} 
                      />
                      
                      {availableRide?.passenger && (
                        <View style={styles.passengerInfo}>
                          <Text style={styles.passengerLabel}>Passenger</Text>
                          <Text style={styles.passengerName}>{availableRide.passenger.name}</Text>
                        </View>
                      )}
                      
                      <View style={styles.rideMetrics}>
                        <MetricItem 
                          icon={<DollarSign size={18} color="#fbbf24" />} 
                          text={`${parseFloat(availableRide?.fare || availableRide?.calculated_fare || '0').toFixed(2)} LBP`} 
                        />
                        <MetricItem 
                          icon={<Navigation size={18} color="#D4A5F5" />} 
                          text={`${parseFloat(availableRide?.distance || '0').toFixed(1)} km`} 
                        />
                        <MetricItem 
                          icon={<Clock size={18} color="#9d174d" />} 
                          text={`${availableRide?.duration || '0'} min`} 
                        />
                      </View>
                    </View>
                    
                    <View style={styles.requestActions}>
                      <TouchableOpacity style={styles.declineButton} onPress={handleDeclineRide}>
                        <LinearGradient colors={['#FFE5F1', '#FFF5FA']} style={styles.actionButtonGradient}>
                          <Text style={styles.declineButtonText}>Decline</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptRide}>
                        <LinearGradient colors={['#FFB6D9', '#FF85C0']} style={styles.actionButtonGradient}>
                          <Text style={styles.acceptButtonText}>Accept Ride</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              )}

              {currentRide && !showMap && (
                <View style={styles.activeRideContainer}>
                  <LinearGradient colors={['#FFF5FA', '#FFE5F1']} style={styles.activeRideGradient}>
                    <View style={styles.activeRideHeader}>
                      <Text style={styles.activeRideTitle}>Active Ride</Text>
                      <View style={styles.activeRideBadge}>
                        <View style={styles.pulseDot} />
                        <Text style={styles.activeRideBadgeText}>
                          {currentRide.status === 'accepted' ? 'Heading to Pickup' : 
                           currentRide.status === 'arrived' ? 'At Pickup' : 
                           'In Progress'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.rideInfo}>
                      <LocationItem 
                        icon={<MapPin size={16} color="#FF85C0" />} 
                        label="Pickup"
                        text={currentRide.pickup.address} 
                      />
                      <View style={styles.routeDivider} />
                      <LocationItem 
                        icon={<Navigation size={16} color="#FFB6D9" />} 
                        label="Destination"
                        text={currentRide.dropoff.address} 
                      />
                      <View style={styles.fareDivider} />
                      <View style={styles.fareContainer}>
                        <DollarSign size={20} color="#fbbf24" />
                        <Text style={styles.fareAmount}>{currentRide.fare} LBP</Text>
                      </View>
                    </View>
                    
                    <View style={styles.driverActions}>
                      <TouchableOpacity style={styles.callButton}>
                        <LinearGradient colors={['#FFB6D9', '#FF85C0']} style={styles.actionButtonGradient}>
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

                    <View style={styles.rideActions}>
                      {currentRide?.status === 'accepted' && (
                        <TouchableOpacity style={styles.statusButton} onPress={() => handleUpdateStatus('arrived')}>
                          <LinearGradient colors={['#FFB6D9', '#FF85C0']} style={styles.statusButtonGradient}>
                            <Text style={styles.statusButtonText}>I've Arrived at Pickup</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                      {currentRide?.status === 'arrived' && (
                        <TouchableOpacity style={styles.statusButton} onPress={() => handleUpdateStatus('in_progress')}>
                          <LinearGradient colors={['#FFB6D9', '#FF85C0']} style={styles.statusButtonGradient}>
                            <Text style={styles.statusButtonText}>Start Trip</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                      {currentRide?.status === 'in_progress' && (
                        <TouchableOpacity style={styles.statusButton} onPress={() => handleUpdateStatus('completed')}>
                          <LinearGradient colors={['#10b981', '#059669']} style={styles.statusButtonGradient}>
                            <Text style={styles.statusButtonText}>Complete Trip</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRide}>
                        <LinearGradient colors={['#dc2626', '#b91c1c']} style={styles.statusButtonGradient}>
                          <Text style={styles.statusButtonText}>Cancel Ride</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              )}

              {isDriverOnline && !hasIncomingRequest && !currentRide && <WaitingForRide />}
            </View>
          </>
        )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

// Subcomponents
const LocationItem = ({ icon, label, text }: { icon: React.ReactNode; label?: string; text: string }) => (
  <View style={styles.locationItem}>
    <View style={styles.iconCircle}>{icon}</View>
    <View style={styles.locationTextContainer}>
      {label && <Text style={styles.locationLabel}>{label}</Text>}
      <Text style={styles.locationText}>{text}</Text>
    </View>
  </View>
);

const MetricItem = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <View style={styles.metricItem}>
    {icon}
    <Text style={styles.metricText}>{text}</Text>
  </View>
);

const WaitingForRide = () => (
  <View style={styles.waitingContainer}>
    <LinearGradient colors={['#fff5fa98', '#ffe5f191']} style={styles.waitingGradient}>
      <View style={styles.waitingPulse}>
        <Zap size={32} color="#c74182ff" fill="#dd207bff" />
      </View>
      <Text style={styles.waitingText}>Waiting for ride requests...</Text>
      <Text style={styles.waitingSubtext}>Stay nearby for faster pickups</Text>
    </LinearGradient>
  </View>
);

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFE5F1',
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