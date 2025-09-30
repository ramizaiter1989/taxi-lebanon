import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Car, User } from 'lucide-react-native';
import { router } from 'expo-router';
import { useUser } from '@/hooks/user-store';

export default function RoleSelectionScreen() {
  const { login } = useUser();

  const handleRoleSelect = async (role: 'client' | 'rider') => {
    if (!role.trim()) return;
    await login(role);
    router.replace(role === 'client' ? '/(client)' : '/(rider)');
  };

  return (
    <LinearGradient
      colors={['#6366f1', '#8b5cf6', '#ec4899']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>SafeRide</Text>
            <Text style={styles.subtitle}>For Women, By Women</Text>
            <Text style={styles.description}>
              Choose your role to get started with Lebanon&apos;s safest ride-hailing service
            </Text>
          </View>

          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={styles.roleCard}
              onPress={() => handleRoleSelect('client')}
              testID="client-role-button"
            >
              <View style={styles.iconContainer}>
                <User size={40} color="#6366f1" />
              </View>
              <Text style={styles.roleTitle}>I need a ride</Text>
              <Text style={styles.roleDescription}>
                Book safe rides with verified women drivers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.roleCard}
              onPress={() => handleRoleSelect('rider')}
              testID="rider-role-button"
            >
              <View style={styles.iconContainer}>
                <Car size={40} color="#6366f1" />
              </View>
              <Text style={styles.roleTitle}>I want to drive</Text>
              <Text style={styles.roleDescription}>
                Earn money by providing safe rides to women
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            All users are verified for your safety and security
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  roleContainer: {
    gap: 20,
  },
  roleCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
});