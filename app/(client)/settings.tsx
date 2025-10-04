import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Shield,
  CreditCard,
  MapPin,
  Settings as SettingsIcon,
  Bell,
  Globe,
  Lock,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@/hooks/user-store';
import { LinearGradient } from 'expo-linear-gradient';

interface SettingsItem {
  id: string;
  title: string;
  icon: any;
  route: string;
  color: string;
}

const SETTINGS_SECTIONS = [
  {
    title: 'Account',
    items: [
      { id: 'profile', title: 'Profile', icon: User, route: '/settings/profile', color: '#007AFF' },
      { id: 'safety', title: 'Safety', icon: Shield, route: '/settings/safety', color: '#34C759' },
      { id: 'payment', title: 'Payment', icon: CreditCard, route: '/settings/payment', color: '#FF9500' },
      { id: 'locations', title: 'Saved Locations', icon: MapPin, route: '/saved-locations', color: '#FF3B30' },
    ]
  },
  {
    title: 'Preferences',
    items: [
      { id: 'notifications', title: 'Notifications', icon: Bell, route: '/settings/notifications', color: '#5856D6' },
      { id: 'language', title: 'Language', icon: Globe, route: '/settings/language', color: '#AF52DE' },
      { id: 'privacy', title: 'Privacy', icon: Lock, route: '/settings/privacy', color: '#FF2D55' },
    ]
  }
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useUser();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const renderSettingsItem = (item: SettingsItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingsItem}
      onPress={() => router.push(item.route as any)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
        <item.icon size={24} color={item.color} />
      </View>
      <Text style={styles.settingsText}>{item.title}</Text>
      <ChevronRight size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <TouchableOpacity 
          style={styles.profileCard}
          onPress={() => router.push('./profile')}
        >
          <LinearGradient
            colors={['#007AFF', '#0051D5']}
            style={styles.profileGradient}
          >
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{user?.name.charAt(0) || 'U'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'email@example.com'}</Text>
            </View>
            <ChevronRight size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Settings Sections */}
        {SETTINGS_SECTIONS.map((section, index) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.settingsGroup}>
              {section.items.map((item, itemIndex) => (
                <View key={item.id}>
                  {renderSettingsItem(item)}
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  profileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 16,
    marginBottom: 8,
  },
  settingsGroup: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 68,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  version: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
    marginVertical: 24,
  },
});