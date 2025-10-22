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
      date: 'Jan 15, 2024',
      passengerName: 'Sarah Ahmad',
      rating: 5,
      duration: '18 min',
    },
    {
      id: '2',
      pickup: { address: 'Verdun, Beirut' },
      dropoff: { address: 'Beirut Central District' },
      fare: 6200,
      date: 'Jan 14, 2024',
      passengerName: 'Lina Khoury',
      rating: 4,
      duration: '12 min',
    },
    {
      id: '3',
      pickup: { address: 'Achrafieh, Beirut' },
      dropoff: { address: 'Zahlé, Bekaa' },
      fare: 25000,
      date: 'Jan 13, 2024',
      passengerName: 'Nour Hassan',
      rating: 5,
      duration: '45 min',
    },
  ];

  const totalEarnings = mockHistory.reduce((sum, ride) => sum + ride.fare, 0);
  const avgRating = (mockHistory.reduce((sum, ride) => sum + ride.rating, 0) / mockHistory.length).toFixed(1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Feminine Header with Gradient */}
      <LinearGradient
        colors={['#f8e8f5', '#f4d0ec', '#f0b6d9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.title}>Trip History</Text>
        <Text style={styles.subtitle}>Your completed journeys</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Navigation size={20} color="#d65c9e" />
            </View>
            <Text style={styles.statNumber}>{mockHistory.length}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <DollarSign size={20} color="#d65c9e" />
            </View>
            <Text style={styles.statNumber}>{totalEarnings.toLocaleString()}</Text>
            <Text style={styles.statLabel}>LBP Earned</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Star size={20} color="#d65c9e" fill="#d65c9e" />
            </View>
            <Text style={styles.statNumber}>{avgRating}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mockHistory.map((ride) => (
          <View key={ride.id} style={styles.rideCard}>
            {/* Card Header with Date & Fare */}
            <View style={styles.rideHeader}>
              <View style={styles.dateContainer}>
                <Calendar size={18} color="#ad4a78" />
                <Text style={styles.dateText}>{ride.date}</Text>
              </View>
              <LinearGradient
                colors={['#e879b8', '#f0a7c4']}
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
                    <User size={14} color="#d65c9e" />
                  </View>
                  <Text style={styles.passengerText}>{ride.passengerName}</Text>
                </View>
                <View style={styles.durationContainer}>
                  <Clock size={14} color="#ad4a78" />
                  <Text style={styles.durationText}>{ride.duration}</Text>
                </View>
              </View>

              <View style={styles.ratingContainer}>
                <Star size={16} color="#f4c2c2" fill="#f4c2c2" />
                <Text style={styles.ratingText}>{ride.rating}.0</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff9fc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#d65c9e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#8a3b62',
    marginBottom: 4,
    fontFamily: 'sans-serif-medium',
  },
  subtitle: {
    fontSize: 14,
    color: '#ad4a78',
    marginBottom: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#d65c9e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#d65c9e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8a3b62',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#ad4a78',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  rideCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#d65c9e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f8e8f5',
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
    backgroundColor: '#fdf2f8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#ad4a78',
    fontWeight: '600',
  },
  fareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  fareText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
  },
  routeContainer: {
    marginBottom: 16,
    backgroundColor: '#fef7f9',
    borderRadius: 14,
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
    backgroundColor: '#d65c9e',
    marginTop: 4,
  },
  dropoffDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#e879b8',
    marginTop: 4,
  },
  routeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  routeLabel: {
    fontSize: 11,
    color: '#ad4a78',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  routeText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },
  routeLine: {
    marginLeft: 5,
    marginVertical: 8,
    paddingLeft: 1,
  },
  routeLineDashed: {
    width: 2,
    height: 24,
    backgroundColor: '#f4d0ec',
    borderRadius: 1,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f8e8f5',
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
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fef7f9',
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
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8fb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fce7f3',
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#d65c9e',
  },
  bottomSpacer: {
    height: 24,
  },
});
