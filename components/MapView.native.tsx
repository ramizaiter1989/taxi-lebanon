import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { useMap } from '@/providers/MapProvider';
import { useUser } from '@/providers/UserProvider';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Navigation, Layers, Plus, Minus, MapPin, Flag, X, Route, User, Search } from 'lucide-react-native';

interface MapComponentWebViewProps {
  pickup?: { latitude: number; longitude: number; address: string };
  dropoff?: { latitude: number; longitude: number; address: string };
  driverLocation?: { latitude: number; longitude: number };
  onLocationSelect?: (location: { latitude: number; longitude: number; address: string }) => void;
  isSelectionMode?: boolean;
  showRoute?: boolean;
}

export default function MapComponentWebView({
  pickup,
  dropoff,
  driverLocation,
  onLocationSelect,
  isSelectionMode = false,
  showRoute = false
}: MapComponentWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite' | 'terrain'>('street');
  const { userData, isLoading: userLoading } = useUser();
  const {
    markers,
    addMarker,
    clearMarkers,
    selectedPlace,
    routeStart,
    routeEnd,
    isRoutingMode,
    setRoutingMode,
    setRouteStart,
    setRouteEnd,
    currentRoute,
    calculateRoute,
    clearRoute,
    setUserLocation,
    startRoutingFromCurrentLocation
  } = useMap();

  // Redirect if not logged in
  useEffect(() => {
    if (!userLoading && !userData) {
      router.replace('/login');
    }
  }, [userData, userLoading]);

  // Get current location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({ lat: location.coords.latitude, lng: location.coords.longitude });

      webViewRef.current?.postMessage(JSON.stringify({
        type: 'setView',
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        zoom: 15
      }));
    })();
  }, [setUserLocation]);

  // Add pickup, dropoff, driver markers
  useEffect(() => {
    if (pickup) addMarker({ id: 'pickup', lat: pickup.latitude, lng: pickup.longitude, title: 'Pickup', description: pickup.address });
    if (dropoff) addMarker({ id: 'dropoff', lat: dropoff.latitude, lng: dropoff.longitude, title: 'Dropoff', description: dropoff.address });
    if (driverLocation) addMarker({ id: 'driver', lat: driverLocation.latitude, lng: driverLocation.longitude, title: 'Driver', description: 'Driver location' });
  }, [pickup, dropoff, driverLocation, addMarker]);

  // Send markers to WebView
  useEffect(() => {
    markers.forEach(marker => {
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'addMarker',
        ...marker
      }));
    });
  }, [markers]);

  // Route calculation and display
  useEffect(() => {
    if (routeStart && routeEnd) {
      calculateRoute().then(() => {
        if (currentRoute) {
          webViewRef.current?.postMessage(JSON.stringify({
            type: 'showRoute',
            route: currentRoute
          }));
        }
      });
    }
  }, [routeStart, routeEnd, calculateRoute, currentRoute]);

  // Handle map clicks from WebView
  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapClick') {
        const location = { latitude: data.lat, longitude: data.lng, address: 'Selected Location' };
        if (isSelectionMode && onLocationSelect) {
          onLocationSelect(location);
        } else if (isRoutingMode) {
          if (!routeStart) setRouteStart({ id: 'start', lat: data.lat, lng: data.lng, title: 'Start', description: 'Route start' });
          else if (!routeEnd) setRouteEnd({ id: 'end', lat: data.lat, lng: data.lng, title: 'End', description: 'Route end' });
        } else {
          addMarker({ id: String(Date.now()), lat: data.lat, lng: data.lng, title: 'Custom', description: location.address });
        }
      }
    } catch (error) {
      console.error('Error handling map message:', error);
    }
  };

  const zoomIn = () => webViewRef.current?.postMessage(JSON.stringify({ type: 'zoomIn' }));
  const zoomOut = () => webViewRef.current?.postMessage(JSON.stringify({ type: 'zoomOut' }));
  const centerOnUser = () => {
    if (!userData) return;
    webViewRef.current?.postMessage(JSON.stringify({ type: 'setView', lat: userData?.lat, lng: userData?.lng, zoom: 15 }));
  };

  const changeLayer = (layer: 'street' | 'satellite' | 'terrain') => {
    setMapLayer(layer);
    webViewRef.current?.postMessage(JSON.stringify({ type: 'changeLayer', layer }));
  };

  const mapHTML = `<!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      body { margin:0; padding:0; }
      #map { height:100vh; width:100vw; }
      .leaflet-container { background:#f0f0f0; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      var map = L.map('map', { zoomControl:false, attributionControl:false }).setView([33.8938, 35.5018], 13);
      var layers = {
        street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }),
        satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }),
        terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17 })
      };
      layers.street.addTo(map);
      var currentLayer='street';
      var markers={}; var routeLayer=null;

      map.on('click', e => { window.ReactNativeWebView.postMessage(JSON.stringify({ type:'mapClick', lat:e.latlng.lat, lng:e.latlng.lng })) });

      document.addEventListener('message', e => handleMessage(e.data));
      window.addEventListener('message', e => handleMessage(e.data));

      function handleMessage(data){
        try{
          var msg=JSON.parse(data);
          switch(msg.type){
            case 'setView': map.setView([msg.lat,msg.lng],msg.zoom||map.getZoom()); break;
            case 'addMarker':
              if(markers[msg.id]) map.removeLayer(markers[msg.id]);
              var marker=L.marker([msg.lat,msg.lng]).addTo(map).bindPopup('<b>'+msg.title+'</b><br>'+msg.description);
              markers[msg.id]=marker;
              break;
            case 'clearMarkers':
              for(var id in markers) map.removeLayer(markers[id]); markers={}; break;
            case 'zoomIn': map.zoomIn(); break;
            case 'zoomOut': map.zoomOut(); break;
            case 'changeLayer': map.removeLayer(layers[currentLayer]); layers[msg.layer].addTo(map); currentLayer=msg.layer; break;
            case 'showRoute':
              if(routeLayer) map.removeLayer(routeLayer);
              var coords=msg.route.coordinates.map(c=>[c[0],c[1]]);
              routeLayer=L.polyline(coords,{color:'#007AFF',weight:5,opacity:0.8}).addTo(map);
              map.fitBounds(routeLayer.getBounds(),{padding:[20,20]});
              break;
            case 'clearRoute': if(routeLayer){map.removeLayer(routeLayer);routeLayer=null;} break;
          }
        } catch(e){console.error(e);}
      }

      setTimeout(()=>window.ReactNativeWebView.postMessage(JSON.stringify({type:'ready'})),100);
    </script>
  </body>
  </html>`;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHTML }}
        style={styles.map}
        onMessage={handleMapMessage}
        onLoadEnd={() => setIsLoading(false)}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        mixedContentMode="compatibility"
      />
      {isLoading && <ActivityIndicator style={StyleSheet.absoluteFill} size="large" />}
      {/* Zoom & Layer controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={zoomIn} style={styles.controlButton}><Plus size={24} color="white" /></TouchableOpacity>
        <TouchableOpacity onPress={zoomOut} style={styles.controlButton}><Minus size={24} color="white" /></TouchableOpacity>
        <TouchableOpacity onPress={() => changeLayer('street')} style={styles.controlButton}><MapPin size={24} color="white" /></TouchableOpacity>
        <TouchableOpacity onPress={() => changeLayer('satellite')} style={styles.controlButton}><Flag size={24} color="white" /></TouchableOpacity>
        <TouchableOpacity onPress={() => changeLayer('terrain')} style={styles.controlButton}><Route size={24} color="white" /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  controls: {
    position: 'absolute',
    right: 10,
    top: 50,
    flexDirection: 'column',
    gap: 10
  },
  controlButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 8
  }
});
