import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { User, Star, Settings, LogOut, Shield, CreditCard } from 'lucide-react-native';
import { useUser } from '@/hooks/user-store';
import { router } from 'expo-router';

export default function ClientProfileScreen() {
  const { user, logout } = useUser();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: async () => {
          await logout();
          router.replace('/role-selection');
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileIcon}>
          <User size={32} color="#6366f1" />
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.ratingContainer}>
          <Star size={16} color="#fbbf24" fill="#fbbf24" />
          <Text style={styles.rating}>{user?.rating} • {user?.totalRides} rides</Text>
        </View>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.menuItem}>
          <Settings size={20} color="#6b7280" />
          <Text style={styles.menuText}>Account Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <CreditCard size={20} color="#6b7280" />
          <Text style={styles.menuText}>Payment Methods</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Shield size={20} color="#6b7280" />
          <Text style={styles.menuText}>Privacy & Security</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <User size={20} color="#6b7280" />
          <Text style={styles.menuText}>Emergency Contacts</Text>
        </TouchableOpacity>

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
        <Text style={styles.version}>SafeRide v1.0.0</Text>
        <Text style={styles.footerText}>For Women, By Women</Text>
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
    backgroundColor: '#f0f0ff',
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 6,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
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