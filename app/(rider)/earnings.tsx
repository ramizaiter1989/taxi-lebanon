import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { DollarSign, TrendingUp, Calendar, Clock, Sparkles } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function RiderEarningsScreen() {
  const todayEarnings = 45000;
  const weekEarnings = 280000;
  const monthEarnings = 1200000;
  const totalTrips = 156;

  const dailyEarnings = [
    { day: 'Mon', amount: 35000 },
    { day: 'Tue', amount: 42000 },
    { day: 'Wed', amount: 38000 },
    { day: 'Thu', amount: 51000 },
    { day: 'Fri', amount: 47000 },
    { day: 'Sat', amount: 62000 },
    { day: 'Sun', amount: 45000 },
  ];

  const maxEarning = Math.max(...dailyEarnings.map(d => d.amount));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Feminine Header with Gradient */}
      <LinearGradient
        colors={['#fce7f3', '#fbcfe8', '#f9a8d4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Sparkles size={28} color="#ec4899" fill="#ec4899" />
            <View style={styles.titleTextContainer}>
              <Text style={styles.title}>Earnings</Text>
              <Text style={styles.subtitle}>Track your income & performance</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.todayCard]}>
            <View style={styles.summaryIconContainer}>
              <DollarSign size={22} color="#ec4899" />
            </View>
            <Text style={styles.summaryAmount}>{todayEarnings.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Today</Text>
          </View>
          
          <View style={[styles.summaryCard, styles.weekCard]}>
            <View style={styles.summaryIconContainer}>
              <TrendingUp size={22} color="#ec4899" />
            </View>
            <Text style={styles.summaryAmount}>{weekEarnings.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>This Week</Text>
          </View>
        </View>

        {/* Monthly Card */}
        <View style={styles.monthlyCard}>
          <LinearGradient
            colors={['#fdf2f8', '#fce7f3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.monthlyGradient}
          >
            <View style={styles.monthlyHeader}>
              <View style={styles.monthlyIconContainer}>
                <Calendar size={20} color="#ec4899" />
              </View>
              <Text style={styles.monthlyTitle}>This Month</Text>
            </View>
            <Text style={styles.monthlyAmount}>{monthEarnings.toLocaleString()} LBP</Text>
            <View style={styles.monthlyStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalTrips}</Text>
                <Text style={styles.statLabel}>Total Trips</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{Math.round(monthEarnings / totalTrips).toLocaleString()}</Text>
                <Text style={styles.statLabel}>Avg per Trip</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Chart Container */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Weekly Overview</Text>
          <View style={styles.chart}>
            {dailyEarnings.map((item, index) => (
              <View key={index} style={styles.chartItem}>
                <View 
                  style={[
                    styles.chartBar, 
                    { 
                      height: (item.amount / maxEarning) * 120,
                    }
                  ]} 
                >
                  <LinearGradient
                    colors={item.day === 'Sun' ? ['#ec4899', '#f472b6'] : ['#f9a8d4', '#fbcfe8']}
                    style={styles.chartBarGradient}
                  />
                </View>
                <Text style={[styles.chartDay, item.day === 'Sun' && styles.chartDayActive]}>
                  {item.day}
                </Text>
                <Text style={styles.chartAmount}>{(item.amount / 1000).toFixed(0)}k</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.performanceContainer}>
          <Text style={styles.performanceTitle}>Performance Metrics</Text>
          
          <View style={styles.metricItem}>
            <View style={[styles.metricIcon, styles.metricIcon1]}>
              <Clock size={20} color="#ec4899" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Average Trip Duration</Text>
              <Text style={styles.metricValue}>18 minutes</Text>
            </View>
          </View>

          <View style={styles.metricItem}>
            <View style={[styles.metricIcon, styles.metricIcon2]}>
              <TrendingUp size={20} color="#ec4899" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Acceptance Rate</Text>
              <Text style={styles.metricValue}>94%</Text>
            </View>
          </View>

          <View style={styles.metricItem}>
            <View style={[styles.metricIcon, styles.metricIcon3]}>
              <DollarSign size={20} color="#ec4899" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Online Hours Today</Text>
              <Text style={styles.metricValue}>6.5 hours</Text>
            </View>
          </View>
        </View>
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
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  headerContent: {
    paddingTop: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleTextContainer: {
    flex: 1,
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
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  todayCard: {
    borderWidth: 1,
    borderColor: '#fce7f3',
  },
  weekCard: {
    borderWidth: 1,
    borderColor: '#fce7f3',
  },
  summaryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fdf2f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  summaryAmount: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  monthlyCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  monthlyGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#fbcfe8',
    borderRadius: 16,
  },
  monthlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthlyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  monthlyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#831843',
  },
  monthlyAmount: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ec4899',
    marginBottom: 16,
  },
  monthlyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    padding: 14,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#fbcfe8',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#831843',
  },
  statLabel: {
    fontSize: 12,
    color: '#9d174d',
    marginTop: 4,
    fontWeight: '500',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#fce7f3',
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
  },
  chartItem: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 28,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  chartBarGradient: {
    flex: 1,
    width: '100%',
  },
  chartDay: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
    fontWeight: '600',
  },
  chartDayActive: {
    color: '#ec4899',
    fontWeight: '700',
  },
  chartAmount: {
    fontSize: 10,
    color: '#d1d5db',
    fontWeight: '600',
  },
  performanceContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fce7f3',
  },
  performanceTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 18,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  metricIcon1: {
    backgroundColor: '#fdf2f8',
  },
  metricIcon2: {
    backgroundColor: '#fce7f3',
  },
  metricIcon3: {
    backgroundColor: '#fbcfe8',
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 2,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
});