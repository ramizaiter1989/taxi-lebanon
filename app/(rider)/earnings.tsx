import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { DollarSign, TrendingUp, Calendar, Clock } from 'lucide-react-native';

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.subtitle}>Track your income and performance</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <DollarSign size={24} color="#10b981" />
            <Text style={styles.summaryAmount}>{todayEarnings.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Today</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <TrendingUp size={24} color="#6366f1" />
            <Text style={styles.summaryAmount}>{weekEarnings.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>This Week</Text>
          </View>
        </View>

        <View style={styles.monthlyCard}>
          <View style={styles.monthlyHeader}>
            <Calendar size={20} color="#8b5cf6" />
            <Text style={styles.monthlyTitle}>This Month</Text>
          </View>
          <Text style={styles.monthlyAmount}>{monthEarnings.toLocaleString()} LBP</Text>
          <View style={styles.monthlyStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalTrips}</Text>
              <Text style={styles.statLabel}>Total Trips</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Math.round(monthEarnings / totalTrips).toLocaleString()}</Text>
              <Text style={styles.statLabel}>Avg per Trip</Text>
            </View>
          </View>
        </View>

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
                      backgroundColor: item.day === 'Sun' ? '#10b981' : '#e5e7eb'
                    }
                  ]} 
                />
                <Text style={styles.chartDay}>{item.day}</Text>
                <Text style={styles.chartAmount}>{(item.amount / 1000).toFixed(0)}k</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.performanceContainer}>
          <Text style={styles.performanceTitle}>Performance Metrics</Text>
          
          <View style={styles.metricItem}>
            <View style={styles.metricIcon}>
              <Clock size={20} color="#6366f1" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Average Trip Duration</Text>
              <Text style={styles.metricValue}>18 minutes</Text>
            </View>
          </View>

          <View style={styles.metricItem}>
            <View style={styles.metricIcon}>
              <TrendingUp size={20} color="#10b981" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Acceptance Rate</Text>
              <Text style={styles.metricValue}>94%</Text>
            </View>
          </View>

          <View style={styles.metricItem}>
            <View style={styles.metricIcon}>
              <DollarSign size={20} color="#f59e0b" />
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
  summaryContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  monthlyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  monthlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthlyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  monthlyAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 16,
  },
  monthlyStats: {
    flexDirection: 'row',
    gap: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
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
    width: 24,
    borderRadius: 4,
    marginBottom: 8,
  },
  chartDay: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  chartAmount: {
    fontSize: 10,
    color: '#9ca3af',
  },
  performanceContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
});