export interface RideResponse {
  id: string;
  passenger_id: string;
  driver_id?: string;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address: string;
  destination_lat: number;
  destination_lng: number;
  destination_address: string;
  vehicle_type: string;
  payment_method: string;
  status: 'pending' | 'accepted' | 'arriving' | 'in_progress' | 'completed' | 'cancelled';
  fare: number;
  discount?: number;
  total_fare: number;
  promo_code?: string;
  created_at: string;
  updated_at: string;
}

export interface DriverResponse {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicle_type: string;
  vehicle_model: string;
  vehicle_plate: string;
  rating: number;
  total_rides: number;
  is_online: boolean;
  current_location?: {
    lat: number;
    lng: number;
  };
  distance?: number; // Distance from passenger in meters
}

export interface FareEstimate {
  base_fare: number;
  distance_fare: number;
  time_fare: number;
  total_fare: number;
  discount?: number;
  final_fare: number;
  distance: number; // in meters
  duration: number; // in seconds
}

export interface DirectionsResponse {
  type: string;
  features: Array<{
    type: string;
    geometry: {
      coordinates: [number, number][];
      type: string;
    };
    properties: {
      segments: Array<{
        distance: number;
        duration: number;
        steps: any[];
      }>;
      summary: {
        distance: number;
        duration: number;
      };
    };
  }>;
}