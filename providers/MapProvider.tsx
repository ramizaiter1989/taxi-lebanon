import { useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { API_BASE_URL } from '@/constants/config';
import { authCache } from '@/utils/authCache';

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

export type VehicleType = 'economy' | 'comfort' | 'premium' | 'xl';

export interface VehicleOption {
  id: VehicleType;
  name: string;
  description: string;
  capacity: number;
  multiplier: number;
  icon: string;
}

export type PaymentMethod = 'cash' | 'card' | 'wallet';

export interface SavedLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'home' | 'work' | 'custom';
}

interface RideBooking {
  pickup: Marker;
  destination: Marker;
  route: Route;
  baseFare: number;
  finalFare: number;
  vehicleType: VehicleType;
  paymentMethod: PaymentMethod;
  promoCode?: string;
  discount?: number;
}

export interface DestinationDetails {
  title: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface PickupDetails {
  title: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface MapContextType {
  markers: Marker[];
  selectedPlace: Marker | null;
  currentRoute: Route | null;
  isRoutingMode: boolean;
  routeStart: Marker | null;
  routeEnd: Marker | null;
  userLocation: { lat: number; lng: number } | null;
  rideBooking: RideBooking | null;
  isBookingMode: boolean;
  selectedVehicleType: VehicleType;
  selectedPaymentMethod: PaymentMethod;
  savedLocations: SavedLocation[];
  promoCode: string;
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
  startRideBooking: () => Promise<void>;
  confirmRideBooking: () => void;
  cancelRideBooking: () => void;
  setVehicleType: (type: VehicleType) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  applyPromoCode: (code: string) => void;
  addSavedLocation: (location: SavedLocation) => void;
  removeSavedLocation: (id: string) => void;
  selectSavedLocation: (location: SavedLocation, type: 'pickup' | 'destination') => void;
  getReadableDestination: () => string | null;
  getDestinationDetails: () => DestinationDetails | null;
  getReadablePickup: () => string | null;
  getPickupDetails: () => PickupDetails | null;
  hasDestination: () => boolean;
  hasPickup: () => boolean;
}

export const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    id: 'economy',
    name: 'Economy',
    description: 'Affordable rides',
    capacity: 4,
    multiplier: 1.0,
    icon: '🚗'
  },
  {
    id: 'comfort',
    name: 'Comfort',
    description: 'More spacious',
    capacity: 4,
    multiplier: 1.3,
    icon: '🚙'
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Luxury vehicles',
    capacity: 4,
    multiplier: 1.8,
    icon: '🚘'
  },
  {
    id: 'xl',
    name: 'XL',
    description: 'Extra space for 6',
    capacity: 6,
    multiplier: 1.5,
    icon: '🚐'
  }
];

const PROMO_CODES: Record<string, number> = {
  'FIRST10': 0.10,
  'SAVE20': 0.20,
  'WELCOME': 0.15,
};

