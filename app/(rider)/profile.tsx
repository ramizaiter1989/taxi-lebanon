import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { User, Star, Settings, LogOut, Car, Shield } from 'lucide-react-native';
import { useUser } from '@/hooks/user-store';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import the logout API function
import { logout as apiLogout } from "../../services/AuthService";

export default function RiderProfileScreen() {
  const { user, logout: clearUser } = useUser(); // renamed logout from user-store

  const handleLogout = async () => {
  try {
    const token = await AsyncStorage.getItem("access_token");
    if (!token) return Alert.alert("Error", "No token found");

    // Call backend
    await apiLogout(token);

    // Clear frontend user state
    clearUser();

    // Remove token
    await AsyncStorage.removeItem("access_token");

    // Navigate to login
    router.replace("/login");
  } catch (err: any) {
    console.error(err);
    Alert.alert("Error", err.response?.data?.message || "Logout failed");
  }
};



  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileIcon}>
          <User size={32} color="#10b981" />
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Star size={16} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.statText}>{user?.rating}</Text>
          </View>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.statText}>{user?.totalRides} trips</Text>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.menuItem}>
          <Car size={20} color="#6b7280" />
          <Text style={styles.menuText}>Vehicle Information</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Settings size={20} color="#6b7280" />
          <Text style={styles.menuText}>Account Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Shield size={20} color="#6b7280" />
          <Text style={styles.menuText}>Safety & Security</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <User size={20} color="#6b7280" />
          <Text style={styles.menuText}>Driver Documents</Text>
        </TouchableOpacity>

        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleTitle}>Current Vehicle</Text>
          <Text style={styles.vehicleDetails}>Toyota Corolla • White • 123456</Text>
          <Text style={styles.vehicleStatus}>✅ Verified</Text>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity 
          style={[styles.menuItem, styles.logoutItem]}
          onPress={handleLogout}
        >
          <LogOut size={20} color="#ef4444" />
          <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>SafeRide Driver v1.0.0</Text>
        <Text style={styles.footerText}>Drive safely, earn confidently</Text>
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
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  statDivider: {
    marginHorizontal: 8,
    color: '#9ca3af',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  vehicleInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  vehicleDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  vehicleStatus: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  logoutItem: {
    marginTop: 12,
  },
  logoutText: {
    color: '#ef4444',
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  version: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});
