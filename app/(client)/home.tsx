import React, { useRef, useState, useEffect, useCallback } from 'react';
import EnhancedBookingModal from '../EnhancedBookingModal';
import mapHTML from '@/utils/mapHTML';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  Search,
  Navigation,
  Layers,
  Plus,
  Minus,
  X,
  MapPin,
  Flag,
  User,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useMap } from '@/providers/MapProvider';
import { useUser } from '@/hooks/user-store';
import { LinearGradient } from 'expo-linear-gradient';
import { createEcho } from '@/services/echo';
import axios from 'axios';
import { API_BASE_URL } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create API client
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default function ClientHomeScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [localUserLocation, setLocalUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite' | 'terrain'>('street');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [currentRide, setCurrentRide] = useState<any>(null);
  const [isLoadingRide, setIsLoadingRide] = useState(false);
  const { user } = useUser();
  const locationUpdateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const {
    selectedPlace,
    isRoutingMode,
    routeStart,
    routeEnd,
    currentRoute,
    rideBooking,
    isBookingMode,
    setRouteStart,
    setRouteEnd,
    calculateRoute,
    clearRoute,
    setUserLocation,
    startRideBooking,
    confirmRideBooking,
    cancelRideBooking,
  } = useMap();

  // Fetch current active ride on mount
  // Utility to get token safely
const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) console.warn('No auth token found. User may not be logged in.');
    return token;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};

// Fetch current ride
const fetchCurrentRide = useCallback(async () => {
  const token = await getAuthToken();
  if (!token) return; // Stop if no token

  try {
    setIsLoadingRide(true);
    const response = await apiClient.get('/passenger/rides/live', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.ride) {
      setCurrentRide(response.data.ride);
      router.push('/active-ride');
    } else {
      setCurrentRide(null);
    }
  } catch (error: any) {
    console.error('Error fetching current ride:', error);
    if (error.response?.status !== 404) {
      Alert.alert('Error', 'Failed to fetch current ride status');
    }
  } finally {
    setIsLoadingRide(false);
  }
}, [router]);

// Update passenger location
const updatePassengerLocation = useCallback(async (lat: number, lng: number) => {
  const token = await getAuthToken();
  if (!token) return;

  try {
    const response = await apiClient.post(
      '/passenger/location',
      { lat, lng },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log('Location updated successfully:', response.data);
  } catch (error: any) {
    if (error.response) {
      console.error(
        'Error updating passenger location:',
        error.response.status,
        error.response.data
      );
      if (error.response.status === 401) {
        console.warn('Unauthorized. Token may be invalid or expired.');
      }
    } else {
      console.error('Network or other error:', error.message);
    }
  }
}, []);



  // Get current location and center map
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Location permission is required to use this app.');
          const defaultCoords = { lat: 33.8886, lng: 35.4955 };
          setLocalUserLocation(defaultCoords);
          setUserLocation(defaultCoords);
          return;
        }
        
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        const coords = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
        
        setLocalUserLocation(coords);
        setUserLocation(coords);
        
        // Update backend with initial location
        await updatePassengerLocation(coords.lat, coords.lng);
        
        if (webViewRef.current) {
          webViewRef.current.postMessage(
            JSON.stringify({
              type: 'setView',
              ...coords,
              zoom: 15,
            })
          );
        }
      } catch (error) {
        console.error('Error getting location:', error);
        const defaultCoords = { lat: 33.8886, lng: 35.4955 };
        setLocalUserLocation(defaultCoords);
        setUserLocation(defaultCoords);
      }
    })();
  }, [setUserLocation, updatePassengerLocation]);

  // Periodic location updates (every 30 seconds when not in active ride)
  useEffect(() => {
    const startLocationUpdates = async () => {
      locationUpdateIntervalRef.current = setInterval(async () => {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          
          const coords = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          };
          
          setLocalUserLocation(coords);
          await updatePassengerLocation(coords.lat, coords.lng);
        } catch (error) {
          console.error('Error updating location:', error);
        }
      }, 30000); // Every 30 seconds
    };

    startLocationUpdates();

    return () => {
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
      }
    };
  }, [updatePassengerLocation]);

  // Check for active ride on mount
  useEffect(() => {
    fetchCurrentRide();
  }, [fetchCurrentRide]);

  // Add markers when selectedPlace changes
  useEffect(() => {
    if (selectedPlace && webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'addMarker',
          ...selectedPlace,
        })
      );
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'setView',
          lat: selectedPlace.lat,
          lng: selectedPlace.lng,
          zoom: 16,
        })
      );
    }
  }, [selectedPlace]);

  // Show route on map when calculated