export const [MapProvider, useMap] = createContextHook<MapContextType>(() => {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Marker | null>(null);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [routeStart, setRouteStart] = useState<Marker | null>(null);
  const [routeEnd, setRouteEnd] = useState<Marker | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [rideBooking, setRideBooking] = useState<RideBooking | null>(null);
  const [isBookingMode, setIsBookingMode] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>('economy');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [promoCode, setPromoCode] = useState('');

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
  
// Optimized startRideBooking in MapProvider.tsx


const startRideBooking = useCallback(async () => {
  try {
    // 1. Enable booking mode IMMEDIATELY - don't wait for anything
    setIsBookingMode(true);
    setIsRoutingMode(true);

    // 2. Get location in background - use cached/last known if available
    const getLocationQuickly = async () => {
      try {
        // Try to get last known location first (instant)
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          return lastKnown;
        }
        
        // Fall back to current location with timeout
        return await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Location timeout')), 5000)
          )
        ]);
      } catch (error) {
        console.warn('Location error:', error);
        return null;
      }
    };

    // 3. Get location without blocking UI
    getLocationQuickly().then(async (location) => {
      if (!location) return;

      const { latitude, longitude } = location.coords;
      const lat = parseFloat(latitude.toFixed(6));
      const lng = parseFloat(longitude.toFixed(6));

      // Update user location
      setUserLocation({ lat, lng });

      // Create placeholder marker immediately
      const placeholderMarker: Marker = {
        id: 'pickup-location',
        lat,
        lng,
        title: 'Current Location',
        description: 'Getting address...',
      };
      setRouteStart(placeholderMarker);

      // Update with actual address in background (non-blocking)
      Location.reverseGeocodeAsync({ latitude, longitude })
        .then(([address]) => {
          if (!address) return;
          
          const parts = [
            address.street,
            address.city,
            address.region
          ].filter(Boolean);
          
          const readableAddress = parts.length > 0 
            ? parts.join(', ') 
            : 'Current Location';

          // Update marker with real address
          setRouteStart({
            id: 'pickup-location',
            lat,
            lng,
            title: readableAddress,
            description: readableAddress,
          });
        })
        .catch(err => console.warn('Reverse geocoding failed:', err));
    });

  } catch (error) {
    console.error('Error starting ride booking:', error);
    // Still enable booking mode even if location fails
    setIsBookingMode(true);
    setIsRoutingMode(true);
  }
}, []);



  const calculateBaseFare = useCallback((distance: number, duration: number): number => {
    const baseFare = 5000;
    const perKm = (distance / 1000) * 2000;
    const perMinute = (duration / 60) * 500;
    return Math.round(baseFare + perKm + perMinute);
  }, []);

  const calculateFinalFare = useCallback((baseFare: number, vehicleType: VehicleType, promoCode: string): { finalFare: number; discount: number } => {
    const vehicle = VEHICLE_OPTIONS.find(v => v.id === vehicleType);
    const multiplier = vehicle?.multiplier || 1.0;
    const fareWithVehicle = Math.round(baseFare * multiplier);
    
    const discountPercent = PROMO_CODES[promoCode.toUpperCase()] || 0;
    const discount = Math.round(fareWithVehicle * discountPercent);
    const finalFare = fareWithVehicle - discount;
    
    return { finalFare, discount };
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

        if (isBookingMode) {
          const baseFare = calculateBaseFare(route.distance, route.duration);
          const { finalFare, discount } = calculateFinalFare(baseFare, selectedVehicleType, promoCode);
          
          setRideBooking({
            pickup: routeStart,
            destination: routeEnd,
            route: newRoute,
            baseFare,
            finalFare,
            vehicleType: selectedVehicleType,
            paymentMethod: selectedPaymentMethod,
            promoCode: promoCode || undefined,
            discount: discount || undefined,
          });
        }
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  }, [routeStart, routeEnd, isBookingMode, selectedVehicleType, selectedPaymentMethod, promoCode, calculateBaseFare, calculateFinalFare]);

  const setVehicleType = useCallback((type: VehicleType) => {
    setSelectedVehicleType(type);
    if (rideBooking) {
      const { finalFare, discount } = calculateFinalFare(rideBooking.baseFare, type, promoCode);
      setRideBooking({
        ...rideBooking,
        vehicleType: type,
        finalFare,
        discount,
      });
    }
  }, [rideBooking, promoCode, calculateFinalFare]);

  const setPaymentMethod = useCallback((method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    if (rideBooking) {
      setRideBooking({
        ...rideBooking,
        paymentMethod: method,
      });
    }
  }, [rideBooking]);

  const applyPromoCode = useCallback((code: string) => {
    setPromoCode(code);
    if (rideBooking) {
      const { finalFare, discount } = calculateFinalFare(rideBooking.baseFare, selectedVehicleType, code);
      setRideBooking({
        ...rideBooking,
        promoCode: code || undefined,
        finalFare,
        discount,
      });
    }
  }, [rideBooking, selectedVehicleType, calculateFinalFare]);

  const confirmRideBooking = useCallback(async () => {
    if (!rideBooking) return;

    if (authCache.isGuestUser()) {
      Alert.alert(
        'Sign Up Required',
        'Create an account to book rides. You can keep browsing the map as a guest.',
        [
          { text: 'Continue Browsing', style: 'cancel' },
          { text: 'Sign Up', onPress: () => router.push('/register') },
        ]
      );
      return;
    }

    if (authCache.isMockUser()) {
      Alert.alert('Demo Mode', 'Ride booking is not connected to the server in demo mode.');
      return;
    }

    try {
      const token = authCache.getToken();
      if (!token) {
        console.log('No auth token found');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/rides`,
        {
          origin_lat: rideBooking.pickup.lat,
          origin_lng: rideBooking.pickup.lng,
          destination_lat: rideBooking.destination?.lat,
          destination_lng: rideBooking.destination?.lng,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('Ride created:', response.data);
      setRideBooking(prev => prev ? { ...prev, id: response.data.id } : prev);

    } catch (error: any) {
      console.error('Failed to create ride:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.error || 'Failed to create ride');
    }
  }, [rideBooking]);

  const cancelRideBooking = useCallback(() => {
    setRideBooking(null);
    setIsBookingMode(false);
    setCurrentRoute(null);
    setRouteStart(null);
    setRouteEnd(null);
    setIsRoutingMode(false);
    setPromoCode('');
  }, []);

  const clearRoute = useCallback(() => {
    setCurrentRoute(null);
    setRouteStart(null);
    setRouteEnd(null);
    setIsRoutingMode(false);
    setRideBooking(null);
    setIsBookingMode(false);
    setPromoCode('');
  }, []);

  const addSavedLocation = useCallback((location: SavedLocation) => {
    setSavedLocations(prev => {
      const existing = prev.findIndex(l => l.id === location.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = location;
        return updated;
      }
      return [...prev, location];
    });
  }, []);

  const removeSavedLocation = useCallback((id: string) => {
    setSavedLocations(prev => prev.filter(l => l.id !== id));
  }, []);

  const selectSavedLocation = useCallback((location: SavedLocation, type: 'pickup' | 'destination') => {
    const marker: Marker = {
      id: location.id,
      lat: location.lat,
      lng: location.lng,
      title: location.name,
      description: location.address,
    };
    
    if (type === 'pickup') {
      setRouteStart(marker);
    } else {
      setRouteEnd(marker);
    }
  }, []);

  // ✅ NEW HELPER FUNCTIONS FOR READABLE DESTINATION
  const getReadableDestination = useCallback((): string | null => {
    if (rideBooking?.destination) {
      return rideBooking.destination.title;
    }
    if (routeEnd) {
      return routeEnd.title;
    }
    return null;
  }, [rideBooking, routeEnd]);

  const getDestinationDetails = useCallback((): DestinationDetails | null => {
    const destination = rideBooking?.destination || routeEnd;
    if (!destination) return null;
    
    return {
      title: destination.title,
      address: destination.description,
      coordinates: {
        lat: destination.lat,
        lng: destination.lng
      }
    };
  }, [rideBooking, routeEnd]);

  // ✅ NEW HELPER FUNCTIONS FOR READABLE PICKUP
  const getReadablePickup = useCallback((): string | null => {
    if (rideBooking?.pickup) {
      return rideBooking.pickup.title;
    }
    if (routeStart) {
      return routeStart.title;
    }
    return null;
  }, [rideBooking, routeStart]);

  const getPickupDetails = useCallback((): PickupDetails | null => {
    const pickup = rideBooking?.pickup || routeStart;
    if (!pickup) return null;
    
    return {
      title: pickup.title,
      address: pickup.description,
      coordinates: {
        lat: pickup.lat,
        lng: pickup.lng
      }
    };
  }, [rideBooking, routeStart]);

  // ✅ HELPER FUNCTIONS TO CHECK IF LOCATIONS ARE SET
  const hasDestination = useCallback((): boolean => {
    return !!(rideBooking?.destination || routeEnd);
  }, [rideBooking, routeEnd]);

  const hasPickup = useCallback((): boolean => {
    return !!(rideBooking?.pickup || routeStart);
  }, [rideBooking, routeStart]);

  return useMemo(() => ({
    markers,
    selectedPlace,
    currentRoute,
    isRoutingMode,
    routeStart,
    routeEnd,
    userLocation,
    rideBooking,
    isBookingMode,
    selectedVehicleType,
    selectedPaymentMethod,
    savedLocations,
    promoCode,
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
    startRideBooking,
    confirmRideBooking,
    cancelRideBooking,
    setVehicleType,
    setPaymentMethod,
    applyPromoCode,
    addSavedLocation,
    removeSavedLocation,
    selectSavedLocation,
    getReadableDestination,
    getDestinationDetails,
    getReadablePickup,
    getPickupDetails,
    hasDestination,
    hasPickup,
  }), [
    markers, selectedPlace, currentRoute, isRoutingMode, routeStart, routeEnd, 
    userLocation, rideBooking, isBookingMode, selectedVehicleType, selectedPaymentMethod,
    savedLocations, promoCode, addMarker, removeMarker, clearMarkers, setRoutingMode,
    calculateRoute, clearRoute, startRoutingFromCurrentLocation, startRideBooking,
    confirmRideBooking, cancelRideBooking, setVehicleType, setPaymentMethod, applyPromoCode,
    addSavedLocation, removeSavedLocation, selectSavedLocation, getReadableDestination,
    getDestinationDetails, getReadablePickup, getPickupDetails, hasDestination, hasPickup
  ]);
});