// utils/getORSRoute.ts

export interface ORSRoute {
  id: string;
  start: { lat: number; lng: number; title: string };
  end: { lat: number; lng: number; title: string };
  coordinates: [number, number][]; // [lng, lat] format for GeoJSON
  distance: number; // meters
  duration: number; // seconds
}

export interface ORSResponse {
  routes: Array<{
    summary: {
      distance: number;
      duration: number;
    };
    geometry: {
      coordinates: [number, number][];
    };
    segments: Array<{
      distance: number;
      duration: number;
      steps: Array<{
        distance: number;
        duration: number;
        instruction: string;
      }>;
    }>;
  }>;
}

/**
 * Get route from OpenRouteService API
 * @param start [longitude, latitude] of start point
 * @param end [longitude, latitude] of end point
 * @param apiKey ORS API key
 * @returns Route data with coordinates, distance, and duration
 */
export async function getORSRoute(
  start: [number, number],
  end: [number, number],
  apiKey: string
): Promise<ORSRoute> {
  try {
    const response = await fetch(
      'https://api.openrouteservice.org/v2/directions/driving-car',
      {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        },
        body: JSON.stringify({
          coordinates: [start, end],
          preference: 'fastest',
          units: 'km',
          language: 'en',
          geometry: true,
          instructions: true,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `ORS API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
      );
    }

    const data: ORSResponse = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found');
    }

    const route = data.routes[0];

    return {
      id: Date.now().toString(),
      start: {
        lat: start[1],
        lng: start[0],
        title: 'Start',
      },
      end: {
        lat: end[1],
        lng: end[0],
        title: 'End',
      },
      coordinates: route.geometry.coordinates,
      distance: route.summary.distance * 1000, // Convert km to meters
      duration: route.summary.duration,
    };
  } catch (error) {
    console.error('Error fetching ORS route:', error);
    throw error;
  }
}

/**
 * Calculate route using OSRM (free alternative, no API key needed)
 * Better for development/testing
 */
export async function getOSRMRoute(
  start: [number, number],
  end: [number, number]
): Promise<ORSRoute> {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`
    );

    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found');
    }

    const route = data.routes[0];

    return {
      id: Date.now().toString(),
      start: {
        lat: start[1],
        lng: start[0],
        title: 'Start',
      },
      end: {
        lat: end[1],
        lng: end[0],
        title: 'End',
      },
      coordinates: route.geometry.coordinates,
      distance: route.distance,
      duration: route.duration,
    };
  } catch (error) {
    console.error('Error fetching OSRM route:', error);
    throw error;
  }
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Calculate estimated fare based on distance
 * Customize this formula for your region
 */
export function calculateFare(distanceMeters: number, baseFare: number = 3000, perKmRate: number = 1500): number {
  const distanceKm = distanceMeters / 1000;
  return Math.round(baseFare + (distanceKm * perKmRate));
}