// Inside your ClientHomeScreen component
useEffect(() => {
  if (currentRoute && webViewRef.current) {
    webViewRef.current.postMessage(
      JSON.stringify({
        type: 'showRoute',
        route: currentRoute,
      })
    );
    if (routeStart) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'addRouteMarker',
          ...routeStart,
          markerType: 'start',
        })
      );
    }
    if (routeEnd) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'addRouteMarker',
          ...routeEnd,
          markerType: 'end',
        })
      );
    }

    // Save to AsyncStorage
    const saveRouteData = async () => {
      try {
        await AsyncStorage.setItem(
          'routeData',
          JSON.stringify({
            currentRoute,
            routeStart,
            routeEnd,
          })
        );
      } catch (error) {
        console.error('Error saving route data:', error);
      }
    };

    saveRouteData();
  }
}, [currentRoute, routeStart, routeEnd]);


  // Echo subscription for ride updates
  useEffect(() => {
    let echoInstance: any;
    (async () => {
      echoInstance = await createEcho();
      if (!echoInstance || !user?.id) return;

      // Listen to passenger-specific channel
      const channel = echoInstance.private(`passenger.${user.id}`);
      
      channel.listen('RideAccepted', (data: any) => {
        console.log('Ride accepted:', data);
        setCurrentRide(data.ride);
        Alert.alert(
          'Ride Accepted!',
          `Driver ${data.ride.driver?.user?.name || 'Unknown'} has accepted your ride.`,
          [
            {
              text: 'View Ride',
              onPress: () => router.push('/active-ride'),
            },
          ]
        );
      });

      channel.listen('DriverLocationUpdated', (data: any) => {
        console.log('Driver location updated:', data);
        // Update driver location on map if needed
      });

      channel.listen('RideCancelled', (data: any) => {
        console.log('Ride cancelled:', data);
        setCurrentRide(null);
        Alert.alert(
          'Ride Cancelled',
          data.message || 'Your ride has been cancelled.',
          [{ text: 'OK' }]
        );
      });

      channel.listen('RideCompleted', (data: any) => {
        console.log('Ride completed:', data);
        setCurrentRide(null);
        Alert.alert(
          'Ride Completed',
          `Your ride has been completed. Fare: $${data.ride?.fare || 'N/A'}`,
          [{ text: 'OK' }]
        );
      });
    })();

    return () => {
      if (echoInstance) {
        echoInstance.disconnect();
      }
    };
  }, [user, router]);
  // Inside your ClientHomeScreen component
