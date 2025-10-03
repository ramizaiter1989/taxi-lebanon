import { useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import * as Location from 'expo-location';

interface Marker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
}

interface Route {
  id: string;
  start: { lat: number; lng: number; title: string };
  end: { lat: number; lng: number; title: string };
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

interface MapContextType {
  markers: Marker[];
  selectedPlace: Marker | null;
  currentRoute: Route | null;
  isRoutingMode: boolean;
  routeStart: Marker | null;
  routeEnd: Marker | null;
  userLocation: { lat: number; lng: number } | null;
  addMarker: (marker: Marker) => void;
  removeMarker: (id: string) => void;
  clearMarkers: () => void;
  setSelectedPlace: (place: Marker | null) => void;
  setRoutingMode: (enabled: boolean) => void;
  setRouteStart: (marker: Marker | null) => void;
  setRouteEnd: (marker: Marker | null) => void;
  calculateRoute: () => Promise<void>;
  clearRoute: () => void;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
  startRoutingFromCurrentLocation: () => Promise<void>;
}

export const [MapProvider, useMap] = createContextHook<MapContextType>(() => {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Marker | null>(null);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [routeStart, setRouteStart] = useState<Marker | null>(null);
  const [routeEnd, setRouteEnd] = useState<Marker | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const addMarker = useCallback((marker: Marker) => {
    setMarkers(prev => {
      const existing = prev.findIndex(m => m.id === marker.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = marker;
        return updated;
      }
      return [...prev, marker];
    });
  }, []);

  const removeMarker = useCallback((id: string) => {
    setMarkers(prev => prev.filter(m => m.id !== id));
  }, []);

  const clearMarkers = useCallback(() => {
    setMarkers([]);
    setSelectedPlace(null);
  }, []);

  const setRoutingMode = useCallback((enabled: boolean) => {
    setIsRoutingMode(enabled);
    if (!enabled) {
      setRouteStart(null);
      setRouteEnd(null);
      setCurrentRoute(null);
    }
  }, []);

  const startRoutingFromCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const currentLocationMarker: Marker = {
        id: 'current-location',
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        title: 'Current Location',
        description: 'Your current location'
      };
      
      setUserLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });
      
      setRouteStart(currentLocationMarker);
      setIsRoutingMode(true);
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  }, []);

  const calculateRoute = useCallback(async () => {
    if (!routeStart || !routeEnd) return;

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${routeStart.lng},${routeStart.lat};${routeEnd.lng},${routeEnd.lat}?overview=full&geometries=geojson`
      );
      
      if (!response.ok) throw new Error('Route calculation failed');
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const newRoute: Route = {
          id: Date.now().toString(),
          start: { lat: routeStart.lat, lng: routeStart.lng, title: routeStart.title },
          end: { lat: routeEnd.lat, lng: routeEnd.lng, title: routeEnd.title },
          coordinates: route.geometry.coordinates,
          distance: route.distance,
          duration: route.duration,
        };
        setCurrentRoute(newRoute);
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  }, [routeStart, routeEnd]);

  const clearRoute = useCallback(() => {
    setCurrentRoute(null);
    setRouteStart(null);
    setRouteEnd(null);
    setIsRoutingMode(false);
  }, []);

  return useMemo(() => ({
    markers,
    selectedPlace,
    currentRoute,
    isRoutingMode,
    routeStart,
    routeEnd,
    userLocation,
    addMarker,
    removeMarker,
    clearMarkers,
    setSelectedPlace,
    setRoutingMode,
    setRouteStart,
    setRouteEnd,
    calculateRoute,
    clearRoute,
    setUserLocation,
    startRoutingFromCurrentLocation,
  }), [markers, selectedPlace, currentRoute, isRoutingMode, routeStart, routeEnd, userLocation, addMarker, removeMarker, clearMarkers, setSelectedPlace, setRoutingMode, setRouteStart, setRouteEnd, calculateRoute, clearRoute, setUserLocation, startRoutingFromCurrentLocation]);
});