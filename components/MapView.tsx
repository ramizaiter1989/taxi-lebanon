import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Layers, Plus, Minus, Navigation, Locate } from 'lucide-react-native';

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface MapViewProps {
  pickup?: Location;
  dropoff?: Location;
  driverLocation?: Location;
  showRoute?: boolean;
  followDriver?: boolean;
  isSelectionMode?: boolean;
  onLocationSelect?: (location: Location) => void;
  initialRegion?: { lat: number; lng: number; zoom?: number };
  testID?: string;
}

export default function MapView({
  pickup,
  dropoff,
  driverLocation,
  showRoute = false,
  followDriver = false,
  isSelectionMode = false,
  onLocationSelect,
  initialRegion,
  testID
}: MapViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite' | 'terrain'>('street');
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Update markers when props change
  useEffect(() => {
    if (pickup && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'addPickupMarker',
        lat: pickup.latitude,
        lng: pickup.longitude,
        title: 'Pickup',
        description: pickup.address
      }));
    }
  }, [pickup]);

  useEffect(() => {
    if (dropoff && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'addDropoffMarker',
        lat: dropoff.latitude,
        lng: dropoff.longitude,
        title: 'Dropoff',
        description: dropoff.address
      }));
    }
  }, [dropoff]);

  useEffect(() => {
    if (driverLocation && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'updateDriverLocation',
        lat: driverLocation.latitude,
        lng: driverLocation.longitude
      }));
      
      if (followDriver) {
        webViewRef.current.postMessage(JSON.stringify({
          type: 'setView',
          lat: driverLocation.latitude,
          lng: driverLocation.longitude,
          zoom: 15
        }));
      }
    }
  }, [driverLocation, followDriver]);

  // Calculate and show route
  useEffect(() => {
    if (showRoute && pickup && dropoff && webViewRef.current) {
      // Trigger route calculation
      webViewRef.current.postMessage(JSON.stringify({
        type: 'calculateRoute',
        start: { lat: pickup.latitude, lng: pickup.longitude },
        end: { lat: dropoff.latitude, lng: dropoff.longitude }
      }));
    }
  }, [showRoute, pickup, dropoff]);

  // Handle messages from WebView
  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'mapClick' && isSelectionMode && onLocationSelect) {
        onLocationSelect({
          latitude: data.lat,
          longitude: data.lng,
          address: `${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`
        });
      }
    } catch (error) {
      console.error('Error handling map message:', error);
    }
  };

  // Map controls
  const zoomIn = () => {
    webViewRef.current?.postMessage(JSON.stringify({ type: 'zoomIn' }));
  };

  const zoomOut = () => {
    webViewRef.current?.postMessage(JSON.stringify({ type: 'zoomOut' }));
  };

  const centerOnUser = () => {
    if (driverLocation) {
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'setView',
        lat: driverLocation.latitude,
        lng: driverLocation.longitude,
        zoom: 15
      }));
    }
  };

  const changeLayer = (layer: 'street' | 'satellite' | 'terrain') => {
    setMapLayer(layer);
    webViewRef.current?.postMessage(JSON.stringify({ 
      type: 'changeLayer', 
      layer 
    }));
    setShowLayerMenu(false);
  };

  // Initial map center
  const defaultCenter = initialRegion || { lat: 33.8938, lng: 35.5018, zoom: 13 }; // Beirut

  const mapHTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  body, html { margin:0; padding:0; }
  #map { height:100vh; width:100vw; }
  .pulse-marker {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #10b981;
    border: 3px solid white;
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
const map = L.map('map', { 
  zoomControl: false, 
  attributionControl: false 
}).setView([${defaultCenter.lat}, ${defaultCenter.lng}], ${defaultCenter.zoom || 13});

const layers = {
  street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19}),
  satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {maxZoom:19}),
  terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {maxZoom:17})
};
layers.street.addTo(map);
let currentLayer = 'street';

const pickupIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

const dropoffIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

