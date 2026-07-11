import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Star, Settings, LogOut, Car, Shield, Camera } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/hooks/user-store';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@/constants/config';
import { authCache } from '@/utils/authCache';
import { Slider } from '@miblanchard/react-native-slider';


const { width } = Dimensions.get('window');

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
  const [scanningRange, setScanningRange] = useState<number>(50); // default 50 km
  const [savingRange, setSavingRange] = useState(false);
  const [showRangeSlider, setShowRangeSlider] = useState(false);


// Toggle slider visibility
const toggleRangeSlider = () => setShowRangeSlider(prev => !prev);

  const fetchDriverProfile = async () => {
    if (authCache.isGuestUser()) {
      setDriverProfile({
        id: 0,
        user_id: 0,
        license_number: null,
        vehicle_type: null,
        vehicle_number: null,
        rating: null,
        availability_status: false,
        car_photo: null,
        current_driver_lat: null,
        current_driver_lng: null,
        user: {
          name: 'Guest Driver',
          email: 'Not signed in',
          phone: '—',
        },
      });
      setLoading(false);
      return;
    }

    try {
      const token = authCache.getToken();
      if (!token) throw new Error('No token found');

      const response = await axios.get<DriverProfile>(`${API_BASE_URL}/driver/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDriverProfile(response.data);
      setScanningRange(response.data.scanning_range_km ?? 50);

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
  const saveRange = async () => {
  setSavingRange(true);
  try {
    const token = authCache.getToken();
    if (!token) throw new Error('No token found');

    // Ensure number payload
    const payload = { scanning_range_km: scanningRange };
    console.log('Saving range', payload);

    await axios.put(`${API_BASE_URL}/driver/range`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    Alert.alert('Success', 'Scanning range updated');
    setShowRangeSlider(false); // hide slider after save
  } catch (error) {
    console.log(error);
    Alert.alert('Error', 'Failed to update scanning range');
  } finally {
    setSavingRange(false);
  }
};

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            const token = authCache.getToken();
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
            router.replace('/login');
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
      {/* Decorative background elements - matching login */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#fce7f3', '#a10553ff']}
          style={[styles.blob, styles.blob1]}
        />
        <LinearGradient
          colors={['#dc69a2ff', '#e04b98ff']}
          style={[styles.blob, styles.blob2]}
        />
        <LinearGradient
          colors={['#99386aff', '#d026d3ff']}
          style={[styles.blob, styles.blob3]}
        />
      </View>

      {/* Compact Feminine Header */}
      <LinearGradient
        colors={['#fdb3ddff', '#f72fa0a6', '#a04677c3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          {/* Profile Photo - Compact */}
          <View style={styles.profilePhotoWrapper}>
            <LinearGradient
              colors={['#f677b6b2', '#92286dff', '#f86bbdf8']}
              style={styles.profilePhotoGradient}
            >
              <View style={styles.profilePhoto}>
                <User size={36} color="#ec4899" strokeWidth={2} />
              </View>
            </LinearGradient>
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
{/* Range Button */}
<View style={styles.rangeContainer}>
  {!showRangeSlider ? (
    <TouchableOpacity style={styles.rangeButton} onPress={toggleRangeSlider}>
      <Text style={styles.rangeButtonText}>
        Set Scanning Range ({scanningRange} km)
      </Text>
    </TouchableOpacity>
  ) : (
    <View>
      <Text style={styles.rangeLabel}>Scanning Range: {scanningRange} km</Text>

      <Slider
        value={scanningRange}
        onValueChange={(value) => {
          const v = Array.isArray(value) ? value[0] : value;
          setScanningRange(v);
        }}
        minimumValue={1}
        maximumValue={40}
        step={1}
        thumbTintColor="#9f2a65ff"
        minimumTrackTintColor="#b92b74ff"
        maximumTrackTintColor="#fce7f3"
      />

      <TouchableOpacity
        style={styles.saveButton}
        onPress={saveRange}
        disabled={savingRange}
      >
        {savingRange ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.saveButtonText}>Save Range</Text>
        )}
      </TouchableOpacity>
    </View>
  )}
</View>


      {/* Content Section */}
      <View style={styles.content}>
        {/* <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <Car size={20} color="#671344ff" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Vehicle Information</Text>
            <Text style={styles.menuSubtext}>Manage your vehicle details</Text>
          </View>
        </TouchableOpacity> */}

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <Settings size={20} color="#671344ff" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Account Settings</Text>
            <Text style={styles.menuSubtext}>Update your preferences</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <Shield size={20} color="#671344ff" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Safety & Security</Text>
            <Text style={styles.menuSubtext}>Privacy and protection</Text>
          </View>
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <User size={20} color="#671344ff" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Driver Documents</Text>
            <Text style={styles.menuSubtext}>Licenses and certifications</Text>
          </View>
        </TouchableOpacity> */}

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
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.3,
  },
  blob1: {
    top: 80,
    left: -100,
  },
  blob2: {
    top: 150,
    right: -120,
  },
  blob3: {
    bottom: 100,
    left: width / 3,
  },
  headerGradient: {
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#74063dff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profilePhotoWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  profilePhotoGradient: {
    width: 78,
    height: 78,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ec489a74',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
  },
  profilePhoto: {
    width: 75,
    height: 75,
    borderRadius: 19,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },

  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#440b24ff',
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
    color: '#4a0e28',
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
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#81175684',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },
  contactLabel: {
    fontSize: 18,
  },
  contactValue: {
    flex: 1,
    color: '#4a0e28',
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
    shadowColor: '#740d41db',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#fce7f3',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fdf2f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 15,
    color: '#440b24ff',
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtext: {
    fontSize: 12,
    color: '#6b1839',
  },
  vehicleInfo: {
    backgroundColor: '#fdf2f8a9',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#740d41db',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#fbcfe8',
  },
  vehicleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4a0e28',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vehicleDetails: {
    fontSize: 15,
    color: '#1f1f1f',
    marginBottom: 8,
    fontWeight: '500',
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#671344ff',
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
    backgroundColor: '#fce7f3',
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
    paddingBottom: 10,
  },
  footerText: {
    fontSize: 13,
    color: '#6b1839',
    fontWeight: '500',
  },
  rangeContainer: {
  marginTop: 20,
  backgroundColor: '#fdf2f8',
  padding: 16,
  borderRadius: 16,
  shadowColor: '#740d41db',
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.5,
  shadowRadius: 5,
  elevation: 2,
  marginBottom: 10,
},
rangeLabel: {
  fontSize: 14,
  color: '#4a0e28',
  marginBottom: 10,
  fontWeight: '600',
},
saveButton: {
  marginTop: 10,
  backgroundColor: '#ec4899',
  paddingVertical: 10,
  borderRadius: 12,
  alignItems: 'center',
},
saveButtonText: {
  color: 'white',
  fontSize: 14,
  fontWeight: '700',
},
rangeButton: {
  backgroundColor: '#b2226cff',
  padding: 14,
  borderRadius: 16,
  alignItems: 'center',
},
rangeButtonText: {
  color: 'white',
  fontSize: 14,
  fontWeight: '700',
},


});