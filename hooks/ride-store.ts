import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { Ride, Location, Driver } from '@/types/user';
import { LEBANON_LOCATIONS } from '@/constants/lebanon-locations';
import { notificationService } from '@/services/NotificationService';

const MOCK_DRIVERS: Driver[] = [
  {
    id: '1',
    name: 'Fatima Khalil',
    rating: 4.9,
    location: LEBANON_LOCATIONS[0],
    isOnline: true,
    vehicleInfo: {
      make: 'Toyota',
      model: 'Corolla',
      color: 'White',
      plateNumber: '123456'
    }
  },
  {
    id: '2',
    name: 'Nour Mansour',
    rating: 4.7,
    location: LEBANON_LOCATIONS[1],
    isOnline: true,
    vehicleInfo: {
      make: 'Hyundai',
      model: 'Elantra',
      color: 'Silver',
      plateNumber: '789012'
    }
  }
];

export const [RideProvider, useRide] = createContextHook(() => {
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [rideHistory, setRideHistory] = useState<Ride[]>([]);
  const [isDriverOnline, setIsDriverOnline] = useState(false);
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<number>(0);

  useEffect(() => {
    notificationService.initialize();
  }, []);

  const requestRide = (pickup: Location, dropoff: Location) => {
    const ride: Ride = {
      id: Date.now().toString(),
      clientId: '1',
      pickup,
      dropoff,
      status: 'pending',
      fare: calculateFare(pickup, dropoff),
      estimatedDuration: 15,
      createdAt: new Date()
    };
    
    setCurrentRide(ride);
    console.log('Ride requested:', ride);
    
    // Simulate driver acceptance after 3 seconds
    setTimeout(() => {
      acceptRide(ride.id, MOCK_DRIVERS[0].id);
    }, 3000);
  };

  const acceptRide = (rideId: string, riderId: string) => {
    if (currentRide?.id === rideId) {
      const driver = MOCK_DRIVERS.find(d => d.id === riderId);
      const updatedRide = {
        ...currentRide,
        riderId,
        status: 'accepted' as const
      };
      setCurrentRide(updatedRide);
      setDriverLocation(driver?.location || null);
      setEstimatedArrival(15);
      
      // Send notification
      if (driver) {
        notificationService.notifyRideAccepted(driver.name, 15);
      }
      
      console.log('Ride accepted by driver:', driver?.name);
    }
  };

  const updateRideStatus = (status: Ride['status']) => {
    if (currentRide) {
      const updatedRide = { ...currentRide, status };
      setCurrentRide(updatedRide);
      
      // Send appropriate notifications
      switch (status) {
        case 'on_way':
          const driver = MOCK_DRIVERS.find(d => d.id === currentRide.riderId);
          if (driver) {
            notificationService.notifyDriverArriving(driver.name);
          }
          setEstimatedArrival(5);
          break;
        case 'started':
          notificationService.notifyTripStarted();
          break;
        case 'completed':
          notificationService.notifyTripCompleted(currentRide.fare);
          setRideHistory(prev => [...prev, { ...updatedRide, completedAt: new Date() }]);
          setCurrentRide(null);
          setDriverLocation(null);
          setEstimatedArrival(0);
          break;
        case 'cancelled':
          notificationService.notifyRideCancelled();
          setCurrentRide(null);
          setDriverLocation(null);
          setEstimatedArrival(0);
          break;
      }
      
      console.log('Ride status updated to:', status);
    }
  };

  const cancelRide = () => {
    if (currentRide) {
      updateRideStatus('cancelled');
    }
  };

  const calculateFare = (pickup: Location, dropoff: Location): number => {
    // Simple distance-based fare calculation
    const distance = Math.sqrt(
      Math.pow(dropoff.latitude - pickup.latitude, 2) +
      Math.pow(dropoff.longitude - pickup.longitude, 2)
    );
    return Math.max(5000, Math.round(distance * 100000)); // Minimum 5000 LBP
  };

  const toggleDriverOnline = () => {
    const newStatus = !isDriverOnline;
    setIsDriverOnline(newStatus);
    console.log('Driver status changed to:', newStatus ? 'online' : 'offline');
    
    if (newStatus) {
      // Simulate receiving ride requests when going online
      setTimeout(() => {
        notificationService.notifyNewRideRequest(
          'Hamra, Beirut',
          'Achrafieh, Beirut',
          8500
        );
      }, 5000);
    }
  };

  const updateDriverLocation = (location: Location) => {
    setDriverLocation(location);
    console.log('Driver location updated:', location.address);
  };

  const triggerSOSAlert = (location: Location) => {
    notificationService.notifySOSAlert(location.address);
    console.log('SOS Alert triggered at:', location.address);
  };

  return {
    currentRide,
    availableDrivers,
    rideHistory,
    isDriverOnline,
    driverLocation,
    estimatedArrival,
    requestRide,
    acceptRide,
    updateRideStatus,
    cancelRide,
    toggleDriverOnline,
    updateDriverLocation,
    triggerSOSAlert
  };
});