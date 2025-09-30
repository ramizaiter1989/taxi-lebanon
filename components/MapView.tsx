import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import * as Location from 'expo-location';
import { Location as LocationType, MapRegion, RouteCoordinate } from '@/types/user';
import { BEIRUT_CENTER } from '@/constants/lebanon-locations';

// Conditional imports for native vs web
let MapView: any, Marker: any, Polyline: any, PROVIDER_GOOGLE: any;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Polyline = maps.Polyline;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
}

interface MapComponentProps {
  pickup?: LocationType;
  dropoff?: LocationType;
  driverLocation?: LocationType;
  onLocationSelect?: (location: LocationType) => void;
  showRoute?: boolean;
  followDriver?: boolean;
  isSelectionMode?: boolean;
  testID?: string;
}

export default function MapComponent({
  pickup,
  dropoff,
  driverLocation,
  onLocationSelect,
  showRoute = false,
  followDriver = false,
  isSelectionMode = false,
  testID
}: MapComponentProps) {
  const mapRef = useRef<any>(null);
  const [region, setRegion] = useState<MapRegion>({
    latitude: BEIRUT_CENTER.latitude,
    longitude: BEIRUT_CENTER.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
  const [userLocation, setUserLocation] = useState<LocationType | null>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (followDriver && driverLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [driverLocation, followDriver]);

  useEffect(() => {
    if (showRoute && pickup && dropoff) {
      generateRoute(pickup, dropoff);
    }
  }, [pickup, dropoff, showRoute]);

  const getCurrentLocation = async () => {
    try {
      if (Platform.OS === 'web') {
        // Use web geolocation API
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const currentLocation: LocationType = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                address: 'Current Location'
              };
              
              setUserLocation(currentLocation);
              setRegion({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              });
            },
            (error) => {
              console.log('Web geolocation error:', error);
            }
          );
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const currentLocation: LocationType = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: 'Current Location'
        };
        
        setUserLocation(currentLocation);
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (error) {
      console.log('Error getting location:', error);
    }
  };

  const generateRoute = (start: LocationType, end: LocationType) => {
    const coordinates: RouteCoordinate[] = [
      { latitude: start.latitude, longitude: start.longitude },
      { latitude: end.latitude, longitude: end.longitude }
    ];
    setRouteCoordinates(coordinates);
  };

  const handleMapPress = async (event: any) => {
    if (!isSelectionMode || !onLocationSelect) return;

    const coordinate = event.nativeEvent.coordinate;
    try {
      if (Platform.OS !== 'web') {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
        });

        const address = reverseGeocode[0] ? 
          `${reverseGeocode[0].street || ''} ${reverseGeocode[0].city || ''}, ${reverseGeocode[0].country || 'Lebanon'}`.trim() :
          'Selected Location';

        const location: LocationType = {
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          address
        };

        onLocationSelect(location);
      } else {
        const location: LocationType = {
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          address: 'Selected Location'
        };
        onLocationSelect(location);
      }
    } catch (error) {
      console.log('Error reverse geocoding:', error);
      const location: LocationType = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: 'Selected Location'
      };
      onLocationSelect(location);
    }
  };

  const fitToCoordinates = useCallback(() => {
    if (!mapRef.current) return;

    const coordinates = [];
    if (pickup) coordinates.push(pickup);
    if (dropoff) coordinates.push(dropoff);
    if (driverLocation) coordinates.push(driverLocation);
    if (userLocation) coordinates.push(userLocation);

    if (coordinates.length > 0) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [pickup, dropoff, driverLocation, userLocation]);

  useEffect(() => {
    if (pickup || dropoff || driverLocation) {
      const timeout = setTimeout(fitToCoordinates, 500);
      return () => clearTimeout(timeout);
    }
  }, [pickup, dropoff, driverLocation, fitToCoordinates]);

  // Web fallback component
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, styles.webMapContainer]} testID={testID}>
        <View style={styles.webMapPlaceholder}>
          <Text style={styles.webMapText}>🗺️ Interactive Map</Text>
          <Text style={styles.webMapSubtext}>Lebanon Coverage</Text>
          
          {pickup && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>📍 Pickup: {pickup.address}</Text>
            </View>
          )}
          
          {dropoff && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>🎯 Dropoff: {dropoff.address}</Text>
            </View>
          )}
          
          {driverLocation && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>🚗 Driver: {driverLocation.address}</Text>
            </View>
          )}
          
          {userLocation && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>📱 You: {userLocation.address}</Text>
            </View>
          )}
          
          {isSelectionMode && (
            <Text style={styles.webMapInstructions}>
              Tap to select location (Web preview mode)
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Native map component
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={true}
        testID={testID}
      >
        {pickup && (
          <Marker
            coordinate={pickup}
            title="Pickup Location"
            description={pickup.address}
            pinColor="green"
          />
        )}
        
        {dropoff && (
          <Marker
            coordinate={dropoff}
            title="Dropoff Location"
            description={dropoff.address}
            pinColor="red"
          />
        )}
        
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Driver Location"
            description="Your driver is here"
            pinColor="blue"
          />
        )}
        
        {showRoute && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#6366f1"
            strokeWidth={4}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapView>
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
  webMapContainer: {
    backgroundColor: '#f0f9ff',
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    margin: 10,
    borderWidth: 2,
    borderColor: '#0ea5e9',
    borderStyle: 'dashed',
  },
  webMapText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  webMapSubtext: {
    fontSize: 16,
    color: '#0369a1',
    marginBottom: 20,
  },
  locationInfo: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationLabel: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  webMapInstructions: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 16,
    textAlign: 'center',
  },
});