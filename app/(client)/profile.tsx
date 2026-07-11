import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Star, Settings, LogOut, Shield, CreditCard, Camera } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { API_BASE_URL } from '@/constants/config';
import { router } from 'expo-router';
import { useUser } from '@/hooks/user-store';
import { authCache } from '@/utils/authCache'; // ✅ Import auth cache

const { width } = Dimensions.get('window');

interface PassengerProfile {
  name: string;
  email: string;
  phone: string;
  wallet_balance: string;
}

export default function ClientProfileScreen() {
  const { user, logout: clearUser } = useUser();
  const [profile, setProfile] = useState<PassengerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Optimized: Fetch profile using auth cache
  const fetchProfile = async () => {
    if (authCache.isGuestUser()) {
      setProfile({
        name: 'Guest',
        email: 'Not signed in',
        phone: '—',
        wallet_balance: '0.00',
      });
      setLoading(false);
      return;
    }

    if (authCache.isMockUser()) {
      setProfile({
        name: authCache.getUserName() || 'Demo User',
        email: authCache.getUserEmail() || '',
        phone: '+961 70 123 456',
        wallet_balance: '25.00',
      });
      setLoading(false);
      return;
    }

    try {
      const token = authCache.getToken(); // ✅ INSTANT - no await
      if (!token) throw new Error('No token found');

      const response = await axios.get<{ user: PassengerProfile }>(`${API_BASE_URL}/passenger/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfile(response.data.user);
    } catch (error: unknown) {
      console.log('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // ✅ Optimized: Logout with auth cache clear
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await authCache.clear(); // ✅ Clear auth cache
          clearUser();
          router.replace('/login');
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
      {/* Background Decorations */}
      <View style={styles.backgroundContainer}>
        <LinearGradient colors={['#fce7f3bc', '#ec489a4b']} style={[styles.blob, styles.blob1]} />
        <LinearGradient colors={['#f47cb88d', '#f472b557']} style={[styles.blob, styles.blob2]} />
        <LinearGradient colors={['#f472b56b', '#d3269c73']} style={[styles.blob, styles.blob3]} />
      </View>

      {/* Header */}
      <LinearGradient
        colors={['#fce7f3', '#fbcfe8', '#f9a8d4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.profilePhotoWrapper}>
            <LinearGradient colors={['#f677b6b2', '#92286dff', '#f86bbdf8']} style={styles.profilePhotoGradient}>
              <View style={styles.profilePhoto}>
                <User size={36} color="#ec4899" strokeWidth={2} />
              </View>
            </LinearGradient>
            <TouchableOpacity style={styles.cameraButton}>
              <Camera size={14} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{profile?.name || 'User Name'}</Text>
            <View style={styles.ratingBadge}>
              <Star size={12} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.ratingText}>5.0</Text>
            </View>
          </View>
        </View>

        <View style={styles.contactCards}>
          <View style={styles.contactCard}>
            <Text style={styles.contactLabel}>📧</Text>
            <Text style={styles.contactValue} numberOfLines={1}>
              {profile?.email || 'email@example.com'}
            </Text>
          </View>
          <View style={styles.contactCard}>
            <Text style={styles.contactLabel}>📱</Text>
            <Text style={styles.contactValue}>{profile?.phone || '+1234567890'}</Text>
          </View>
        </View>

        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Wallet Balance</Text>
          <Text style={styles.walletAmount}>{profile?.wallet_balance || '0'}€</Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
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
            <Star size={20} color="#671344ff" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Saved Locations</Text>
            <Text style={styles.menuSubtext}>View and manage your saved places</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <Shield size={20} color="#671344ff" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Notifications</Text>
            <Text style={styles.menuSubtext}>Manage notification preferences</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <CreditCard size={20} color="#671344ff" />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Payment Methods</Text>
            <Text style={styles.menuSubtext}>Manage payment options</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf4ff' },
  backgroundContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.3 },
  blob1: { top: 80, left: -100 },
  blob2: { top: 150, right: -120 },
  blob3: { bottom: 100, left: width / 3 },
  headerGradient: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, shadowColor: '#923563ff', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 6 },
  headerContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  profilePhotoWrapper: { position: 'relative', marginRight: 16 },
  profilePhotoGradient: { width: 78, height: 78, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#ec489a74', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.4, shadowRadius: 25, elevation: 15 },
  profilePhoto: { width: 75, height: 75, borderRadius: 19, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  cameraButton: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#ec4899', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.5, shadowRadius: 3, elevation: 3 },
  userInfo: { flex: 1 },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#440b24ff', marginBottom: 6 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, alignSelf: 'flex-start' },
  ratingText: { color: '#4a0e28', fontSize: 14, fontWeight: 'bold', marginLeft: 4 },
  contactCards: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  contactCard: { flex: 1, backgroundColor: 'white', borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#81175684', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.4, shadowRadius: 2, elevation: 3 },
  contactLabel: { fontSize: 18 },
  contactValue: { flex: 1, color: '#4a0e28', fontSize: 13, fontWeight: '600' },
  walletCard: { backgroundColor: '#671344ff', borderRadius: 16, padding: 6, alignItems: 'center', marginTop: 10 },
  walletLabel: { fontSize: 13, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  walletAmount: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  content: { flex: 1, padding: 20, paddingTop: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#740d41db', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: '#fce7f3' },
  menuIconContainer: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#fdf2f8ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuTextContainer: { flex: 1 },
  menuText: { fontSize: 15, fontWeight: '600', color: '#440b24ff', marginBottom: 2 },
  menuSubtext: { fontSize: 12, color: '#6b1839' },
  divider: { height: 1, backgroundColor: '#fce7f3', marginVertical: 14 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#fecaca' },
  logoutText: { marginLeft: 8, fontSize: 15, fontWeight: '700', color: '#ef4444' },
});