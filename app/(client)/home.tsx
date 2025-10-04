import React, { useRef, useState, useEffect } from 'react';
import EnhancedBookingModal from './EnhancedBookingModal';
import mapHTML from '@/utils/mapHTML';

import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Modal,
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
  Car,
  Clock,
  DollarSign,
  Check,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useMap } from '@/providers/MapProvider';
import { useUser } from '@/hooks/user-store';
import { LinearGradient } from 'expo-linear-gradient';

export default function ClientHome() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [localUserLocation, setLocalUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite' | 'terrain'>('street');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showBookingConfirm, setShowBookingConfirm] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

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

  // Get current location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      const coords = { lat: location.coords.latitude, lng: location.coords.longitude };
      setLocalUserLocation(coords);
      setUserLocation(coords);

      webViewRef.current?.postMessage(JSON.stringify({ type: 'setView', ...coords, zoom: 15 }));
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
      
      // Add route markers
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

  // Trigger route calculation when both points are set
  useEffect(() => {
    if (routeStart && routeEnd && isBookingMode) {
      calculateRoute();
    }
  }, [routeStart, routeEnd, isBookingMode, calculateRoute]);

  // Show booking confirmation modal when route is ready
  useEffect(() => {
    if (rideBooking) {
      setShowBookingConfirm(true);
    }
  }, [rideBooking]);

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

  const handleConfirmBooking = () => {
    if (rideBooking) {
      setShowBookingConfirm(false);
      confirmRideBooking();
      
      // Navigate to a confirmation/waiting screen
      // You can create this screen later
      alert(`Ride booked! Fare: ${rideBooking.baseFare.toLocaleString()} LBP`);
      
      // For now, just clear the booking
      handleCancelBooking();
    }
  };

  const handleCancelBooking = () => {
    setShowBookingConfirm(false);
    cancelRideBooking();
    webViewRef.current?.postMessage(JSON.stringify({ type: 'clearRoute' }));
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

        {isBookingMode && !showBookingConfirm && (
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

        {!isBookingMode && (
          <View style={styles.bottomActions}>
            <TouchableOpacity 
              style={styles.bookRideButton}
              onPress={startRideBooking}
            >
              <LinearGradient colors={['#007AFF', '#0051D5']} style={styles.bookRideGradient}>
                <Car size={24} color="white" />
                <Text style={styles.bookRideText}>Book a Ride</Text>
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
  visible={showBookingModal} 
  onClose={() => setShowBookingModal(false)} 
/>
    </View>
  );
}

const styles = StyleSheet.create({
 container: {
  flex: 1,
  position: 'relative', // to make zIndex work properly
  backgroundColor: '#fff',
},
overlay: {
  ...StyleSheet.absoluteFillObject,
  zIndex: 1, // ensure it's on top
  pointerEvents: 'box-none',
},
  map: {
  ...StyleSheet.absoluteFillObject,
  zIndex: -1,
},
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 12,
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
    top: '35%',
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
    top: '45%',
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
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  routeInfo: {
    marginBottom: 12,
  },
  routeStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
    bottom: 30,
    left: 16,
    right: 16,
  },
  bookRideButton: {
    borderRadius: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookRideGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    gap: 12,
  },
  bookRideText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  rideDetails: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  locationDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  tripStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelModalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelModalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    flex: 2,
    borderRadius: 12,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});