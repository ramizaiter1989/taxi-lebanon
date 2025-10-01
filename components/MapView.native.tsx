import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import MapViewNative, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Location as LocationType, MapRegion, RouteCoordinate } from '@/types/user';
import { BEIRUT_CENTER } from '@/constants/lebanon-locations';

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

  return (
    <View style={styles.container}>
      <MapViewNative
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
      </MapViewNative>
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
});