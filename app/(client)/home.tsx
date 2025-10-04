import React, { useRef, useState, useEffect } from 'react';
import EnhancedBookingModal from './EnhancedBookingModal';
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

export default function ClientHomeScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [localUserLocation, setLocalUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite' | 'terrain'>('street');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [hasActiveRide, setHasActiveRide] = useState(false);

  const { user } = useUser();
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

  // Get current location and center map immediately
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Location permission is required to use this app.');
          // Default to Beirut center if permission denied
          const defaultCoords = { lat: 33.8886, lng: 35.4955 };
          setLocalUserLocation(defaultCoords);
          setUserLocation(defaultCoords);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const coords = { lat: location.coords.latitude, lng: location.coords.longitude };
        setLocalUserLocation(coords);
        setUserLocation(coords);

        // Center map on user location immediately after getting coordinates
        if (webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({ 
            type: 'setView', 
            ...coords, 
            zoom: 15 
          }));
        }
      } catch (error) {
        console.error('Error getting location:', error);
        // Fallback to Beirut center
        const defaultCoords = { lat: 33.8886, lng: 35.4955 };
        setLocalUserLocation(defaultCoords);
        setUserLocation(defaultCoords);
      }
    })();
  }, [setUserLocation]);

  // Add markers when selectedPlace changes
  useEffect(() => {
    if (selectedPlace && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'addMarker', ...selectedPlace }));
      webViewRef.current.postMessage(JSON.stringify({ type: 'setView', lat: selectedPlace.lat, lng: selectedPlace.lng, zoom: 16 }));
    }
  }, [selectedPlace]);

  // Show route on map when calculated
  useEffect(() => {
    if (currentRoute && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ type: 'showRoute', route: currentRoute }));
      
      if (routeStart) {
        webViewRef.current.postMessage(JSON.stringify({ 
          type: 'addRouteMarker', 
          ...routeStart,
          markerType: 'start'
        }));
      }
      if (routeEnd) {
        webViewRef.current.postMessage(JSON.stringify({ 
          type: 'addRouteMarker', 
          ...routeEnd,
          markerType: 'end'
        }));
      }
    }
  }, [currentRoute, routeStart, routeEnd]);

  // Auto-calculate route when both points are set
  useEffect(() => {
    if (routeStart && routeEnd && isBookingMode && !currentRoute) {
      calculateRoute();
    }
  }, [routeStart, routeEnd, isBookingMode, currentRoute, calculateRoute]);

  // Handle map messages
  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapClick') {
        const marker = { 
          id: Date.now().toString(), 
          lat: data.lat, 
          lng: data.lng, 
          title: 'Selected Location', 
          description: `${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}` 
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
      console.error(error);
    }
  };

  const handleStartBooking = () => {
    if (hasActiveRide) {
      Alert.alert(
        'Active Ride',
        'You already have an active ride. Please complete or cancel it before booking another.',
        [{ text: 'OK' }]
      );
      return;
    }
    startRideBooking();
  };

  const handleCancelBooking = () => {
    cancelRideBooking();
    webViewRef.current?.postMessage(JSON.stringify({ type: 'clearRoute' }));
  };

  const handleConfirmBooking = () => {
    setHasActiveRide(true);
    confirmRideBooking();
    // Navigate to active ride screen or show confirmation
    Alert.alert(
      'Ride Confirmed!',
      'Searching for nearby drivers...',
      [
        {
          text: 'OK',
          onPress: () => router.push('/active-ride')
        }
      ]
    );
  };

  const centerOnUser = () => {
    if (localUserLocation && webViewRef.current) {
      webViewRef.current?.postMessage(JSON.stringify({ type: 'setView', ...localUserLocation, zoom: 15 }));
    }
  };

  const zoomIn = () => webViewRef.current?.postMessage(JSON.stringify({ type: 'zoomIn' }));
  const zoomOut = () => webViewRef.current?.postMessage(JSON.stringify({ type: 'zoomOut' }));
  
  const changeLayer = (layer: 'street' | 'satellite' | 'terrain') => {
    setMapLayer(layer);
    webViewRef.current?.postMessage(JSON.stringify({ type: 'changeLayer', layer }));
    setShowLayerMenu(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.searchBar}
            onPress={() => router.push('/search')}
          >
            <LinearGradient colors={['#FFFFFF', '#F8F9FA']} style={styles.searchGradient}>
              <Search size={20} color="#666" />
              <Text style={styles.searchPlaceholder}>
                {isBookingMode 
                  ? (!routeStart ? 'Search pickup location...' : 'Search destination...')
                  : 'Search places...'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
            <LinearGradient colors={['#007AFF', '#0051D5']} style={styles.profileGradient}>
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
          <TouchableOpacity style={styles.controlButton} onPress={centerOnUser}>
            <Navigation size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={() => setShowLayerMenu(!showLayerMenu)}>
            <Layers size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {showLayerMenu && (
          <View style={styles.layerMenu}>
            <TouchableOpacity
              style={[styles.layerOption, mapLayer === 'street' && styles.layerOptionActive]}
              onPress={() => changeLayer('street')}
            >
              <Text style={[styles.layerText, mapLayer === 'street' && styles.layerTextActive]}>
                Street
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.layerOption, mapLayer === 'satellite' && styles.layerOptionActive]}
              onPress={() => changeLayer('satellite')}
            >
              <Text style={[styles.layerText, mapLayer === 'satellite' && styles.layerTextActive]}>
                Satellite
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.layerOption, mapLayer === 'terrain' && styles.layerOptionActive]}
              onPress={() => changeLayer('terrain')}
            >
              <Text style={[styles.layerText, mapLayer === 'terrain' && styles.layerTextActive]}>
                Terrain
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isBookingMode && !rideBooking && (
          <View style={styles.routeControls}>
            <View style={styles.routeInfo}>
              <View style={styles.routeStep}>
                <View style={[styles.routeStepIcon, { backgroundColor: routeStart ? '#FF5252' : '#E0E0E0' }]}>
                  <MapPin size={16} color="white" />
                </View>
                <Text style={styles.routeStepText}>
                  {routeStart ? routeStart.title : 'Tap map or search for pickup'}
                </Text>
              </View>
              <View style={styles.routeStep}>
                <View style={[styles.routeStepIcon, { backgroundColor: routeEnd ? '#9C27B0' : '#E0E0E0' }]}>
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

        {!isBookingMode && !hasActiveRide && (
          <View style={styles.bottomActions}>
            <TouchableOpacity 
              style={styles.bookRideButton}
              onPress={handleStartBooking}
            >
              <LinearGradient colors={['#007AFF', '#0051D5']} style={styles.bookRideGradient}>
                <Text style={styles.bookRideText}>Where to?</Text>
              </LinearGradient>
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
            webViewRef.current?.postMessage(JSON.stringify({ 
              type: 'setUserLocation', 
              ...localUserLocation 
            }));
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#fff',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 60,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileButton: {
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  profileGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 16,
    color: '#999',
    flex: 1,
  },
  controlsRight: {
    position: 'absolute',
    right: 16,
    top: '40%',
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  controlButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  layerMenu: {
    position: 'absolute',
    right: 76,
    top: '42%',
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    padding: 8,
    minWidth: 140,
  },
  layerOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  layerOptionActive: {
    backgroundColor: '#E3F2FD',
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
    top: 130,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  routeInfo: {
    marginBottom: 12,
  },
  routeStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeStepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    paddingVertical: 12,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5252',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
  },
  bookRideButton: {
    borderRadius: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  bookRideGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    gap: 12,
  },
  bookRideText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});