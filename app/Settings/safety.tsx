import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Shield, Phone, Users, AlertTriangle, Share } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClientSafetyScreen() {
  const handleSOS = () => {
    Alert.alert(
      'Emergency SOS',
      'This will immediately contact emergency services and your emergency contacts. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Emergency', style: 'destructive', onPress: () => {
          // In real app, this would call emergency services
          Alert.alert('Emergency services contacted', 'Help is on the way');
        }}
      ]
    );
  };

  const handleShareTrip = () => {
    Alert.alert('Trip Shared', 'Your trip details have been shared with your emergency contacts');
  };

  const handleReportIssue = () => {
    Alert.alert('Report Issue', 'Your report has been submitted. Our safety team will review it immediately.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Shield size={32} color="#6366f1" />
        <Text style={styles.title}>Safety Center</Text>
        <Text style={styles.subtitle}>Your safety is our priority</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={[styles.safetyCard, styles.emergencyCard]}
          onPress={handleSOS}
          testID="sos-button"
        >
          <View style={styles.emergencyIcon}>
            <AlertTriangle size={24} color="white" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.emergencyTitle}>Emergency SOS</Text>
            <Text style={styles.emergencyDescription}>
              Instantly contact emergency services and your trusted contacts
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.safetyCard}
          onPress={handleShareTrip}
        >
          <Share size={24} color="#6366f1" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Share Trip</Text>
            <Text style={styles.cardDescription}>
              Share your live location and trip details with family
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.safetyCard}>
          <Users size={24} color="#6366f1" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Emergency Contacts</Text>
            <Text style={styles.cardDescription}>
              Manage your trusted contacts for emergencies
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.safetyCard}>
          <Phone size={24} color="#6366f1" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>24/7 Support</Text>
            <Text style={styles.cardDescription}>
              Get help anytime from our safety team
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.safetyCard}
          onPress={handleReportIssue}
        >
          <AlertTriangle size={24} color="#f59e0b" />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Report Safety Issue</Text>
            <Text style={styles.cardDescription}>
              Report any safety concerns or incidents
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          All drivers are verified and background-checked for your safety
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    alignItems: 'center',
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
    marginTop: 12,
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
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  emergencyCard: {
    backgroundColor: '#ef4444',
    marginBottom: 24,
  },
  emergencyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  emergencyDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});