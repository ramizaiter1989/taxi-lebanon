export const API_BASE_URL = "https://taxi-lebanon-backend.onrender.com/api";
export const ORS_API_KEY="eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjIxODBmOTIzMjI1NzQ0YTFiMjc4NmYxMmJkZmQzNzlkIiwiaCI6Im11cm11cjY0In0=:";
export const USE_OSRM = true;
export const geocodebaseUrl = 'https://api.openrouteservice.org/geocode/reverse';

export interface MockUser {
  email: string;
  password: string;
  id: string;
  name: string;
  role: 'passenger' | 'driver';
  phone: string;
}

/** Dev/demo accounts — local auth only, no backend call */
export const MOCK_USERS: MockUser[] = [
  {
    email: 'demo@she-moves.com',
    password: 'demo1234',
    id: 'mock_passenger_1',
    name: 'Demo Passenger',
    role: 'passenger',
    phone: '+96170123456',
  },
  {
    email: 'driver@she-moves.com',
    password: 'demo1234',
    id: 'mock_driver_1',
    name: 'Demo Driver',
    role: 'driver',
    phone: '+96170987654',
  },
];