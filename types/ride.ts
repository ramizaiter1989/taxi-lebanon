import { Driver } from './user';

export interface Ride {
  id: string;
  riderId: string;
  status: 'pending' | 'accepted' | 'on_way' | 'started' | 'completed' | 'cancelled';
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  dropoff: {
    lat: number;
    lng: number;
    address: string;
  };
  fare: number;
}

export interface RideContext {
  currentRide: Ride | null;
  availableDrivers: Driver[];
  estimatedArrival: number;
  updateRideStatus: () => void;
  cancelRide: () => void;
}
