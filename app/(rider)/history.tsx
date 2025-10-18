import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MapPin, Navigation, Star, Calendar, DollarSign, Clock, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

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
  const avgRating = (mockHistory.reduce((sum, ride) => sum + ride.rating, 0) / mockHistory.length).toFixed(1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Feminine Header with Gradient */}
      <LinearGradient
        colors={['#fce7f3', '#fbcfe8', '#f9a8d4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.title}>Trip History</Text>
        <Text style={styles.subtitle}>Your completed journeys</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Navigation size={20} color="#ec4899" />
            </View>
            <Text style={styles.statNumber}>{mockHistory.length}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <DollarSign size={20} color="#ec4899" />
            </View>
            <Text style={styles.statNumber}>{totalEarnings.toLocaleString()}</Text>
            <Text style={styles.statLabel}>LBP Earned</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Star size={20} color="#ec4899" fill="#ec4899" />
            </View>
            <Text style={styles.statNumber}>{avgRating}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mockHistory.map((ride, index) => (
          <View key={ride.id} style={styles.rideCard}>
            {/* Card Header with Date & Fare */}
            <View style={styles.rideHeader}>
              <View style={styles.dateContainer}>
                <Calendar size={18} color="#9d174d" />
                <Text style={styles.dateText}>{ride.date}</Text>
              </View>
              <LinearGradient
                colors={['#ec4899', '#f472b6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.fareContainer}
              >
                <DollarSign size={16} color="white" />
                <Text style={styles.fareText}>{ride.fare.toLocaleString()} LBP</Text>
              </LinearGradient>
            </View>

            {/* Route Information */}
            <View style={styles.routeContainer}>
              <View style={styles.routeItem}>
                <View style={styles.pickupDot} />
                <View style={styles.routeTextContainer}>
                  <Text style={styles.routeLabel}>Pickup</Text>
                  <Text style={styles.routeText}>{ride.pickup.address}</Text>
                </View>
              </View>
              
              <View style={styles.routeLine}>
                <View style={styles.routeLineDashed} />
              </View>
              
              <View style={styles.routeItem}>
                <View style={styles.dropoffDot} />
                <View style={styles.routeTextContainer}>
                  <Text style={styles.routeLabel}>Drop-off</Text>
                  <Text style={styles.routeText}>{ride.dropoff.address}</Text>
                </View>
              </View>
            </View>

            {/* Footer Info */}
            <View style={styles.rideFooter}>
              <View style={styles.footerLeft}>
                <View style={styles.passengerContainer}>
                  <View style={styles.passengerIcon}>
                    <User size={14} color="#ec4899" />
                  </View>
                  <Text style={styles.passengerText}>{ride.passengerName}</Text>
                </View>
                <View style={styles.durationContainer}>
                  <Clock size={14} color="#9ca3af" />
                  <Text style={styles.durationText}>{ride.duration}</Text>
                </View>
              </View>
              
              <View style={styles.ratingContainer}>
                <Star size={16} color="#fbbf24" fill="#fbbf24" />
                <Text style={styles.ratingText}>{ride.rating}.0</Text>
              </View>
            </View>
          </View>
        ))}
        
        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf4ff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#831843',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#9d174d',
    marginBottom: 18,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#831843',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#9d174d',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  rideCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#fce7f3',
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  dateText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#9d174d',
    fontWeight: '600',
  },
  fareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  fareText: {
    marginLeft: 4,
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
  },
  routeContainer: {
    marginBottom: 18,
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    padding: 14,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ec4899',
    marginTop: 4,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  dropoffDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#f472b6',
    marginTop: 4,
    shadowColor: '#f472b6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  routeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  routeLabel: {
    fontSize: 11,
    color: '#9d174d',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  routeText: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '600',
  },
  routeLine: {
    marginLeft: 5,
    marginVertical: 6,
    paddingLeft: 1,
  },
  routeLineDashed: {
    width: 2,
    height: 24,
    backgroundColor: '#fbcfe8',
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#fce7f3',
  },
  footerLeft: {
    flex: 1,
    gap: 8,
  },
  passengerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passengerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fdf2f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  passengerText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '600',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 32,
  },
  durationText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#92400e',
  },
  bottomSpacer: {
    height: 20,
  },
});