import { useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface Marker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
}

export interface Route {
  id: string;
  start: { lat: number; lng: number; title: string };
  end: { lat: number; lng: number; title: string };
  coordinates: [number, number][]; // [lng, lat] format for GeoJSON
  distance: number; // meters
  duration: number; // seconds
}

export interface SearchResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address?: {
    road?: string;
    city?: string;
    country?: string;
  };
}

const MARKERS_KEY = 'saved_markers';
const RECENT_SEARCHES_KEY = 'recent_searches';

export const [MapProvider, useMap] = createContextHook(() => {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Marker | null>(null);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [routeStart, setRouteStart] = useState<Marker | null>(null);
  const [routeEnd, setRouteEnd] = useState<Marker | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load saved data
  const loadSavedData = useCallback(async () => {
    try {
      const [savedMarkers, savedSearches] = await Promise.all([
        AsyncStorage.getItem(MARKERS_KEY),
        AsyncStorage.getItem(RECENT_SEARCHES_KEY)
      ]);
      
      if (savedMarkers) setMarkers(JSON.parse(savedMarkers));
      if (savedSearches) setRecentSearches(JSON.parse(savedSearches));
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  // Save markers
  const saveMarkers = useCallback(async (newMarkers: Marker[]) => {
    try {
      await AsyncStorage.setItem(MARKERS_KEY, JSON.stringify(newMarkers));
    } catch (error) {
      console.error('Error saving markers:', error);
    }
  }, []);

  // Add marker
  const addMarker = useCallback((marker: Marker) => {
    setMarkers(prev => {
      const filtered = prev.filter(m => m.id !== marker.id);
      const updated = [...filtered, marker];
      saveMarkers(updated);
      return updated;
    });
  }, [saveMarkers]);

  // Remove marker
  const removeMarker = useCallback((id: string) => {
    setMarkers(prev => {
      const updated = prev.filter(m => m.id !== id);
      saveMarkers(updated);
      return updated;
    });
  }, [saveMarkers]);

  // Clear all markers
  const clearMarkers = useCallback(() => {
    setMarkers([]);
    saveMarkers([]);
  }, [saveMarkers]);

  // Search locations using Nominatim
  const searchLocation = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) return [];
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=10&` +
        `countrycodes=lb` // Focus on Lebanon for ride-sharing app
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const results: SearchResult[] = await response.json();
      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Save to recent searches
  const addToRecentSearches = useCallback(async (result: SearchResult) => {
    const updated = [
      result,
      ...recentSearches.filter(r => r.place_id !== result.place_id)
    ].slice(0, 10); // Keep only 10 recent
    
    setRecentSearches(updated);
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  }, [recentSearches]);

  // Calculate route using ORS
  const calculateRoute = useCallback(async (apiKey: string) => {
    if (!routeStart || !routeEnd) return;

    try {
      const response = await fetch(
        'https://api.openrouteservice.org/v2/directions/driving-car',
        {
          method: 'POST',
          headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            coordinates: [
              [routeStart.lng, routeStart.lat],
              [routeEnd.lng, routeEnd.lat]
            ],
            preference: 'fastest'
          })
        }
      );

      if (!response.ok) throw new Error('Route calculation failed');

      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const newRoute: Route = {
          id: Date.now().toString(),
          start: { 
            lat: routeStart.lat, 
            lng: routeStart.lng, 
            title: routeStart.title 
          },
          end: { 
            lat: routeEnd.lat, 
            lng: routeEnd.lng, 
            title: routeEnd.title 
          },
          coordinates: route.geometry.coordinates,
          distance: route.summary.distance,
          duration: route.summary.duration,
        };
        setCurrentRoute(newRoute);
        return newRoute;
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      throw error;
    }
  }, [routeStart, routeEnd]);

  // Clear route
  const clearRoute = useCallback(() => {
    setCurrentRoute(null);
    setRouteStart(null);
    setRouteEnd(null);
    setIsRoutingMode(false);
  }, []);

  // Start routing from current location
  const startRoutingFromCurrentLocation = useCallback(() => {
    if (!userLocation) return;
    
    setIsRoutingMode(true);
    setRouteStart({
      id: 'user_location',
      lat: userLocation.lat,
      lng: userLocation.lng,
      title: 'Current Location',
      description: 'Your current position'
    });
  }, [userLocation]);

  // Convert search result to marker
  const searchResultToMarker = useCallback((result: SearchResult): Marker => {
    return {
      id: result.place_id,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      title: result.address?.road || result.type || 'Location',
      description: result.display_name
    };
  }, []);

  return useMemo(() => ({
    markers,
    selectedPlace,
    currentRoute,
    isRoutingMode,
    routeStart,
    routeEnd,
    userLocation,
    recentSearches,
    isSearching,
    addMarker,
    removeMarker,
    clearMarkers,
    setSelectedPlace,
    setRoutingMode: setIsRoutingMode,
    setRouteStart,
    setRouteEnd,
    calculateRoute,
    clearRoute,
    setUserLocation,
    startRoutingFromCurrentLocation,
    searchLocation,
    addToRecentSearches,
    searchResultToMarker,
    loadSavedData
  }), [
    markers,
    selectedPlace,
    currentRoute,
    isRoutingMode,
    routeStart,
    routeEnd,
    userLocation,
    recentSearches,
    isSearching,
    addMarker,
    removeMarker,
    clearMarkers,
    calculateRoute,
    clearRoute,
    startRoutingFromCurrentLocation,
    searchLocation,
    addToRecentSearches,
    searchResultToMarker,
    loadSavedData
  ]);
});