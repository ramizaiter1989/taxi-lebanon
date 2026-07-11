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
import { authCache } from '@/utils/authCache'; // ✅ Import auth cache

// Create API client
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // ✅ Reduced timeout for faster failure
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ✅ Optimized interceptor using auth cache
apiClient.interceptors.request.use(
  (config) => {
    const token = authCache.getToken(); // ✅ INSTANT - no await needed
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Debounce configuration
const MIN_UPDATE_INTERVAL = 10000; // 10 seconds
const lastLocationUpdate = { current: 0 };

// ✅ Geocoding cache
const geocodeCache = new Map<string, string>();

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

  // ✅ Optimized: Fetch current ride with instant token access
  const fetchCurrentRide = useCallback(async () => {
    if (authCache.isLocalSession()) return;

    const token = authCache.getToken(); // ✅ INSTANT
    if (!token) return;

    try {
      setIsLoadingRide(true);
      const response = await apiClient.get('/passenger/rides/live');

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

  // ✅ Optimized: Debounced location updates
  const updatePassengerLocation = useCallback(async (lat: number, lng: number) => {
    if (authCache.isLocalSession()) return;

    const token = authCache.getToken(); // ✅ INSTANT
    if (!token) return;

    // Debounce check
    const now = Date.now();
    if (now - lastLocationUpdate.current < MIN_UPDATE_INTERVAL) {
      return;
    }
    
    lastLocationUpdate.current = now;
    
    try {
      await apiClient.post('/passenger/location', { lat, lng });
      console.log('✅ Location updated');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.warn('⚠️ Token expired or invalid');
      }
      console.error('Error updating location:', error.response?.status);
    }
  }, []);

  // ✅ Optimized: Initial location with last known first
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          const defaultCoords = { lat: 33.8886, lng: 35.4955 };
          setLocalUserLocation(defaultCoords);
          setUserLocation(defaultCoords);
          return;
        }
        
        // Try last known first (instant)
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          const coords = {
            lat: lastKnown.coords.latitude,
            lng: lastKnown.coords.longitude,
          };
          
          setLocalUserLocation(coords);
          setUserLocation(coords);
          
          if (webViewRef.current) {
            webViewRef.current.postMessage(
              JSON.stringify({
                type: 'setView',
                ...coords,
                zoom: 15,
              })
            );
          }
        }
        
        // Get accurate location in background
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        }).then((location) => {
          const coords = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          };
          
          setLocalUserLocation(coords);
          setUserLocation(coords);
          updatePassengerLocation(coords.lat, coords.lng);
          
          if (webViewRef.current) {
            webViewRef.current.postMessage(
              JSON.stringify({
                type: 'setView',
                ...coords,
                zoom: 15,
              })
            );
          }
        });
        
      } catch (error) {
        console.error('Error getting location:', error);
        const defaultCoords = { lat: 33.8886, lng: 35.4955 };
        setLocalUserLocation(defaultCoords);
        setUserLocation(defaultCoords);
      }
    })();
  }, [setUserLocation, updatePassengerLocation]);

  // Periodic location updates
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
      }, 30000);
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

  // Show route on map
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

      // Save to AsyncStorage (non-blocking)
      AsyncStorage.setItem(
        'routeData',
        JSON.stringify({
          currentRoute,
          routeStart,
          routeEnd,
        })
      ).catch(error => console.error('Error saving route data:', error));
    }
  }, [currentRoute, routeStart, routeEnd]);

  // Echo subscription for ride updates
  useEffect(() => {
    let echoInstance: any;
    (async () => {
      echoInstance = await createEcho();
      if (!echoInstance || !user?.id) return;

      const channel = echoInstance.private(`passenger.${user.id}`);
      
      channel.listen('RideAccepted', (data: any) => {
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
      });

      channel.listen('RideCancelled', (data: any) => {
        setCurrentRide(null);
        Alert.alert(
          'Ride Cancelled',
          data.message || 'Your ride has been cancelled.',
          [{ text: 'OK' }]
        );
      });

      channel.listen('RideCompleted', (data: any) => {
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

  
  // Restore route data (deferred)
  useEffect(() => {
    setTimeout(async () => {
      try {
        const savedData = await AsyncStorage.getItem('routeData');
        if (!savedData || !webViewRef.current) return;
        
        const { currentRoute: savedRoute, routeStart: savedStart, routeEnd: savedEnd } = JSON.parse(savedData);

        if (savedRoute) {
          webViewRef.current.postMessage(
            JSON.stringify({ type: 'showRoute', route: savedRoute })
          );
        }

        if (savedStart) {
          webViewRef.current.postMessage(
            JSON.stringify({
              type: 'addRouteMarker',
              ...savedStart,
              markerType: 'start',
            })
          );
        }

        if (savedEnd) {
          webViewRef.current.postMessage(
            JSON.stringify({
              type: 'addRouteMarker',
              ...savedEnd,
              markerType: 'end',
            })
          );
        }
      } catch (error) {
        console.error('Error restoring route data:', error);
      }
    }, 100);
  }, []);

  // Auto-calculate route
  useEffect(() => {
    if (routeStart && routeEnd && isBookingMode && !currentRoute) {
      calculateRoute();
    }
  }, [routeStart, routeEnd, isBookingMode, currentRoute, calculateRoute]);

  // ✅ Optimized: Map click with geocoding cache
  const handleMapMessage = useCallback(async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapClick' && isBookingMode) {
        const cacheKey = `${data.lat.toFixed(4)},${data.lng.toFixed(4)}`;
        
        // Create marker immediately
        const marker = {
          id: Date.now().toString(),
          lat: data.lat,
          lng: data.lng,
          title: `Location (${data.lat.toFixed(4)}, ${data.lng.toFixed(4)})`,
          description: 'Getting address...',
        };

        // Set marker immediately
        if (!routeStart) {
          setRouteStart(marker);
        } else if (!routeEnd) {
          setRouteEnd(marker);
        }

        // Geocode in background
        (async () => {
          try {
            // Check cache first
            if (geocodeCache.has(cacheKey)) {
              const address = geocodeCache.get(cacheKey)!;
              const updatedMarker = { ...marker, title: address, description: address };
              
              if (!routeStart) {
                setRouteStart(updatedMarker);
              } else if (!routeEnd) {
                setRouteEnd(updatedMarker);
              }
              return;
            }

            const [address] = await Location.reverseGeocodeAsync({
              latitude: data.lat,
              longitude: data.lng,
            });

            const addressParts = [
              address?.street,
              address?.city,
              address?.region,
            ].filter(Boolean);

            const readableAddress = addressParts.length > 0
              ? addressParts.join(', ')
              : marker.title;

            // Cache result
            geocodeCache.set(cacheKey, readableAddress);

            const updatedMarker = { ...marker, title: readableAddress, description: readableAddress };

            if (!routeStart) {
              setRouteStart(updatedMarker);
            } else if (!routeEnd) {
              setRouteEnd(updatedMarker);
            }
          } catch (geocodeError) {
            console.error('Error reverse geocoding:', geocodeError);
          }
        })();
      }
    } catch (error) {
      console.error('Error handling map message:', error);
    }
  }, [isBookingMode, routeStart, routeEnd, setRouteStart, setRouteEnd]);

  // ✅ Optimized: Start booking immediately, check in background
  const handleStartBooking = useCallback(() => {
    if (authCache.isGuestUser()) {
      Alert.alert(
        'Sign Up Required',
        'Create an account to book rides. You can keep browsing the map as a guest.',
        [
          { text: 'Continue Browsing', style: 'cancel' },
          { text: 'Sign Up', onPress: () => router.push('/register') },
        ]
      );
      return;
    }

    // Start booking immediately
    startRideBooking();
    
    // Check for conflicts in background (non-blocking)
    apiClient.get('/passenger/rides/live')
      .then((response) => {
        if (response.data.ride) {
          // If there's an active ride, cancel booking and show alert
          cancelRideBooking();
          Alert.alert(
            'Active Ride',
            'You already have an active ride. Please complete or cancel it before booking another.',
            [
              {
                text: 'View Ride',
                onPress: () => router.push('/active-ride'),
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }
      })
      .catch((error) => {
        if (error.response?.status !== 404) {
          console.error('Error checking active ride:', error);
        }
      });
  }, [startRideBooking, cancelRideBooking, router]);

  const handleCancelBooking = useCallback(() => {
    cancelRideBooking();
    clearRoute();
    webViewRef.current?.postMessage(JSON.stringify({ type: 'clearRoute' }));
  }, [cancelRideBooking, clearRoute]);

  const handleCancelride = useCallback(async () => {
    try {
      const rideId = currentRide?.id;
      if (!rideId) return;

      const { data } = await apiClient.post(`/rides/${rideId}/cancel`, {
        reason: 'changed_mind',
        note: 'User cancelled from app',
      });

      clearRoute();
      webViewRef.current?.postMessage(JSON.stringify({ type: 'clearRoute' }));
      
      await AsyncStorage.removeItem('routeData');

      Alert.alert('Success', 'Ride cancelled successfully');
    } catch (error) {
      console.error('Error cancelling ride:', error);
    }
  }, [currentRide, clearRoute]);

const checkActiveRide = async () => {
  try {
    const response = await apiClient.get('/passenger/rides/live');
    if (response.data.ride) {
      Alert.alert('Error', 'You already have an active ride. Please complete or cancel it first.');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking active ride:', error);
    return false;
  }
};

const handleConfirmBooking = useCallback(async () => {
  if (!routeStart || !routeEnd || !rideBooking) {
    Alert.alert('Error', 'Please select pickup and destination locations');
    return;
  }

  if (authCache.isGuestUser()) {
    Alert.alert(
      'Sign Up Required',
      'Create an account to book rides.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Up', onPress: () => router.push('/register') },
      ]
    );
    return;
  }

  const hasActiveRide = await checkActiveRide();
  if (hasActiveRide) return;

  try {
    setIsLoading(true);
    // ... rest of your code
  } catch (error) {
    // ... error handling
  } finally {
    setIsLoading(false);
  }
}, [routeStart, routeEnd, rideBooking, confirmRideBooking, router]);

  

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

  const zoomIn = useCallback(() => {
    webViewRef.current?.postMessage(JSON.stringify({ type: 'zoomIn' }));
  }, []);

  const zoomOut = useCallback(() => {
    webViewRef.current?.postMessage(JSON.stringify({ type: 'zoomOut' }));
  }, []);

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
                  <ActivityIndicator size="small" color="#fffffff7" />
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
        cacheEnabled={true}
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
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
        onClose={handleCancelBooking}
        onConfirm={handleConfirmBooking}
      />
    </View>
  );
}

// Styles remain the same...
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
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