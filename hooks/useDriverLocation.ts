// hooks/useDriverLocation.ts
import { useEffect, useState, useRef } from 'react';
import { initializeEcho, disconnectEcho } from '@/utils/echo.config';
import type Echo from 'laravel-echo';

interface DriverLocation {
  driver_id: number;
  driver_name: string;
  current_driver_lat: number;
  current_driver_lng: number;
  timestamp: string;
}

export const useDriverLocation = (driverId?: number | null) => {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const echoRef = useRef<any | null>(null);

  useEffect(() => {
    // Don't connect if no driver is assigned
    if (!driverId) {
      console.log('⚠️ No driver assigned, skipping Echo connection');
      return;
    }

    console.log('🔌 Initializing Echo connection for driver:', driverId);
    
    // Initialize Echo
    echoRef.current = initializeEcho();
    
    // Listen to the drivers-location channel
    const channel = echoRef.current.channel('drivers-location');
    
    // Handle connection events
    channel.subscribed(() => {
      console.log('✅ Subscribed to drivers-location channel');
      setIsConnected(true);
    });
    
    // Listen for driver location updates
    channel.listen('.driver-location-updated', (data: DriverLocation) => {
      console.log('📍 Driver location received:', data);
      
      // Only update if it's our driver
      if (data.driver_id === driverId) {
        setDriverLocation(data);
        console.log(`✅ Updated location for driver ${data.driver_name}:`, {
          lat: data.current_driver_lat,
          lng: data.current_driver_lng,
        });
      }
    });

    // Handle errors
    channel.error((error: any) => {
      console.error('❌ Echo channel error:', error);
      setIsConnected(false);
    });

    // Cleanup on unmount or when driver changes
    return () => {
      console.log('🧹 Cleaning up Echo connection');
      if (echoRef.current) {
        echoRef.current.leaveChannel('drivers-location');
        disconnectEcho(echoRef.current);
        echoRef.current = null;
      }
      setIsConnected(false);
      setDriverLocation(null);
    };
  }, [driverId]);

  return {
    driverLocation,
    isConnected,
  };
};