useEffect(() => {
  const restoreRouteData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('routeData');
      if (savedData) {
        const { currentRoute: savedRoute, routeStart: savedStart, routeEnd: savedEnd } = JSON.parse(savedData);

        if (savedRoute && webViewRef.current) {
          webViewRef.current.postMessage(
            JSON.stringify({
              type: 'showRoute',
              route: savedRoute,
            })
          );
        }

        if (savedStart && webViewRef.current) {
          webViewRef.current.postMessage(
            JSON.stringify({
              type: 'addRouteMarker',
              ...savedStart,
              markerType: 'start',
            })
          );
        }

        if (savedEnd && webViewRef.current) {
          webViewRef.current.postMessage(
            JSON.stringify({
              type: 'addRouteMarker',
              ...savedEnd,
              markerType: 'end',
            })
          );
        }
      }
    } catch (error) {
      console.error('Error restoring route data:', error);
    }
  };

  restoreRouteData();
}, []);

  // Auto-calculate route when both points are set
  useEffect(() => {
    if (routeStart && routeEnd && isBookingMode && !currentRoute) {
      calculateRoute();
    }
  }, [routeStart, routeEnd, isBookingMode, currentRoute, calculateRoute]);

  // Handle map messages
  const handleMapMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapClick') {
        const marker = {
          id: Date.now().toString(),
          lat: data.lat,
          lng: data.lng,
          title: 'Selected Location',
          description: `${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`,
        };
        if (isBookingMode) {
          if (!routeStart) {
            setRouteStart(marker);
          } else if (!routeEnd) {
            setRouteEnd(marker);
          }
        }
      }
    } catch (error) {
      console.error('Error handling map message:', error);
    }
  }, [isBookingMode, routeStart, routeEnd, setRouteStart, setRouteEnd]);

  // Start booking flow
  const handleStartBooking = useCallback(async () => {
    // Check for active ride from backend
    try {
      const response = await apiClient.get('/passenger/rides/live');
      if (response.data.ride) {
        Alert.alert(
          'Active Ride',
          'You already have an active ridessss. Please complete or cancel it before booking another.',
          [
            {
              text: 'View Ride',
              onPress: () => router.push('/active-ride'),
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }
    } catch (error) {
      console.error('Error checking active ride:', error);
    }
    
    startRideBooking();
  }, [router, startRideBooking]);

  
    const handleCancelBooking = useCallback(() => {
    cancelRideBooking();
    clearRoute();
    webViewRef.current?.postMessage(JSON.stringify({ type: 'clearRoute' }));
  }, [cancelRideBooking, clearRoute]);

  // Cancel ride flow
const handleCancelride = useCallback(async () => {
  try {
    const rideId = currentRide?.id;
    if (!rideId) {
      console.warn('No ride to cancel');
      return;
    }

    // Call your cancel ride API
    const { data } = await apiClient.post(`/rides/${rideId}/cancel`, {
      reason: 'changed_mind', // pick one of your allowed reasons
      note: 'User cancelled from app', // optional
    });

    console.log('Ride cancelled successfully:', data);

    // Clear route in your app
    clearRoute();
    webViewRef.current?.postMessage(JSON.stringify({ type: 'clearRoute' }));

    // Clear saved route data
    try {
      await AsyncStorage.removeItem('routeData');
    } catch (error) {
      console.error('Error clearing route data:', error);
    }

    Alert.alert('Success', 'Ride cancelled successfully');
  } catch (error) {
    console.error('Error cancelling ride:', error);
  }
}, [currentRide, clearRoute, webViewRef]);



  // Confirm booking and create ride via API
  const handleConfirmBooking = useCallback(async () => {
    if (!routeStart || !routeEnd || !rideBooking) {
      Alert.alert('Error', 'Please select pickup and destination locations');
      return;
    }

    try {
      setIsLoading(true);
      
      // Create ride via API
      const response = await apiClient.post('/rides', {
        origin_lat: routeStart.lat,
        origin_lng: routeStart.lng,
        destination_lat: routeEnd.lat,
        destination_lng: routeEnd.lng,
        distance: rideBooking.route.distance / 1000, // Convert meters to km
        duration: rideBooking.route.duration / 60, // Convert seconds to minutes
        fare: rideBooking.finalFare,
        is_pool: false,
      });

      if (response.data.ride) {
        setCurrentRide(response.data.ride);
        confirmRideBooking();
        
        Alert.alert(
          'Ride Requested!',
          'Searching for nearby drivers...',
          [
            {
              text: 'OK',
              onPress: () => router.push('/active-ride'),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error creating ride:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || error.response?.data?.message || 'Failed to create ride. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [routeStart, routeEnd, rideBooking, confirmRideBooking, router]);

  // Center map on user location
  const centerOnUser = useCallback(() => {
    if (localUserLocation && webViewRef.current) {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: 'setView',
          ...localUserLocation,
          zoom: 15,
        })
      );
    }
  }, [localUserLocation]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    webViewRef.current?.postMessage(JSON.stringify({ type: 'zoomIn' }));
  }, []);

  const zoomOut = useCallback(() => {
    webViewRef.current?.postMessage(JSON.stringify({ type: 'zoomOut' }));
  }, []);

  // Change map layer
  const changeLayer = useCallback((layer: 'street' | 'satellite' | 'terrain') => {
    setMapLayer(layer);
    webViewRef.current?.postMessage(
      JSON.stringify({
        type: 'changeLayer',
        layer,
      })
    );
    setShowLayerMenu(false);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => router.push('/search')}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F8F9FA']}
              style={styles.searchGradient}
            >
              <Search size={20} color="#666" />
              <Text style={styles.searchPlaceholder}>
                {isBookingMode
                  ? !routeStart
                    ? 'Search pickup location...'
                    : 'Search destination...'
                  : 'Search Lebanon places...'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <LinearGradient
              colors={['#ffb6d9b2', '#ff85c0ae']}
              style={styles.profileGradient}
            >
              <User size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.controlsRight}>
          <TouchableOpacity style={styles.controlButton} onPress={zoomIn}>
            <Plus size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={zoomOut}>
            <Minus size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.controlButton}
            onPress={centerOnUser}
          >
            <Navigation size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowLayerMenu(!showLayerMenu)}
          >
            <Layers size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {showLayerMenu && (
          <View style={styles.layerMenu}>
            <TouchableOpacity
              style={[
                styles.layerOption,
                mapLayer === 'street' && styles.layerOptionActive,
              ]}
              onPress={() => changeLayer('street')}
            >
              <Text
                style={[
                  styles.layerText,
                  mapLayer === 'street' && styles.layerTextActive,
                ]}
              >
                Street
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.layerOption,
                mapLayer === 'satellite' && styles.layerOptionActive,
              ]}
              onPress={() => changeLayer('satellite')}
            >
              <Text
                style={[
                  styles.layerText,
                  mapLayer === 'satellite' && styles.layerTextActive,
                ]}
              >
                Satellite
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.layerOption,
                mapLayer === 'terrain' && styles.layerOptionActive,
              ]}
              onPress={() => changeLayer('terrain')}
            >
              <Text
                style={[
                  styles.layerText,
                  mapLayer === 'terrain' && styles.layerTextActive,
                ]}
              >
                Terrain
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isBookingMode && !rideBooking && (
          <View style={styles.routeControls}>
            <View style={styles.routeInfo}>
              <View style={styles.routeStep}>
                <View
                  style={[
                    styles.routeStepIcon,
                    { backgroundColor: routeStart ? '#FF5252' : '#f054debc' },
                  ]}
                >
                  <MapPin size={16} color="white" />
                </View>
                <Text style={styles.routeStepText}>
                  {routeStart ? routeStart.title : 'Tap map or search for pickup'}
                </Text>
              </View>
              <View style={styles.routeStep}>
                <View
                  style={[
                    styles.routeStepIcon,
                    { backgroundColor: routeEnd ? '#9C27B0' : '#E0E0E0' },
                  ]}
                >
                  <Flag size={16} color="white" />
                </View>
                <Text style={styles.routeStepText}>
                  {routeEnd ? routeEnd.title : 'Tap map or search for destination'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelBooking}
            >
              <X size={20} color="#FF5252" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isBookingMode && !currentRide && (
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.bookRideButton}
              onPress={handleStartBooking}
              disabled={isLoadingRide}
            >
              <LinearGradient
                colors={['#FFB6D9', '#f964ac7c']}
                style={styles.bookRideGradient}
              >
                {isLoadingRide ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.bookRideText}>Where to?</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {currentRide && (
          <View style={styles.activeRideBanner}>
            <Text style={styles.activeRideText}>You have an active ride</Text>
            <TouchableOpacity
              style={styles.viewRideButton}
              onPress={() => router.push('/active-ride')}
            >
              <Text style={styles.viewRideButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <WebView
        ref={webViewRef}
        source={{ html: mapHTML }}
        style={styles.map}
        onMessage={handleMapMessage}
        onLoadEnd={() => {
          setIsLoading(false);
          if (localUserLocation) {
            webViewRef.current?.postMessage(
              JSON.stringify({
                type: 'setUserLocation',
                ...localUserLocation,
              })
            );
          }
        }}
        javaScriptEnabled
        domStorageEnabled
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}

      <EnhancedBookingModal
        visible={!!rideBooking}
        onClose={handleCancelBooking }
        onConfirm={handleConfirmBooking}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: 'box-none',
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 60,
    gap: 12,
    pointerEvents: 'auto',
  },
  searchBar: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsRight: {
    position: 'absolute',
    right: 16,
    top: 140,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    pointerEvents: 'auto',
  },
  controlButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  layerMenu: {
    position: 'absolute',
    right: 72,
    top: 140,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    pointerEvents: 'auto',
  },
  layerOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  layerOptionActive: {
    backgroundColor: '#F0F0F0',
  },
  layerText: {
    fontSize: 14,
    color: '#333',
  },
  layerTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  routeControls: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    pointerEvents: 'auto',
  },
  routeInfo: {
    gap: 12,
  },
  routeStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeStepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeStepText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFF0F0',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF5252',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    pointerEvents: 'auto',
  },
  bookRideButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  bookRideGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookRideText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  activeRideBanner: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    pointerEvents: 'auto',
  },
  activeRideText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  viewRideButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewRideButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 2,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});