import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Star, Settings, LogOut, Car, Shield, Camera } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/hooks/user-store';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@/constants/config';

interface DriverProfile {
  id: number;
  user_id: number;
  license_number: string | null;
  vehicle_type: string | null;
  vehicle_number: string | null;
  rating: string | null;
  availability_status: boolean;
  car_photo: string | null;
  current_driver_lat: string | null;
  current_driver_lng: string | null;
  user?: {
    name: string;
    email: string;
    phone: string;
  };
  [key: string]: any;
}

export default function RiderProfileScreen() {
  const { user, logout: clearUser } = useUser();
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDriverProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await axios.get<DriverProfile>(`${API_BASE_URL}/driver/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDriverProfile(response.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.log('Axios error:', error.response?.data || error.message);
      } else if (error instanceof Error) {
        console.log('Error fetching driver profile:', error.message);
      } else {
        console.log('Unknown error occurred');
      }
      Alert.alert('Error', 'Failed to load driver profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
              await axios.post(`${API_BASE_URL}/logout`, {}, {
                headers: { Authorization: `Bearer ${token}` },
              });
            }
          } catch (error) {
            console.log('Logout error:', error);
          } finally {
            await AsyncStorage.removeItem('token');
            clearUser();
            router.replace('/role-selection');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ec4899" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Compact Feminine Header */}
      <LinearGradient
        colors={['#fce7f3', '#fbcfe8', '#f9a8d4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          {/* Profile Photo - Compact */}
          <View style={styles.profilePhotoWrapper}>
            <View style={styles.profilePhoto}>
              <User size={36} color="#ec4899" strokeWidth={2} />
            </View>
            <TouchableOpacity style={styles.cameraButton}>
              <Camera size={14} color="white" />
            </TouchableOpacity>
          </View>

          {/* User Info - Compact */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{driverProfile?.user?.name || 'Driver Name'}</Text>
            
            {/* Rating Badge */}
            <View style={styles.ratingBadge}>
              <Star size={12} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.ratingText}>{driverProfile?.rating ?? '5.0'}</Text>
            </View>
          </View>
        </View>

        {/* Contact Info Cards - Compact */}
        <View style={styles.contactCards}>
          <View style={styles.contactCard}>
            <Text style={styles.contactLabel}>📧</Text>
            <Text style={styles.contactValue} numberOfLines={1}>
              {driverProfile?.user?.email || 'email@example.com'}
            </Text>
          </View>
          
          <View style={styles.contactCard}>
            <Text style={styles.contactLabel}>📱</Text>
            <Text style={styles.contactValue}>
              {driverProfile?.user?.phone || '+1234567890'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content Section */}
      <View style={styles.content}>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <Car size={20} color="#ec4899" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Vehicle Information</Text>
            <Text style={styles.menuSubtext}>Manage your vehicle details</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <Settings size={20} color="#ec4899" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Account Settings</Text>
            <Text style={styles.menuSubtext}>Update your preferences</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <Shield size={20} color="#ec4899" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Safety & Security</Text>
            <Text style={styles.menuSubtext}>Privacy and protection</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <User size={20} color="#ec4899" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Driver Documents</Text>
            <Text style={styles.menuSubtext}>Licenses and certifications</Text>
          </View>
        </TouchableOpacity>

        {/* Vehicle Info Card */}
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleTitle}>Current Vehicle</Text>
          <Text style={styles.vehicleDetails}>
            {driverProfile?.vehicle_type || 'Toyota Corolla'} • {driverProfile?.vehicle_number || '123456'}
          </Text>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verified</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>

        <Text style={styles.footerText}>Drive safely, earn confidently</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf4ff',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  profilePhotoWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  profilePhoto: {
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  cameraButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#ec4899',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#831843',
    marginBottom: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  ratingText: {
    color: '#831843',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  contactCards: {
    flexDirection: 'row',
    gap: 10,
  },
  contactCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactLabel: {
    fontSize: 18,
  },
  contactValue: {
    flex: 1,
    color: '#831843',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fdf2f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  vehicleInfo: {
    backgroundColor: '#fdf2f8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#fbcfe8',
  },
  vehicleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vehicleDetails: {
    fontSize: 15,
    color: '#1f2937',
    marginBottom: 8,
    fontWeight: '500',
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ec4899',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  verifiedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3e8ff',
    marginVertical: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#ef4444',
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    padding: 10,
    paddingBottom: 12,
  },
  version: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 3,
  },
  footerText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
});