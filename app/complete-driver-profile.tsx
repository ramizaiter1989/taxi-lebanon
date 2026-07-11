import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { API_BASE_URL } from "../constants/config";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import DropDownPicker from 'react-native-dropdown-picker';
import { authCache } from '@/utils/authCache';

const { width, height } = Dimensions.get('window');

export default function CompleteDriverProfileScreen() {
  const router = useRouter();
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [carPhoto, setCarPhoto] = useState<string | null>(null);
  const [carPhotoFront, setCarPhotoFront] = useState<string | null>(null);
  const [carPhotoBack, setCarPhotoBack] = useState<string | null>(null);
  const [carPhotoLeft, setCarPhotoLeft] = useState<string | null>(null);
  const [carPhotoRight, setCarPhotoRight] = useState<string | null>(null);
  const [licensePhoto, setLicensePhoto] = useState<string | null>(null);
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [insurancePhoto, setInsurancePhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: 'Toyota', value: 'Toyota' },
    { label: 'Nissan', value: 'Nissan' },
    { label: 'Mitsubishi', value: 'Mitsubishi' },
    { label: 'Kia', value: 'Kia' },
    { label: 'Hyundai', value: 'Hyundai' },
    { label: 'Renault', value: 'Renault' },
    { label: 'Suzuki', value: 'Suzuki' },
    { label: 'Mercedes-Benz', value: 'Mercedes-Benz' },
    { label: 'BMW', value: 'BMW' },
    { label: 'Lexus', value: 'Lexus' },
    { label: 'Chevrolet', value: 'Chevrolet' },
    { label: 'Peugeot', value: 'Peugeot' },
    { label: 'Citroën', value: 'Citroën' },
    { label: 'Fiat', value: 'Fiat' },
    { label: 'Other', value: 'Other' },
  ]);

  // Animated scales
  const licenseScale = useSharedValue(1);
  const vehicleNumberScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  const licenseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(licenseScale.value) }]
  }));
  const vehicleNumberAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(vehicleNumberScale.value) }]
  }));
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(buttonScale.value) }]
  }));

  const pickImage = async (setter: (uri: string | null) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setter(result.assets[0].uri);
    }
  };

  const handleCompleteProfile = async () => {
    if (!licenseNumber || !vehicleType || !vehicleNumber) {
      Alert.alert('Error', 'Please fill all required fields.');
      return;
    }
    setIsLoading(true);
    try {
      const token = authCache.getToken();
      if (!token) {
        Alert.alert('Error', 'You need to login first');
        router.replace('/');
        return;
      }
      const formData = new FormData();
      formData.append('license_number', licenseNumber);
      formData.append('vehicle_type', vehicleType);
      formData.append('vehicle_number', vehicleNumber);

      // Append car photos
      if (carPhoto) {
        const uriParts = carPhoto.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('car_photo', {
          uri: carPhoto,
          name: `car_photo.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }
      if (carPhotoFront) {
        const uriParts = carPhotoFront.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('car_photo_front', {
          uri: carPhotoFront,
          name: `car_photo_front.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }
      if (carPhotoBack) {
        const uriParts = carPhotoBack.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('car_photo_back', {
          uri: carPhotoBack,
          name: `car_photo_back.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }
      if (carPhotoLeft) {
        const uriParts = carPhotoLeft.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('car_photo_left', {
          uri: carPhotoLeft,
          name: `car_photo_left.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }
      if (carPhotoRight) {
        const uriParts = carPhotoRight.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('car_photo_right', {
          uri: carPhotoRight,
          name: `car_photo_right.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      // Append other photos
      if (licensePhoto) {
        const uriParts = licensePhoto.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('license_photo', {
          uri: licensePhoto,
          name: `license_photo.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }
      if (idPhoto) {
        const uriParts = idPhoto.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('id_photo', {
          uri: idPhoto,
          name: `id_photo.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }
      if (insurancePhoto) {
        const uriParts = insurancePhoto.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('insurance_photo', {
          uri: insurancePhoto,
          name: `insurance_photo.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      const response = await axios.post(`${API_BASE_URL}/driver/license`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.data.profile_completed) {
        Alert.alert('Success', 'Driver profile completed successfully!');
        router.replace('/login');
      }
    } catch (error: any) {
      let errorMessage = 'Failed to complete driver profile.';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Decorative background elements */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#fce7f3', '#ec4899']}
          style={[styles.blob, styles.blob1]}
        />
        <LinearGradient
          colors={['#f47cb8cb', '#f472b6']}
          style={[styles.blob, styles.blob2]}
        />
        <LinearGradient
          colors={['#f472b6', '#d026d3ff']}
          style={[styles.blob, styles.blob3]}
        />
      </View>

      <View style={[styles.floatingElement, styles.floatingTop]}>
        <LinearGradient
          colors={['#ec4899', '#d3269990']}
          style={styles.floatingGradient}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BlurView intensity={20} tint="light" style={styles.card}>
          {/* Decorative corner elements */}
          <View style={[styles.cornerDecor, styles.cornerTopRight]}>
            <LinearGradient
              colors={['#ec489aaf', '#dd82beff']}
              style={styles.cornerGradient}
            />
          </View>
          <View style={[styles.cornerDecor, styles.cornerBottomLeft]}>
            <LinearGradient
              colors={['#f472b6', '#d326ab70']}
              style={styles.cornerGradient}
            />
          </View>

          {/* Logo and branding */}
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <LinearGradient
                colors={['#f677b6b2', '#92286dff', '#f86bbdf8']}
                style={styles.logoGradient}
              >
                <Ionicons name="car-sport" size={48} color="#fefefef8" />
              </LinearGradient>
              <View style={styles.logoShadow} />
            </View>
            <Text style={styles.title}>Complete Driver Profile</Text>
            <Text style={styles.subtitle}>Provide your details to activate your account</Text>
          </View>

          {/* License Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>License Number</Text>
            <Animated.View style={licenseAnimatedStyle}>
              <View style={[styles.inputWrapper, focusedField === 'license' && styles.inputFocused]}>
                <View style={styles.inputContent}>
                  <Ionicons name="document-text" size={20} color="#46042295" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your license number"
                    placeholderTextColor="#9ca3af"
                    value={licenseNumber}
                    onChangeText={setLicenseNumber}
                    accessible={true}
                    accessibilityLabel="License number"
                    accessibilityHint="Enter your driver's license number"
                    onFocus={() => { setFocusedField('license'); licenseScale.value = 1.02; }}
                    onBlur={() => { setFocusedField(null); licenseScale.value = 1; }}
                  />
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Vehicle Type Dropdown */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Vehicle Type</Text>
            <DropDownPicker
              open={open}
              value={vehicleType}
              items={items}
              setOpen={setOpen}
              setValue={setVehicleType}
              setItems={setItems}
              placeholder="Select your vehicle brand"
              searchable={true}
              searchPlaceholder="Search for a brand..."
              listMode="MODAL"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              textStyle={styles.dropdownText}
              placeholderStyle={styles.dropdownPlaceholder}
              searchTextInputStyle={styles.dropdownSearchInput}
            />
          </View>

          {/* Vehicle Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Vehicle Number</Text>
            <Animated.View style={vehicleNumberAnimatedStyle}>
              <View style={[styles.inputWrapper, focusedField === 'vehicleNumber' && styles.inputFocused]}>
                <View style={styles.inputContent}>
                  <Ionicons name="car" size={20} color="#46042295" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your vehicle number"
                    placeholderTextColor="#9ca3af"
                    value={vehicleNumber}
                    onChangeText={setVehicleNumber}
                    accessible={true}
                    accessibilityLabel="Vehicle number"
                    accessibilityHint="Enter your vehicle registration number"
                    onFocus={() => { setFocusedField('vehicleNumber'); vehicleNumberScale.value = 1.02; }}
                    onBlur={() => { setFocusedField(null); vehicleNumberScale.value = 1; }}
                  />
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Photos Section Header */}
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={['#e361a280', '#ab1275bd']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sectionHeaderGradient}
            >
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.sectionHeaderText}>Vehicle Photos</Text>
            </LinearGradient>
          </View>

          {/* Car Photo */}
          <PhotoUpload
            label="Car Photo"
            photo={carPhoto}
            onPress={() => pickImage(setCarPhoto)}
          />

          <PhotoUpload
            label="Car Photo (Front)"
            photo={carPhotoFront}
            onPress={() => pickImage(setCarPhotoFront)}
          />

          <PhotoUpload
            label="Car Photo (Back)"
            photo={carPhotoBack}
            onPress={() => pickImage(setCarPhotoBack)}
          />

          <PhotoUpload
            label="Car Photo (Left)"
            photo={carPhotoLeft}
            onPress={() => pickImage(setCarPhotoLeft)}
          />

          <PhotoUpload
            label="Car Photo (Right)"
            photo={carPhotoRight}
            onPress={() => pickImage(setCarPhotoRight)}
          />

          {/* Documents Section Header */}
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={['#e361a280', '#ab1275bd']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sectionHeaderGradient}
            >
              <Ionicons name="document" size={20} color="#fff" />
              <Text style={styles.sectionHeaderText}>Documents</Text>
            </LinearGradient>
          </View>

          <PhotoUpload
            label="License Photo"
            photo={licensePhoto}
            onPress={() => pickImage(setLicensePhoto)}
          />

          <PhotoUpload
            label="ID Photo"
            photo={idPhoto}
            onPress={() => pickImage(setIdPhoto)}
          />

          <PhotoUpload
            label="Insurance Photo"
            photo={insurancePhoto}
            onPress={() => pickImage(setInsurancePhoto)}
          />

          {/* Complete Profile Button */}
          <Animated.View style={buttonAnimatedStyle}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPressIn={() => (buttonScale.value = 0.95)}
              onPressOut={() => (buttonScale.value = 1)}
              onPress={handleCompleteProfile}
              disabled={isLoading}
              accessible={true}
              accessibilityLabel="Complete profile"
              accessibilityRole="button"
              accessibilityState={{ disabled: isLoading }}
            >
              <LinearGradient
                colors={['#e361a280', '#ab1275bd', '#f985c1c3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButton}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.submitButtonText}>Processing...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>Complete Profile</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Photo Upload Component
function PhotoUpload({ label, photo, onPress }: { label: string; photo: string | null; onPress: () => void }) {
  return (
    <View style={styles.photoContainer}>
      <Text style={styles.photoLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={onPress}
        accessible={true}
        accessibilityLabel={`Upload ${label}`}
        accessibilityRole="button"
      >
        <LinearGradient
          colors={photo ? ['#671344ff', '#7c0a52ff'] : ['#e361a280', '#ab1275bd']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.uploadButtonGradient}
        >
          <Ionicons name="cloud-upload" size={20} color="#fff" />
          <Text style={styles.uploadButtonText}>{photo ? 'Change Photo' : 'Choose Photo'}</Text>
        </LinearGradient>
      </TouchableOpacity>
      {photo ? (
        <View style={styles.photoPreviewContainer}>
          <Image source={{ uri: photo }} style={styles.uploadPreview} resizeMode="cover" />
          <View style={styles.photoCheckmark}>
            <Ionicons name="checkmark-circle" size={32} color="#10b981" />
          </View>
        </View>
      ) : (
        <View style={styles.noPhotoContainer}>
          <Ionicons name="image-outline" size={40} color="#9ca3af" />
          <Text style={styles.noPhotoText}>No photo uploaded</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf4ff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 40,
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
  floatingElement: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
  },
  floatingTop: {
    top: 60,
    right: 20,
    transform: [{ rotate: '12deg' }],
  },
  floatingGradient: {
    flex: 1,
    opacity: 0.6,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    borderRadius: 30,
    padding: 30,
    shadowColor: '#923563ff',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 1,
    overflow: 'hidden',
    borderWidth: 12,
    borderColor: 'rgba(244, 126, 185, 0.2)',
  },
  cornerDecor: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 15,
    overflow: 'hidden',
    opacity: 0.6,
  },
  cornerTopRight: {
    top: -20,
    right: -20,
    transform: [{ rotate: '12deg' }],
  },
  cornerBottomLeft: {
    bottom: -15,
    left: -15,
    transform: [{ rotate: '-12deg' }],
  },
  cornerGradient: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ec489a74',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
  },
  logoShadow: {
    position: 'absolute',
    bottom: -10,
    left: 10,
    right: 10,
    height: 20,
    backgroundColor: '#ec489ab9',
    borderRadius: 50,
    opacity: 0.3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#440b24ff',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b1839',
    textAlign: 'center',
  },
  sectionHeader: {
    marginTop: 25,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a0e28',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#ffffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fce7f3',
    shadowColor: '#ec489a96',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  inputFocused: {
    borderColor: '#f96db8d3',
    shadowColor: '#e53e94ff',
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#1f1f1f',
  },
  dropdown: {
    borderColor: '#fce7f3',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 15,
    minHeight: 52,
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderColor: '#fce7f3',
    borderRadius: 16,
  },
  dropdownText: {
    fontSize: 16,
    color: '#1f1f1f',
  },
  dropdownPlaceholder: {
    color: '#9ca3af',
  },
  dropdownSearchInput: {
    borderColor: '#fce7f3',
    color: '#1f1f1f',
  },
  photoContainer: {
    marginBottom: 20,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a0e28',
    marginBottom: 10,
  },
  uploadButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#ec489a96',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  photoPreviewContainer: {
    position: 'relative',
  },
  uploadPreview: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fce7f3',
  },
  photoCheckmark: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  noPhotoContainer: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fce7f3',
    borderStyle: 'dashed',
  },
  noPhotoText: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 8,
  },
  submitButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#3b1324ee',
    shadowOffset: { width: 14, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 15,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});