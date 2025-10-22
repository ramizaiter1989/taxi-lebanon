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


type RideStatus = 'accepted' | 'in_progress' | 'started' | 'completed';
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
  const webViewRef = useRef<WebView>(null);

  // API Functions
  const getAuthToken = async () => {
    return await AsyncStorage.getItem('token');
  };

  const fetchAvailableRides = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.warn("⚠️ No token found");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/rides/available`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('✅ Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Request failed:', response.status, errorText);
        throw new Error('Failed to fetch available rides');
      }

      const data = await response.json();
      console.log('📦 Parsed data:', data);

      // Check if data is directly an array of rides
      const ridesArray = Array.isArray(data) ? data : (data?.rides || []);
      
      if (ridesArray.length > 0) {
        const ride = ridesArray[0];
        console.log('🚗 Processing ride:', ride.id);
        setAvailableRide(ride);
        
        // Parse origin (pickup) location
        if (ride.origin_lat && ride.origin_lng) {
          setPickupLocation({
            latitude: parseFloat(ride.origin_lat),
            longitude: parseFloat(ride.origin_lng),
            address: 'Pickup Location',
          });
        }
        
        // Parse destination (dropoff) location
        if (ride.destination_lat && ride.destination_lng) {
          setDropoffLocation({
            latitude: parseFloat(ride.destination_lat),
            longitude: parseFloat(ride.destination_lng),
            address: 'Destination',
          });
        }
        
        setHasIncomingRequest(true);
        console.log('✅ Ride request displayed');
      } else {
        console.log('ℹ️ No available rides');
        setHasIncomingRequest(false);
        setAvailableRide(null);
      }

    } catch (error) {
      console.error('🚨 Error fetching available rides:', error);
    }
  };

  const acceptRideAPI = async (rideId: string) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/rides/${rideId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to accept ride');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error accepting ride:', error);
      throw error;
    }
  };

  const updateRideLocationAPI = async (rideId: string, lat: number, lng: number) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/rides/${rideId}/update-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_driver_lat: lat,
          current_driver_lng: lng,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update ride location');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating ride location:', error);
      throw error;
    }
  };

  const markArrivedAPI = async (rideId: string) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/rides/${rideId}/arrived`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to mark as arrived');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error marking as arrived:', error);
      throw error;
    }
  };

  const cancelRideAPI = async (rideId: string) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/rides/${rideId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to cancel ride');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error cancelling ride:', error);
      throw error;
    }
  };

  // Location Tracking
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
        if (!pickupLocation) {
          setPickupLocation(coords);
        }
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
            async (location) => {
              const newCoords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                address: 'Current Location',
              };
              const newMapCoords = { lat: location.coords.latitude, lng: location.coords.longitude };
              setCurrentLocation(newCoords);
              setLocalUserLocation(newMapCoords);
              setUserLocation(newMapCoords);
              if (webViewRef.current) {
                webViewRef.current.postMessage(JSON.stringify({ type: 'setUserLocation', ...newMapCoords }));
              }
              if (currentRide) {
                await updateRideLocationAPI(currentRide.id, location.coords.latitude, location.coords.longitude);
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
  }, [isDriverOnline, setUserLocation, currentRide]);

  // Map Route Handling
  useEffect(() => {
    if (currentRide && webViewRef.current && showMap && !isLoading) {
      console.log('Setting up route on map');

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

      setTimeout(() => {
        if (webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({
            type: 'showRoute',
            start: { lat: currentRide.pickup.latitude, lng: currentRide.pickup.longitude },
            end: { lat: currentRide.dropoff.latitude, lng: currentRide.dropoff.longitude },
          }));
        }
      }, 800);
    }
  }, [currentRide, showMap, isLoading]);

  // Handlers
  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Map message:', data);
    } catch (error) {
      console.error('Error parsing map message:', error);
    }
  };

  const handleToggleOnline = async () => {
    toggleDriverOnline();
    if (!isDriverOnline) {
      await fetchAvailableRides();
      const pollInterval = setInterval(async () => {
        await fetchAvailableRides();
      }, 10000);
      (global as any).ridePollingInterval = pollInterval;
    } else {
      setHasIncomingRequest(false);
      setAvailableRide(null);
      if ((global as any).ridePollingInterval) {
        clearInterval((global as any).ridePollingInterval);
        (global as any).ridePollingInterval = null;
      }
    }
  };

  const handleAcceptRide = async () => {
    if (!availableRide) {
      Alert.alert('Error', 'No ride data available.');
      return;
    }

    if (!pickupLocation || !dropoffLocation) {
      Alert.alert('Error', 'Pickup or dropoff location not set.');
      return;
    }

    setHasIncomingRequest(false);
    setIsLoading(true);

    try {
      const response = await acceptRideAPI(availableRide.id);
      
      if (response.success) {
        const acceptedRide: Ride = {
          id: String(availableRide.id),
          clientId: String(availableRide.passenger_id || availableRide.passenger?.id || '1'),
          pickup: pickupLocation,
          dropoff: dropoffLocation,
          status: 'accepted',
          fare: parseFloat(availableRide.fare || availableRide.calculated_fare || '0'),
          estimatedDuration: availableRide.duration || 15,
          createdAt: new Date(availableRide.created_at || Date.now()),
        };
        
        setCurrentRide(acceptedRide);
        setShowMap(true);
        setAvailableRide(null);
        
        if ((global as any).ridePollingInterval) {
          clearInterval((global as any).ridePollingInterval);
          (global as any).ridePollingInterval = null;
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to accept ride');
        setHasIncomingRequest(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to accept ride');
      setHasIncomingRequest(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineRide = async () => {
    setHasIncomingRequest(false);
    setAvailableRide(null);
    setPickupLocation(currentLocation);
    setDropoffLocation(null);
    
    await fetchAvailableRides();
    
    if (!hasIncomingRequest) {
      Alert.alert('Ride Declined', 'Looking for another ride request...');
    }
  };

  const handleUpdateStatus = async (status: RideStatus) => {
    if (!currentRide) return;

    try {
      if (status === 'in_progress') {
        setCurrentRide({ ...currentRide, status });
      } else if (status === 'started') {
        setCurrentRide({ ...currentRide, status });
      } else if (status === 'completed') {
        await markArrivedAPI(currentRide.id);
        Alert.alert('Ride Completed', 'Great job! Payment has been processed.');
        setShowMap(false);
        setIsLoading(true);
        if (webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({ type: 'clearRoute' }));
          webViewRef.current.postMessage(JSON.stringify({ type: 'clearMarkers' }));
        }
        setCurrentRide(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update ride status');
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
          onPress: () => console.log('SOS sent'),
        },
      ]
    );
  };

  const handleCancelRide = async () => {
    if (!currentRide) return;
    try {
      await cancelRideAPI(currentRide.id);
      Alert.alert('Ride Cancelled', 'The ride has been cancelled.');
      setCurrentRide(null);
      setShowMap(false);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
                  {currentRide.status === 'accepted' ? 'Navigate to Pickup' :
                   currentRide.status === 'in_progress' ? 'Pickup Passenger' :
                   'Navigate to Destination'}
                </Text>
                <Text style={styles.navigationAddress}>
                  {currentRide.status === 'started' ? currentRide.dropoff.address : currentRide.pickup.address}
                </Text>
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
              {currentRide.status === 'accepted' && (
                <TouchableOpacity style={styles.statusButton} onPress={() => handleUpdateStatus('in_progress')}>
                  <LinearGradient colors={['#FFB6D9', '#FF85C0']} style={styles.statusButtonGradient}>
                    <Text style={styles.statusButtonText}>I'm on my way</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {currentRide.status === 'in_progress' && (
                <TouchableOpacity style={styles.statusButton} onPress={() => handleUpdateStatus('started')}>
                  <LinearGradient colors={['#FFB6D9', '#FF85C0']} style={styles.statusButtonGradient}>
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

                <TouchableOpacity style={styles.toggleButton} onPress={handleToggleOnline} testID="toggle-online-button">
                  <LinearGradient colors={isDriverOnline ? ['#dc2626', '#b91c1c'] : ['#FFB6D9', '#FF85C0']} style={styles.toggleButtonGradient}>
                    <Power size={24} color="white" />
                    <Text style={styles.toggleButtonText}>{isDriverOnline ? 'Go Offline' : 'Go Online'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
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
                          icon={<Clock size={18} color="#D4A5F5" />} 
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
                      <Text style={styles.activeRideTitle}>Current Ride</Text>
                      <View style={styles.activeRideBadge}>
                        <View style={styles.pulseDot} />
                        <Text style={styles.activeRideBadgeText}>In Progress</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.viewMapButton} onPress={() => setShowMap(true)}>
                      <LinearGradient colors={['#FFB6D9', '#FF85C0']} style={styles.viewMapButtonGradient}>
                        <Navigation size={18} color="white" />
                        <Text style={styles.viewMapButtonText}>View Navigation</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <View style={styles.rideInfo}>
                      <LocationItem icon={<MapPin size={16} color="#FF85C0" />} text={currentRide.pickup.address} />
                      <LocationItem icon={<Navigation size={16} color="#FFB6D9" />} text={currentRide.dropoff.address} />
                      <LocationItem icon={<DollarSign size={16} color="#fbbf24" />} text={`${currentRide.fare} LBP`} />
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
                      {currentRide.status === 'accepted' && (
                        <TouchableOpacity style={styles.statusButton} onPress={() => handleUpdateStatus('in_progress')}>
                          <LinearGradient colors={['#FFB6D9', '#FF85C0']} style={styles.statusButtonGradient}>
                            <Text style={styles.statusButtonText}>I'm on my way</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                      {currentRide.status === 'in_progress' && (
                        <TouchableOpacity style={styles.statusButton} onPress={() => handleUpdateStatus('started')}>
                          <LinearGradient colors={['#FFB6D9', '#FF85C0']} style={styles.statusButtonGradient}>
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
    <LinearGradient colors={['#FFF5FA', '#FFE5F1']} style={styles.waitingGradient}>
      <View style={styles.waitingPulse}>
        <Zap size={32} color="#FF85C0" fill="#FF85C0" />
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
  content: {
    flex: 1,
    padding: 20,
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
  chatButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
  },
  chatButtonGradient: {
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
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
  rideActionsMap: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 245, 250, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#831843',
  },
  searchButton: {
    padding: 8,
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
