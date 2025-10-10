export type UserRole = 'client' | 'rider';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isVerified: boolean;
  profileImage?: string;
  rating: number;
  totalRides: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface Ride {
  id: string;
  clientId: string;
  riderId?: string;
  pickup: Location;
  dropoff: Location;
  status: 'pending' | 'accepted' | 'in_progress' | 'started' | 'completed' | 'cancelled';
  fare: number;
  estimatedDuration: number;
  createdAt: Date;
  completedAt?: Date;
  clientRating?: number;
  riderRating?: number;
  date?: string;
  driverName?: string;
  rating?: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface Driver {
  id: string;
  name: string;
  rating: number;
  location: Location;
  isOnline: boolean;
  vehicleInfo: {
    make: string;
    model: string;
    color: string;
    plateNumber: string;
  };
}