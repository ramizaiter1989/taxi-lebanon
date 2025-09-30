import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MapPin, Navigation, Star, Calendar } from 'lucide-react-native';
import { useRide } from '@/hooks/ride-store';
import { Ride } from '@/types/user';

export default function ClientHistoryScreen() {
  const { rideHistory } = useRide();

  const mockHistory: Ride[] = [
    {
      id: '1',
      clientId: '1',
      pickup: { latitude: 33.8938, longitude: 35.5018, address: 'Hamra, Beirut' },
      dropoff: { latitude: 33.8869, longitude: 35.5131, address: 'Achrafieh, Beirut' },
      status: 'completed',
      fare: 8500,
      estimatedDuration: 15,
      createdAt: new Date('2024-01-15'),
      completedAt: new Date('2024-01-15'),
      date: '2024-01-15',
      driverName: 'Fatima Khalil',
      rating: 5
    },
    {
      id: '2',
      clientId: '1',
      pickup: { latitude: 33.8869, longitude: 35.4962, address: 'Verdun, Beirut' },
      dropoff: { latitude: 33.8959, longitude: 35.5011, address: 'Beirut Central District' },
      status: 'completed',
      fare: 6200,
      estimatedDuration: 12,
      createdAt: new Date('2024-01-12'),
      completedAt: new Date('2024-01-12'),
      date: '2024-01-12',
      driverName: 'Nour Mansour',
      rating: 4
    }
  ];

  const allRides = [...rideHistory, ...mockHistory];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ride History</Text>
        <Text style={styles.subtitle}>{allRides.length} rides completed</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {allRides.map((ride) => (
          <View key={ride.id} style={styles.rideCard}>
            <View style={styles.rideHeader}>
              <View style={styles.dateContainer}>
                <Calendar size={16} color="#6b7280" />
                <Text style={styles.dateText}>{ride.date || 'Today'}</Text>
              </View>
              <Text style={styles.fareText}>{ride.fare} LBP</Text>
            </View>

            <View style={styles.routeContainer}>
              <View style={styles.routeItem}>
                <MapPin size={16} color="#10b981" />
                <Text style={styles.routeText}>{ride.pickup.address}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routeItem}>
                <Navigation size={16} color="#ef4444" />
                <Text style={styles.routeText}>{ride.dropoff.address}</Text>
              </View>
            </View>

            <View style={styles.rideFooter}>
              <Text style={styles.driverText}>
                Driver: {ride.driverName || 'Fatima Khalil'}
              </Text>
              <View style={styles.ratingContainer}>
                <Star size={14} color="#fbbf24" fill="#fbbf24" />
                <Text style={styles.ratingText}>{ride.rating || 5}</Text>
              </View>
            </View>
          </View>
        ))}

        {allRides.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No rides yet</Text>
            <Text style={styles.emptySubtext}>Your ride history will appear here</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  rideCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6b7280',
  },
  fareText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  routeContainer: {
    marginBottom: 16,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#e5e7eb',
    marginLeft: 8,
    marginVertical: 4,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverText: {
    fontSize: 14,
    color: '#6b7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
});