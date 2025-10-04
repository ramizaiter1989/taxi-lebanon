import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  CheckCircle,
  Edit,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@/hooks/user-store';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleSave = async () => {
    await updateUser(formData);
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handlePhotoUpload = () => {
    Alert.alert('Photo Upload', 'Photo upload feature coming soon!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#007AFF', '#0051D5']}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>
                {user?.name.charAt(0) || 'U'}
              </Text>
            </LinearGradient>
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={handlePhotoUpload}
            >
              <Camera size={20} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.uploadText}>Upload Photo</Text>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <User size={20} color="#666" />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                editable={isEditing}
                placeholder="Enter your name"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Mail size={20} color="#666" />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                editable={isEditing}
                placeholder="Enter your email"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Phone size={20} color="#666" />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                editable={isEditing}
                placeholder="Enter your phone"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Verification Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification</Text>
          
          <View style={styles.verificationCard}>
            <View style={styles.verificationItem}>
              <View style={styles.verificationIcon}>
                {user?.isVerified ? (
                  <CheckCircle size={24} color="#34C759" />
                ) : (
                  <Shield size={24} color="#FF9500" />
                )}
              </View>
              <View style={styles.verificationInfo}>
                <Text style={styles.verificationTitle}>
                  {user?.isVerified ? 'Verified Account' : 'Pending Verification'}
                </Text>
                <Text style={styles.verificationDesc}>
                  {user?.isVerified 
                    ? 'Your account is verified'
                    : 'Complete verification to unlock all features'}
                </Text>
              </View>
            </View>

            {!user?.isVerified && (
              <TouchableOpacity style={styles.verifyButton}>
                <LinearGradient
                  colors={['#FF9500', '#FF6B00']}
                  style={styles.verifyGradient}
                >
                  <Text style={styles.verifyButtonText}>Verify Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Account Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{user?.totalRides || 0}</Text>
              <Text style={styles.statLabel}>Total Rides</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{user?.rating || 0}</Text>
              <Text style={styles.statLabel}>Rating</Text>
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  uploadText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  inputDisabled: {
    color: '#999',
  },
  verificationCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  verificationInfo: {
    flex: 1,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  verificationDesc: {
    fontSize: 14,
    color: '#666',
  },
  verifyButton: {
    marginTop: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  verifyGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
});