const driverIcon = L.divIcon({
  html: '<div class="pulse-marker"></div>',
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

let pickupMarker, dropoffMarker, driverMarker, routeLine;

map.on('click', e => {
  window.ReactNativeWebView.postMessage(JSON.stringify({
    type: 'mapClick',
    lat: e.latlng.lat,
    lng: e.latlng.lng
  }));
});

async function calculateRoute(start, end) {
  try {
    const response = await fetch(
      \`https://router.project-osrm.org/route/v1/driving/\${start.lng},\${start.lat};\${end.lng},\${end.lat}?overview=full&geometries=geojson\`
    );
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      
      if (routeLine) map.removeLayer(routeLine);
      routeLine = L.polyline(coords, {
        color: '#6366f1',
        weight: 5,
        opacity: 0.8
      }).addTo(map);
      
      map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
    }
  } catch (err) {
    console.error('Route calculation failed:', err);
  }
}

function handleMessage(data) {
  try {
    const msg = JSON.parse(data);
    
    switch(msg.type) {
      case 'addPickupMarker':
        if (pickupMarker) map.removeLayer(pickupMarker);
        pickupMarker = L.marker([msg.lat, msg.lng], { icon: pickupIcon })
          .addTo(map)
          .bindPopup('<b>' + msg.title + '</b><br>' + msg.description);
        break;
        
      case 'addDropoffMarker':
        if (dropoffMarker) map.removeLayer(dropoffMarker);
        dropoffMarker = L.marker([msg.lat, msg.lng], { icon: dropoffIcon })
          .addTo(map)
          .bindPopup('<b>' + msg.title + '</b><br>' + msg.description);
        break;
        
      case 'updateDriverLocation':
        if (driverMarker) map.removeLayer(driverMarker);
        driverMarker = L.marker([msg.lat, msg.lng], { icon: driverIcon })
          .addTo(map);
        break;
        
      case 'calculateRoute':
        calculateRoute(msg.start, msg.end);
        break;
        
      case 'setView':
        map.setView([msg.lat, msg.lng], msg.zoom || map.getZoom());
        break;
        
      case 'zoomIn':
        map.zoomIn();
        break;
        
      case 'zoomOut':
        map.zoomOut();
        break;
        
      case 'changeLayer':
        map.removeLayer(layers[currentLayer]);
        layers[msg.layer].addTo(map);
        currentLayer = msg.layer;
        break;
        
      case 'clearRoute':
        if (routeLine) map.removeLayer(routeLine);
        if (pickupMarker) map.removeLayer(pickupMarker);
        if (dropoffMarker) map.removeLayer(dropoffMarker);
        if (driverMarker) map.removeLayer(driverMarker);
        break;
    }
  } catch (err) {
    console.error('Message handling error:', err);
  }
}

document.addEventListener('message', e => handleMessage(e.data));
window.addEventListener('message', e => handleMessage(e.data));
</script>
</body>
</html>`;

  return (
    <View style={styles.container} testID={testID}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHTML }}
        style={styles.map}
        onMessage={handleMapMessage}
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit
        mixedContentMode="compatibility"
      />
      
      {/* Map Controls */}
      <View style={styles.controls}>
        {/* Layer Selector */}
        <View style={styles.layerControl}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowLayerMenu(!showLayerMenu)}
          >
            <Layers size={20} color="#1f2937" />
          </TouchableOpacity>
          
          {showLayerMenu && (
            <View style={styles.layerMenu}>
              <TouchableOpacity
                style={[styles.layerOption, mapLayer === 'street' && styles.layerOptionActive]}
                onPress={() => changeLayer('street')}
              >
                <Text style={styles.layerText}>Street</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.layerOption, mapLayer === 'satellite' && styles.layerOptionActive]}
                onPress={() => changeLayer('satellite')}
              >
                <Text style={styles.layerText}>Satellite</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.layerOption, mapLayer === 'terrain' && styles.layerOptionActive]}
                onPress={() => changeLayer('terrain')}
              >
                <Text style={styles.layerText}>Terrain</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Zoom Controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.controlButton} onPress={zoomIn}>
            <Plus size={20} color="#1f2937" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={zoomOut}>
            <Minus size={20} color="#1f2937" />
          </TouchableOpacity>
        </View>
        
        {/* Center on User */}
        {driverLocation && (
          <TouchableOpacity 
            style={[styles.controlButton, styles.centerButton]} 
            onPress={centerOnUser}
          >
            <Locate size={20} color="#6366f1" />
          </TouchableOpacity>
        )}
      </View>
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
  controls: {
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
  layerControl: {
    position: 'relative',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  layerMenu: {
    position: 'absolute',
    top: 0,
    right: 52,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  layerOption: {
    padding: 12,
    paddingHorizontal: 20,
    minWidth: 100,
  },
  layerOptionActive: {
    backgroundColor: '#e5e7eb',
  },
  layerText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  zoomControls: {
    gap: 4,
  },
  centerButton: {
    backgroundColor: '#6366f1',
  },
});