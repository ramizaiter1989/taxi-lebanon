import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Settings, LogOut, Shield, CreditCard } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@/constants/config';
import { router } from 'expo-router';
import { useUser } from '@/hooks/user-store';

export default function ClientProfileScreen() {
  const [profile, setProfile] = useState<PassengerProfile | null>(null);
  const { user, logout } = useUser();
type PassengerProfile = {
  name: string;
  email: string;
  phone: string;
  wallet_balance: string;
};

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const res = await axios.get(`${API_BASE_URL}/passenger/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProfile(res.data.user); // store only necessary data
      } catch (err) {
        console.log('Failed to fetch profile:', err);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {

    const confirmlogout=  () =>
    {
      logout();
    router.replace('/login');}

    Alert.alert(
          'Logout',
          'Are you sure you want to logout?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', onPress: confirmlogout }
          ]
        );
    
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileIcon}>
          <User size={32} color="#6366f1" />
        </View>
        <Text style={styles.name}>{profile?.name}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        <Text style={styles.phone}>{profile?.phone}</Text>
        <Text style={styles.wallet}>Wallet Balance: {profile?.wallet_balance}€</Text>
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
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
  name: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  email: { fontSize: 16, color: '#6b7280', marginBottom: 4 },
  phone: { fontSize: 16, color: '#6b7280', marginBottom: 4 },
  wallet: { fontSize: 16, color: '#374151', fontWeight: '500', marginBottom: 12 },
  content: { flex: 1, padding: 24 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  menuText: { marginLeft: 12, fontSize: 16, color: '#374151', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 12 },
  logoutItem: { marginTop: 12 },
  logoutText: { color: '#ef4444' },
  footer: { alignItems: 'center', padding: 24 },
  version: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  footerText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
});
