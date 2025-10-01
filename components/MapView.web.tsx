import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Location as LocationType } from '@/types/user';
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
  isSelectionMode = false,
  testID
}: MapComponentProps) {
  const [userLocation, setUserLocation] = useState<LocationType | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation: LocationType = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: 'Current Location'
          };
          setUserLocation(currentLocation);
        },
        (error) => {
          console.log('Web geolocation error:', error);
        }
      );
    }
  }, []);

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

const styles = StyleSheet.create({
  container: {
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