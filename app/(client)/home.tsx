import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, 
  Navigation, 
  Layers,
  Plus,
  Minus,
  Route,
  X,
  MapPin,
  Flag,
  User,
} from 'lucide-react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useMap } from '@/providers/MapProvider';
import { useUser } from '@/providers/UserProvider';
import { LinearGradient } from 'expo-linear-gradient';

export default function MapScreen() {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [localUserLocation, setLocalUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite' | 'terrain'>('street');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const { userData, isLoading: userLoading } = useUser();
  const { 
    addMarker, 
    clearMarkers, 
    selectedPlace, 
    isRoutingMode, 
    routeStart, 
    routeEnd, 
    currentRoute,
    setRoutingMode, 
    setRouteStart, 
    setRouteEnd, 
    calculateRoute, 
    clearRoute,
    setUserLocation,
    startRoutingFromCurrentLocation
  } = useMap();

  useEffect(() => {
    if (!userLoading && !userData) {
      router.replace('/login');
    }
  }, [userData, userLoading]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
      setLocalUserLocation(coords);
      setUserLocation(coords);
      
      // Center map on user location
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'setView',
          lat: coords.lat,
          lng: coords.lng,
          zoom: 15
        }));
      }
    })();
  }, [setUserLocation]);

  useEffect(() => {
    if (selectedPlace && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'addMarker',
        ...selectedPlace
      }));
      webViewRef.current.postMessage(JSON.stringify({
        type: 'setView',
        lat: selectedPlace.lat,
        lng: selectedPlace.lng,
        zoom: 16
      }));
    }
  }, [selectedPlace]);

  useEffect(() => {
    if (routeStart && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'addRouteMarker',
        ...routeStart,
        markerType: 'start'
      }));
    }
  }, [routeStart]);

  useEffect(() => {
    if (routeEnd && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'addRouteMarker',
        ...routeEnd,
        markerType: 'end'
      }));
      calculateRoute();
    }
  }, [routeEnd, calculateRoute]);

  useEffect(() => {
    if (currentRoute && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'showRoute',
        route: currentRoute
      }));
    }
  }, [currentRoute]);

  useEffect(() => {
    if (!isRoutingMode && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'clearRoute'
      }));
    }
  }, [isRoutingMode]);

  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Map message:', data);
      
      if (data.type === 'mapClick') {
        const marker = {
          id: Date.now().toString(),
          lat: data.lat,
          lng: data.lng,
          title: 'Custom Marker',
          description: `Location: ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`
        };
        
        if (isRoutingMode) {
          if (!routeStart) {
            setRouteStart(marker);
          } else if (!routeEnd) {
            setRouteEnd(marker);
          }
        } else {
          addMarker(marker);
        }
      } else if (data.type === 'markerClick') {
        router.push({
          pathname: '/place-details',
          params: { 
            id: data.id,
            title: data.title,
            description: data.description,
            lat: data.lat,
            lng: data.lng
          }
        });
      }
    } catch (error) {
      console.error('Error handling map message:', error);
    }
  };

  const centerOnUser = () => {
    if (localUserLocation && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'setView',
        lat: localUserLocation.lat,
        lng: localUserLocation.lng,
        zoom: 15
      }));
    }
  };

  const zoomIn = () => {
    webViewRef.current?.postMessage(JSON.stringify({ type: 'zoomIn' }));
  };

  const zoomOut = () => {
    webViewRef.current?.postMessage(JSON.stringify({ type: 'zoomOut' }));
  };

  const changeLayer = (layer: 'street' | 'satellite' | 'terrain') => {
    if (!layer || !layer.trim()) return;
    if (layer.length > 20) return;
    const sanitizedLayer = layer.trim();
    
    setMapLayer(sanitizedLayer as 'street' | 'satellite' | 'terrain');
    webViewRef.current?.postMessage(JSON.stringify({ type: 'changeLayer', layer: sanitizedLayer }));
    setShowLayerMenu(false);
  };

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        .leaflet-container { background: #f0f0f0; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        // Initialize map
        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false
        }).setView([40.7128, -74.0060], 13);

        // Tile layers
        var layers = {
          street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
          }),
          satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
          }),
          terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            maxZoom: 17,
          })
        };

        layers.street.addTo(map);
        var currentLayer = 'street';

        // Markers storage
        var markers = {};
        var userMarker = null;
        var routeStartMarker = null;
        var routeEndMarker = null;
        var routeLayer = null;

        // Custom icon
        var customIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        var userIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        var startIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        var endIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        // Handle map clicks
        map.on('click', function(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapClick',
            lat: e.latlng.lat,
            lng: e.latlng.lng
          }));
        });

        // Listen for messages from React Native
        document.addEventListener('message', function(e) {
          handleMessage(e.data);
        });

        window.addEventListener('message', function(e) {
          handleMessage(e.data);
        });

        function handleMessage(data) {
          try {
            var message = JSON.parse(data);
            
            switch(message.type) {
              case 'setView':
                map.setView([message.lat, message.lng], message.zoom || map.getZoom());
                break;
                
              case 'addMarker':
                if (markers[message.id]) {
                  map.removeLayer(markers[message.id]);
                }
                var marker = L.marker([message.lat, message.lng], { icon: customIcon })
                  .addTo(map)
                  .bindPopup('<b>' + message.title + '</b><br>' + message.description);
                
                marker.on('click', function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'markerClick',
                    id: message.id,
                    title: message.title,
                    description: message.description,
                    lat: message.lat,
                    lng: message.lng
                  }));
                });
                
                markers[message.id] = marker;
                break;
                
              case 'removeMarker':
                if (markers[message.id]) {
                  map.removeLayer(markers[message.id]);
                  delete markers[message.id];
                }
                break;
                
              case 'clearMarkers':
                for (var id in markers) {
                  map.removeLayer(markers[id]);
                }
                markers = {};
                break;
                
              case 'setUserLocation':
                if (userMarker) {
                  map.removeLayer(userMarker);
                }
                userMarker = L.marker([message.lat, message.lng], { icon: userIcon })
                  .addTo(map)
                  .bindPopup('Your Location');
                break;
                
              case 'zoomIn':
                map.zoomIn();
                break;
                
              case 'zoomOut':
                map.zoomOut();
                break;
                
              case 'changeLayer':
                map.removeLayer(layers[currentLayer]);
                layers[message.layer].addTo(map);
                currentLayer = message.layer;
                break;
                
              case 'addRouteMarker':
                var icon = message.markerType === 'start' ? startIcon : endIcon;
                var marker = L.marker([message.lat, message.lng], { icon: icon })
                  .addTo(map)
                  .bindPopup('<b>' + (message.markerType === 'start' ? 'Start: ' : 'End: ') + message.title + '</b>');
                
                if (message.markerType === 'start') {
                  if (routeStartMarker) map.removeLayer(routeStartMarker);
                  routeStartMarker = marker;
                } else {
                  if (routeEndMarker) map.removeLayer(routeEndMarker);
                  routeEndMarker = marker;
                }
                break;
                
              case 'showRoute':
                if (routeLayer) {
                  map.removeLayer(routeLayer);
                }
                
                var coordinates = message.route.coordinates.map(function(coord) {
                  return [coord[1], coord[0]];
                });
                
                routeLayer = L.polyline(coordinates, {
                  color: '#007AFF',
                  weight: 5,
                  opacity: 0.8
                }).addTo(map);
                
                map.fitBounds(routeLayer.getBounds(), { padding: [20, 20] });
                break;
                
              case 'clearRoute':
                if (routeLayer) {
                  map.removeLayer(routeLayer);
                  routeLayer = null;
                }
                if (routeStartMarker) {
                  map.removeLayer(routeStartMarker);
                  routeStartMarker = null;
                }
                if (routeEndMarker) {
                  map.removeLayer(routeEndMarker);
                  routeEndMarker = null;
                }
                break;
            }
          } catch(error) {
            console.error('Error handling message:', error);
          }
        }

        // Send ready message
        setTimeout(function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
        }, 100);
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
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
              lat: localUserLocation.lat,
              lng: localUserLocation.lng
            }));
          }
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        mixedContentMode="compatibility"
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}

      <SafeAreaView style={styles.overlay} edges={['top']}>
        {/* Header with Search and Profile */}
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.searchBar}
            onPress={() => router.push('/search')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F8F9FA']}
              style={styles.searchGradient}
            >
              <Search size={20} color="#666" />
              <Text style={styles.searchPlaceholder}>Search places...</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
            testID="profile-button"
          >
            <LinearGradient
              colors={['#007AFF', '#0051D5']}
              style={styles.profileGradient}
            >
              <User size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Map Controls */}
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

        {/* Layer Selection Menu */}
        {showLayerMenu && (
          <View style={styles.layerMenu}>
            <TouchableOpacity 
              style={[styles.layerOption, mapLayer === 'street' && styles.layerOptionActive]}
              onPress={() => changeLayer('street')}
            >
              <Text style={[styles.layerText, mapLayer === 'street' && styles.layerTextActive]}>
                Street Map
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

        {/* Route Controls */}
        {isRoutingMode && (
          <View style={styles.routeControls}>
            <View style={styles.routeInfo}>
              <View style={styles.routeStep}>
                <View style={[styles.routeStepIcon, { backgroundColor: routeStart ? '#FF5252' : '#E0E0E0' }]}>
                  <MapPin size={16} color="white" />
                </View>
                <Text style={styles.routeStepText}>
                  {routeStart ? routeStart.title : 'Tap map for start'}
                </Text>
              </View>
              <View style={styles.routeStep}>
                <View style={[styles.routeStepIcon, { backgroundColor: routeEnd ? '#9C27B0' : '#E0E0E0' }]}>
                  <Flag size={16} color="white" />
                </View>
                <Text style={styles.routeStepText}>
                  {routeEnd ? routeEnd.title : 'Tap map for destination'}
                </Text>
              </View>
            </View>
            {currentRoute && (
              <View style={styles.routeStats}>
                <Text style={styles.routeDistance}>
                  {(currentRoute.distance / 1000).toFixed(1)} km
                </Text>
                <Text style={styles.routeDuration}>
                  {Math.round(currentRoute.duration / 60)} min
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          {!isRoutingMode ? (
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={startRoutingFromCurrentLocation}
              >
                <LinearGradient
                  colors={['#007AFF', '#0051D5']}
                  style={styles.actionGradient}
                >
                  <Route size={20} color="white" />
                  <Text style={styles.actionText}>Navigate from Here</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setRoutingMode(true)}
              >
                <LinearGradient
                  colors={['#34C759', '#28A745']}
                  style={styles.actionGradient}
                >
                  <MapPin size={20} color="white" />
                  <Text style={styles.actionText}>Custom Route</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  clearMarkers();
                  webViewRef.current?.postMessage(JSON.stringify({ type: 'clearMarkers' }));
                }}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF5252']}
                  style={styles.actionGradient}
                >
                  <X size={20} color="white" />
                  <Text style={styles.actionText}>Clear</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  clearRoute();
                  webViewRef.current?.postMessage(JSON.stringify({ type: 'clearRoute' }));
                }}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF5252']}
                  style={styles.actionGradient}
                >
                  <X size={20} color="white" />
                  <Text style={styles.actionText}>Cancel Route</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
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
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  routeDistance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  routeDuration: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});