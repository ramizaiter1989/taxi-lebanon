// app/(client)/active-ride.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Phone, MessageSquare, Navigation, Clock, Star, AlertCircle, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { API_BASE_URL } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mapHTML from '@/utils/mapHTML';
import { authCache } from '@/utils/authCache';
import * as Location from 'expo-location';

// Constants
const ACTIVE_STATUSES = ['pending', 'accepted', 'arrived', 'in_progress'];
const POLL_INTERVAL = 10000; // 10 seconds
const LOCATION_POLL_INTERVAL = 5000; // 5 seconds
const PLACEHOLDER_PHOTO = 'https://via.placeholder.com/150';

const CANCEL_REASONS = [
  { key: 'driver_no_show', label: 'Driver did not show up' },
  { key: 'wrong_location', label: 'Wrong pickup location' },
  { key: 'changed_mind', label: 'Changed my mind' },
  { key: 'too_expensive', label: 'Fare too expensive' },
  { key: 'emergency', label: 'Emergency situation' },
  { key: 'other', label: 'Other reason' },
];

type RideStatus = 'searching' | 'driver_assigned' | 'arriving' | 'picked_up';

export default function ActiveRideScreen() {
  const router = useRouter();
  const [rideStatus, setRideStatus] = useState<RideStatus>('searching');
  const [driver, setDriver] = useState<any | null>(null);
  const [ride, setRide] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('changed_mind');
  const [note, setNote] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Refs for cleanup - FIXED: Changed from NodeJS.Timeout to ReturnType<typeof setInterval>
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const webViewRef = useRef<WebView>(null);

  // Clear stale cache on mount and ensure auth cache is initialized
  useEffect(() => {
    const initializeScreen = async () => {
      try {
        if (!authCache.isInitialized()) {
          await authCache.initialize();
          console.log('✓ Auth cache initialized in active-ride screen');
        }
        await AsyncStorage.removeItem('current_ride_id');
        console.log('✓ Cleared stale ride cache');
      } catch (error) {
        console.error('Failed to initialize screen:', error);
      }
    };
    
    initializeScreen();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch live ride from API
  const fetchLiveRide = useCallback(async () => {
    try {
      const authToken = authCache.getToken();
      if (!authToken) {
        console.error('No auth token found');
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/passenger/rides/live`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('No active ride found');
          setRide(null);
          setDriver(null);
          setRideStatus('searching');
          setLoading(false);
          router.replace('/(client)/home');
          return;
        }
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      const liveRide = result.data;

      console.log('Live ride data:', JSON.stringify(liveRide, null, 2));

      if (!isMountedRef.current) return;

      if (!liveRide || !ACTIVE_STATUSES.includes(liveRide.status)) {
        console.log('Ride not active:', liveRide?.status);
        setRide(null);
        setDriver(null);
        router.replace('/(client)/home');
        return;
      }

      setRide(liveRide);
      
      if (liveRide.driver && liveRide.driver.user) {
        setDriver(liveRide.driver.user);
        console.log('Driver assigned:', liveRide.driver.user.name);
      } else {
        setDriver(null);
        console.log('No driver assigned yet');
      }

      const statusMap: Record<string, RideStatus> = {
        'pending': 'searching',
        'accepted': 'driver_assigned',
        'arrived': 'arriving',
        'in_progress': 'picked_up',
      };
      
      setRideStatus(statusMap[liveRide.status] || 'searching');

      if (liveRide.status === 'in_progress' && liveRide.timestamps?.started_at && !timerStartTime) {
        setTimerStartTime(new Date(liveRide.timestamps.started_at));
      }

      if (liveRide.id && ACTIVE_STATUSES.includes(liveRide.status)) {
        await AsyncStorage.setItem('current_ride_id', liveRide.id.toString());
      }

    } catch (error) {
      console.error('Failed to fetch live ride:', error);
      Alert.alert('Error', 'Failed to load ride data. Please try again.');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [timerStartTime, router]);

  // Timer effect
  useEffect(() => {
    if (!timerStartTime) return;

    timerIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      const now = new Date();
      setElapsedTime(Math.floor((now.getTime() - timerStartTime.getTime()) / 1000));
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerStartTime]);

  // Initial fetch on mount
  useEffect(() => {
    fetchLiveRide();
  }, []);

  // Poll ride effect
  useEffect(() => {
    if (ride?.id) {
      pollIntervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          fetchLiveRide();
        }
      }, POLL_INTERVAL);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [ride?.id, fetchLiveRide]);

  // Get user's current location
  useEffect(() => {
    if (!showMap) return;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.error('Location permission denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        const { latitude, longitude } = location.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        console.log('✓ User location:', latitude, longitude);
      } catch (error) {
        console.error('Error getting user location:', error);
      }
    })();
  }, [showMap]);

  // Fetch driver location in real-time
  const fetchDriverLocation = useCallback(async () => {
    if (!ride?.driver?.id) return;
    
    try {
      const token = authCache.getToken();
      const response = await fetch(`${API_BASE_URL}/drivers/${ride.driver.id}/location`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Driver location from API:', data);
        
        if (data.lat && data.lng && isMountedRef.current) {
          const newLocation = { 
            lat: parseFloat(data.lat), 
            lng: parseFloat(data.lng) 
          };
          setDriverLocation(newLocation);
          
          if (showMap && webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({
              type: 'updateDriverLocation',
              lat: newLocation.lat,
              lng: newLocation.lng,
            }));
          }
        }
      } else if (ride.current_location) {
        const fallbackLocation = {
          lat: parseFloat(ride.current_location.lat),
          lng: parseFloat(ride.current_location.lng)
        };
        setDriverLocation(fallbackLocation);
      }
    } catch (error) {
      console.error('Failed to fetch driver location:', error);
      if (ride.current_location) {
        const fallbackLocation = {
          lat: parseFloat(ride.current_location.lat),
          lng: parseFloat(ride.current_location.lng)
        };
        setDriverLocation(fallbackLocation);
      }
    }
  }, [ride?.driver?.id, ride?.current_location, showMap]);

  // Poll driver location when map is shown
  useEffect(() => {
    if (!showMap || !ride?.driver?.id) return;

    fetchDriverLocation();
    
    locationPollRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchDriverLocation();
      }
    }, LOCATION_POLL_INTERVAL);

    return () => {
      if (locationPollRef.current) {
        clearInterval(locationPollRef.current);
      }
    };
  }, [showMap, ride?.driver?.id, fetchDriverLocation]);

  // Setup map route when map opens
  useEffect(() => {
    if (!showMap || !webViewRef.current || !ride) return;

    const setupMap = setTimeout(() => {
      if (!webViewRef.current || !ride) return;

      const parseCoord = (value: any): number | null => {
        if (value === null || value === undefined || value === '') return null;
        const parsed = parseFloat(String(value));
        return isNaN(parsed) ? null : parsed;
      };

      const pickupLat = parseCoord(ride.origin?.lat);
      const pickupLng = parseCoord(ride.origin?.lng);
      const destLat = parseCoord(ride.destination?.lat);
      const destLng = parseCoord(ride.destination?.lng);

      console.log('✓ Parsed coordinates:', {
        pickup: { lat: pickupLat, lng: pickupLng },
        destination: { lat: destLat, lng: destLng },
        userLocation,
        driverLocation,
      });
console.log("hsakjhfkjhdsf:", ride.driver.id);
      if (pickupLat === null || pickupLng === null || destLat === null || destLng === null) {
        console.error('Invalid coordinates - cannot display map');
        Alert.alert(
          'Map Error', 
          'Location coordinates are not available. Please try again.',
          [{ text: 'OK', onPress: () => setShowMap(false) }]
        );
        return;
      }

      // Clear existing
      webViewRef.current.postMessage(JSON.stringify({ type: 'clearRoute' }));
      webViewRef.current.postMessage(JSON.stringify({ type: 'clearMarkers' }));

      // Add markers after delay
      setTimeout(() => {
        // User location marker
        
        if (userLocation) {
          webViewRef.current?.postMessage(JSON.stringify({
            type: 'addMarker',
            lat: userLocation.lat,
            lng: userLocation.lng,
            title: 'Your Location',
            markerType: 'user',
            
          }));
        }

        // Pickup marker
        webViewRef.current?.postMessage(JSON.stringify({
          type: 'addMarker',
          lat: pickupLat,
          lng: pickupLng,
          title: ride.origin?.address || 'Pickup',
          markerType: 'pickup',
        }));

        // Destination marker
        webViewRef.current?.postMessage(JSON.stringify({
          type: 'addMarker',
          lat: destLat,
          lng: destLng,
          title: ride.destination?.address || 'Destination',
          markerType: 'destination',
        }));

        // Driver marker
        if (driverLocation) {
          webViewRef.current?.postMessage(JSON.stringify({
            type: 'addMarker',
            lat: driverLocation.lat,
            lng: driverLocation.lng,
            title: driver?.name || 'Driver',
            markerType: 'driver',
          }));
        } else if (ride.current_location) {
          const currentLat = parseCoord(ride.current_location.lat);
          const currentLng = parseCoord(ride.current_location.lng);
          if (currentLat !== null && currentLng !== null) {
            webViewRef.current?.postMessage(JSON.stringify({
              type: 'addMarker',
              lat: currentLat,
              lng: currentLng,
              title: driver?.name || 'Driver',
              markerType: 'driver',
            }));
          }
        }

        // Calculate and show route
        // Calculate and show route
setTimeout(() => {
  webViewRef.current?.postMessage(JSON.stringify({
    type: 'calculateRoute',
    start: { lat: pickupLat, lng: pickupLng },
    end: { lat: destLat, lng: destLng },
  }));

  // If we have user location, center the map on them
  if (userLocation) {
    webViewRef.current?.postMessage(JSON.stringify({
      type: 'centerMap',
      lat: userLocation.lat,
      lng: userLocation.lng,
      zoom: 15, // slightly closer zoom
    }));
  } else {
    // fallback: center on pickup
    webViewRef.current?.postMessage(JSON.stringify({
      type: 'centerMap',
      lat: pickupLat,
      lng: pickupLng,
      zoom: 14,
    }));
  }
}, 300);

      }, 500);
    }, 1000);

    return () => clearTimeout(setupMap);
  }, [showMap, ride, driverLocation, userLocation, driver]);

  const handleTrackOnMap = useCallback(() => setShowMap(true), []);
  const handleCloseMap = useCallback(() => setShowMap(false), []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleCall = useCallback(() => {
    if (driver?.phone) {
      Linking.openURL(`tel:${driver.phone}`);
    } else {
      Alert.alert('Error', 'Driver phone number not available');
    }
  }, [driver?.phone]);

  const handleMessage = useCallback(() => {
    router.push('/(client)/TestChat');
  }, [router]);

  const handleCancelRide = useCallback(() => {
    setCancelModalVisible(true);
  }, []);

  const confirmCancelRide = useCallback(async () => {
    if (!ride?.id) return;
    
    try {
      const token = authCache.getToken();
      const response = await fetch(`${API_BASE_URL}/rides/${ride.id}/cancel`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          reason: selectedReason, 
          note: note || 'Cancelled from app' 
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      await AsyncStorage.removeItem('current_ride_id');
      setCancelModalVisible(false);
      Alert.alert('Success', 'Ride cancelled successfully');
      router.replace('/(client)/home');
    } catch (error) {
      console.error('Error cancelling ride:', error);
      Alert.alert('Error', 'Failed to cancel ride. Please try again.');
    }
  }, [ride?.id, selectedReason, note, router]);

  const statusInfo = useMemo(() => {
    const statusMap = {
      'searching': { 
        title: 'Finding Your Driver', 
        subtitle: 'Please wait while we match you with a driver', 
        color: '#fce7f3' 
      },
      'driver_assigned': { 
        title: 'Driver Assigned', 
        subtitle: 'Your driver is on the way', 
        color: '#fbcfe8' 
      },
      'arriving': { 
        title: 'Driver Arriving', 
        subtitle: 'Your driver will arrive shortly', 
        color: '#f9a8d4' 
      },
      'picked_up': { 
        title: 'On Trip', 
        subtitle: 'Enjoy your ride', 
        color: '#ec4899' 
      },
    };
    return statusMap[rideStatus] || { title: 'Active Ride', subtitle: '', color: '#fce7f3' };
  }, [rideStatus]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#ec4899" />
        <Text style={styles.loadingText}>Loading ride...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {showMap ? (
        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: mapHTML }}
            style={styles.map}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
          />
          
          <View style={styles.mapOverlay}>
            <TouchableOpacity onPress={handleCloseMap} style={styles.closeMapButton}>
              <LinearGradient colors={['#fff', '#fdf2f8']} style={styles.closeMapGradient}>
                <X size={24} color="#831843" />
                <Text style={styles.closeMapText}>Close Map</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.mapStatusCard}>
              <LinearGradient colors={['#fff', '#fdf2f8']} style={styles.mapStatusGradient}>
                <Text style={styles.mapStatusTitle}>{statusInfo.title}</Text>
                <Text style={styles.mapStatusSubtitle}>{statusInfo.subtitle}</Text>
                
                {ride?.route_info?.pickup_eta && rideStatus !== 'picked_up' && (
                  <View style={styles.mapEtaInfo}>
                    <Clock size={16} color="#ec4899" />
                    <Text style={styles.mapEtaText}>
                      Driver arriving in {ride.route_info.pickup_eta.duration_text}
                    </Text>
                  </View>
                )}
                
                {rideStatus === 'picked_up' && (
                  <View style={styles.mapTimerInfo}>
                    <Clock size={16} color="#ec4899" />
                    <Text style={styles.mapTimerText}>
                      Trip Duration: {formatTime(elapsedTime)}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </View>

            {driver && (
              <View style={styles.mapDriverCard}>
                <LinearGradient colors={['#fff', '#fdf2f8']} style={styles.mapDriverGradient}>
                  <Image 
                    source={{ uri: driver.profile_photo || PLACEHOLDER_PHOTO }} 
                    style={styles.mapDriverPhoto} 
                  />
                  <View style={styles.mapDriverInfo}>
                    <Text style={styles.mapDriverName}>{driver.name}</Text>
                    <Text style={styles.mapDriverVehicle}>
                      {ride?.driver?.vehicle_type} • {ride?.driver?.vehicle_number}
                    </Text>
                  </View>
                  <View style={styles.mapDriverActions}>
                    <TouchableOpacity style={styles.mapActionButton} onPress={handleCall}>
                      <Phone size={20} color="#ec4899" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mapActionButton} onPress={handleMessage}>
                      <MessageSquare size={20} color="#ec4899" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            )}
          </View>
        </View>
      ) : (
        <>
          <LinearGradient colors={['#fdf2f8', '#fce7f3']} style={styles.header}>
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

          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
          >
            {rideStatus === 'picked_up' && (
              <View style={styles.timerContainer}>
                <Text style={styles.timerLabel}>Ride Duration</Text>
                <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
              </View>
            )}

            <View style={[styles.statusBanner, { backgroundColor: statusInfo.color }]}>
              <Text style={styles.statusTitle}>{statusInfo.title}</Text>
              <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
            </View>

            {ride && ride.route_info?.phase === 'to_pickup' && ride.route_info?.pickup_eta && (
              <ETACard 
                icon={<Clock size={32} color="#ec4899" />}
                label="Driver arriving in"
                time={ride.route_info.pickup_eta.duration_text}
                distance={`${ride.route_info.pickup_eta.distance_km} km away`}
              />
            )}
            
            {ride && (ride.route_info?.phase === 'at_pickup' || ride.route_info?.phase === 'in_trip') && (
              <ETACard 
                icon={<Navigation size={32} color="#ec4899" />}
                label="Trip Duration"
                time={ride.route_info.trip_route?.duration_text || 'Calculating...'}
                distance={ride.route_info.trip_route?.distance_km ? `${ride.route_info.trip_route.distance_km} km` : 'Distance not available'}
              />
            )}

            {driver && ride ? (
              <DriverCard 
                driver={driver}
                ride={ride}
                onCall={handleCall}
                onMessage={handleMessage}
              />
            ) : (
              <View style={styles.driverCard}>
                <ActivityIndicator size="small" color="#ec4899" />
                <Text style={styles.waitingText}>Waiting for driver to accept ride...</Text>
              </View>
            )}

            {ride && <TripDetails ride={ride} />}

            <View style={styles.bottomSection}>
              <View style={styles.fareInfo}>
                <Text style={styles.fareLabel}>Estimated Fare</Text>
                <Text style={styles.fareValue}>${ride?.fare?.toFixed(2) || '0.00'}</Text>
              </View>
              
              <TouchableOpacity style={styles.trackButton} onPress={handleTrackOnMap}>
                <LinearGradient colors={['#ec4899', '#f472b6']} style={styles.trackGradient}>
                  <Navigation size={20} color="white" />
                  <Text style={styles.trackButtonText}>Track on Map</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <CancelRideModal 
            visible={cancelModalVisible}
            selectedReason={selectedReason}
            note={note}
            onReasonSelect={setSelectedReason}
            onNoteChange={setNote}
            onClose={() => setCancelModalVisible(false)}
            onConfirm={confirmCancelRide}
          />
        </>
      )}
    </SafeAreaView>
  );
}

// Memoized Components
const ETACard = React.memo(({ icon, label, time, distance }: any) => (
  <View style={styles.etaCard}>
    {icon}
    <View style={styles.etaInfo}>
      <Text style={styles.etaLabel}>{label}</Text>
      <Text style={styles.etaTime}>{time}</Text>
      <Text style={styles.etaDistance}>{distance}</Text>
    </View>
  </View>
));

const DriverCard = React.memo(({ driver, ride, onCall, onMessage }: any) => (
  <View style={styles.driverCard}>
    <Image 
      source={{ uri: driver.profile_photo || PLACEHOLDER_PHOTO }} 
      style={styles.driverPhoto} 
    />
    <View style={styles.driverInfo}>
      <Text style={styles.driverName}>{driver.name || 'Driver Name'}</Text>
      <View style={styles.ratingContainer}>
        <Star size={16} color="#FFD700" fill="#FFD700" />
        <Text style={styles.rating}>{ride?.driver?.rating ?? '-'}</Text>
      </View>
      <Text style={styles.vehicleInfo}>
        {ride?.driver?.vehicle_type ?? '-'} • {ride?.driver?.vehicle_number ?? '-'}
      </Text>
      <Text style={styles.vehiclePlate}>
        License: {ride?.driver?.license_number ?? '-'}
      </Text>
    </View>
    <View style={styles.driverActions}>
      <TouchableOpacity style={styles.actionButton} onPress={onCall}>
        <Phone size={24} color="#ec4899" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={onMessage}>
        <MessageSquare size={24} color="#ec4899" />
      </TouchableOpacity>
    </View>
  </View>
));

const TripDetails = React.memo(({ ride }: any) => (
  <View style={styles.tripDetails}>
    <Text style={styles.sectionTitle}>Trip Details</Text>
    <View style={styles.locationRow}>
      <View style={[styles.locationDot, { backgroundColor: '#ec4899' }]} />
      <View style={styles.locationInfo}>
        <Text style={styles.locationLabel}>PICKUP</Text>
        <Text style={styles.locationAddress}>
          {ride?.origin?.address || 'Pickup address not available'}
        </Text>
      </View>
    </View>
    <View style={styles.locationLine} />
    <View style={styles.locationRow}>
      <View style={[styles.locationDot, { backgroundColor: '#831843' }]} />
      <View style={styles.locationInfo}>
        <Text style={styles.locationLabel}>DESTINATION</Text>
        <Text style={styles.locationAddress}>
          {ride?.destination?.address || 'Destination not available'}
        </Text>
      </View>
    </View>

    {ride?.route_info?.trip_route && (
      <View style={styles.tripInfoContainer}>
        <View style={styles.tripInfoRow}>
          <MapPin size={16} color="#831843" />
          <Text style={styles.tripInfoLabel}>Distance:</Text>
          <Text style={styles.tripInfoValue}>
            {ride.route_info.trip_route.distance_km} km
          </Text>
        </View>
        <View style={styles.tripInfoRow}>
          <Clock size={16} color="#831843" />
          <Text style={styles.tripInfoLabel}>Duration:</Text>
          <Text style={styles.tripInfoValue}>
            {ride.route_info.trip_route.duration_text}
          </Text>
        </View>
      </View>
    )}
  </View>
));

const CancelRideModal = React.memo(({ 
  visible, 
  selectedReason, 
  note, 
  onReasonSelect, 
  onNoteChange, 
  onClose, 
  onConfirm 
}: any) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Cancel Ride</Text>
        <Text style={styles.modalSubtitle}>Please tell us why you're cancelling</Text>

        {CANCEL_REASONS.map(r => (
          <TouchableOpacity
            key={r.key}
            style={[
              styles.reasonButton, 
              selectedReason === r.key && styles.reasonButtonSelected
            ]}
            onPress={() => onReasonSelect(r.key)}
          >
            <Text style={[
              styles.reasonText, 
              selectedReason === r.key && styles.reasonTextSelected
            ]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}

        <TextInput
          placeholder="Optional note..."
          value={note}
          onChangeText={onNoteChange}
          style={styles.noteInput}
          multiline
        />

        <View style={styles.modalActions}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Close</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!selectedReason}
            onPress={onConfirm}
            style={[styles.confirmBtn, !selectedReason && styles.disabledBtn]}
          >
            <Text style={styles.confirmBtnText}>Confirm Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
));

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#831843', fontSize: 16 },
  scrollContent: { paddingBottom: 20 },
  header: { paddingHorizontal: 20, paddingVertical: 15 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emergencyButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#831843' },
  timerContainer: { 
    backgroundColor: '#fce7f3', 
    padding: 20, 
    alignItems: 'center', 
    marginHorizontal: 20, 
    marginTop: 15, 
    borderRadius: 12 
  },
  timerLabel: { fontSize: 14, color: '#831843', marginBottom: 5 },
  timerText: { fontSize: 32, fontWeight: 'bold', color: '#ec4899' },
  statusBanner: { 
    padding: 20, 
    marginHorizontal: 20, 
    marginTop: 15, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  statusTitle: { fontSize: 18, fontWeight: '600', color: '#831843', marginBottom: 5 },
  statusSubtitle: { fontSize: 14, color: '#9f1239' },
  etaCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fdf2f8', 
    padding: 20, 
    marginHorizontal: 20, 
    marginTop: 15, 
    borderRadius: 12, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#fbcfe8' 
  },
  etaInfo: { marginLeft: 15, flex: 1 },
  etaLabel: { fontSize: 14, color: '#831843', marginBottom: 5 },
  etaTime: { fontSize: 24, fontWeight: 'bold', color: '#ec4899' },
  etaDistance: { fontSize: 14, color: '#9f1239', marginTop: 2 },
  driverCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 20, 
    marginHorizontal: 20, 
    marginTop: 15, 
    borderRadius: 12, 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3 
  },
  waitingText: { textAlign: 'center', color: '#831843', marginTop: 10, marginLeft: 10 },
  driverPhoto: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fce7f3' },
  driverInfo: { flex: 1, marginLeft: 15 },
  driverName: { fontSize: 16, fontWeight: '600', color: '#831843', marginBottom: 5 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  rating: { fontSize: 14, color: '#831843', marginLeft: 5 },
  vehicleInfo: { fontSize: 14, color: '#9f1239' },
  vehiclePlate: { fontSize: 12, color: '#9f1239', marginTop: 2 },
  driverActions: { flexDirection: 'row', gap: 10 },
  actionButton: { backgroundColor: '#fce7f3', padding: 12, borderRadius: 10 },
  tripDetails: { 
    backgroundColor: '#fff', 
    padding: 20, 
    marginHorizontal: 20, 
    marginTop: 15, 
    borderRadius: 12, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3 
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#831843', marginBottom: 15 },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start' },
  locationDot: { width: 12, height: 12, borderRadius: 6, marginTop: 5 },
  locationInfo: { flex: 1, marginLeft: 15 },
  locationLabel: { fontSize: 12, fontWeight: '600', color: '#831843', marginBottom: 5 },
  locationAddress: { fontSize: 14, color: '#9f1239', lineHeight: 20 },
  locationLine: { width: 2, height: 30, backgroundColor: '#fbcfe8', marginLeft: 5, marginVertical: 10 },
  tripInfoContainer: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#fbcfe8' },
  tripInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  tripInfoLabel: { fontSize: 14, color: '#831843', marginLeft: 8, flex: 1 },
  tripInfoValue: { fontSize: 14, fontWeight: '600', color: '#ec4899' },
  bottomSection: { marginHorizontal: 20, marginTop: 15 },
  fareInfo: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fdf2f8', 
    padding: 20, 
    borderRadius: 12, 
    marginBottom: 15 
  },
  fareLabel: { fontSize: 16, color: '#831843' },
  fareValue: { fontSize: 24, fontWeight: 'bold', color: '#ec4899' },
  trackButton: { borderRadius: 12, overflow: 'hidden' },
  trackGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 18 },
  trackButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContainer: { backgroundColor: '#fff', padding: 20, width: '85%', borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#831843', marginBottom: 5 },
  modalSubtitle: { fontSize: 14, color: '#9f1239', marginBottom: 15 },
  reasonButton: { 
    padding: 12, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#fbcfe8', 
    marginBottom: 10 
  },
  reasonButtonSelected: { backgroundColor: '#fce7f3', borderColor: '#ec4899' },
  reasonText: { color: '#831843' },
  reasonTextSelected: { fontWeight: '600', color: '#ec4899' },
  noteInput: { 
    borderWidth: 1, 
    borderColor: '#fbcfe8', 
    borderRadius: 10, 
    padding: 10, 
    height: 60, 
    marginBottom: 15,
    textAlignVertical: 'top'
  },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelBtn: { padding: 12 },
  cancelBtnText: { color: '#831843', fontWeight: '600' },
  confirmBtn: { backgroundColor: '#ec4899', padding: 12, borderRadius: 10 },
  disabledBtn: { opacity: 0.5 },
  confirmBtnText: { color: '#fff', fontWeight: '600' },
  
  // Map styles
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  mapOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    padding: 20,
    pointerEvents: 'box-none',
  },
  closeMapButton: { 
    borderRadius: 12, 
    overflow: 'hidden', 
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  closeMapGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 16,
  },
  closeMapText: { 
    marginLeft: 8, 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#831843' 
  },
  mapStatusCard: {
    marginTop: 15,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  mapStatusGradient: {
    padding: 16,
  },
  mapStatusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 4,
  },
  mapStatusSubtitle: {
    fontSize: 14,
    color: '#9f1239',
  },
  mapEtaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#fbcfe8',
  },
  mapEtaText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#ec4899',
  },
  mapTimerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#fbcfe8',
  },
  mapTimerText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#ec4899',
  },
  mapDriverCard: {
    marginTop: 15,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  mapDriverGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  mapDriverPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fce7f3',
  },
  mapDriverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mapDriverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 4,
  },
  mapDriverVehicle: {
    fontSize: 13,
    color: '#9f1239',
  },
  mapDriverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  mapActionButton: {
    backgroundColor: '#fce7f3',
    padding: 10,
    borderRadius: 10,
  },
});