import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { MapPin, Navigation, Star, Calendar, DollarSign } from 'lucide-react-native';

export default function RiderHistoryScreen() {
  const mockHistory = [
    {
      id: '1',
      pickup: { address: 'Hamra, Beirut' },
      dropoff: { address: 'Achrafieh, Beirut' },
      fare: 8500,
      date: '2024-01-15',
      passengerName: 'Sarah Ahmad',
      rating: 5,
      duration: '18 min'
    },
    {
      id: '2',
      pickup: { address: 'Verdun, Beirut' },
      dropoff: { address: 'Beirut Central District' },
      fare: 6200,
      date: '2024-01-15',
      passengerName: 'Lina Khoury',
      rating: 4,
      duration: '12 min'
    },
    {
      id: '3',
      pickup: { address: 'Achrafieh, Beirut' },
      dropoff: { address: 'Zahlé, Bekaa' },
      fare: 25000,
      date: '2024-01-14',
      passengerName: 'Nour Hassan',
      rating: 5,
      duration: '45 min'
    }
  ];

  const totalEarnings = mockHistory.reduce((sum, ride) => sum + ride.fare, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trip History</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{mockHistory.length}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalEarnings.toLocaleString()}</Text>
            <Text style={styles.statLabel}>LBP Earned</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mockHistory.map((ride) => (
          <View key={ride.id} style={styles.rideCard}>
            <View style={styles.rideHeader}>
              <View style={styles.dateContainer}>
                <Calendar size={16} color="#6b7280" />
                <Text style={styles.dateText}>{ride.date}</Text>
              </View>
              <View style={styles.fareContainer}>
                <DollarSign size={16} color="#10b981" />
                <Text style={styles.fareText}>{ride.fare.toLocaleString()} LBP</Text>
              </View>
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
              <View style={styles.passengerInfo}>
                <Text style={styles.passengerText}>Passenger: {ride.passengerName}</Text>
                <Text style={styles.durationText}>Duration: {ride.duration}</Text>
              </View>
              <View style={styles.ratingContainer}>
                <Star size={14} color="#fbbf24" fill="#fbbf24" />
                <Text style={styles.ratingText}>{ride.rating}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
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
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
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
  fareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fareText: {
    marginLeft: 4,
    fontSize: 16,
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
  passengerInfo: {
    flex: 1,
  },
  passengerText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  durationText: {
    fontSize: 12,
    color: '#9ca3af',
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
});