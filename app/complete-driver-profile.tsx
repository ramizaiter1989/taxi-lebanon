import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { API_BASE_URL } from "../constants/config";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import DropDownPicker from 'react-native-dropdown-picker';

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
  const [open, setOpen] = useState(false);
const [value, setValue] = useState(null);
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
      const token = await AsyncStorage.getItem('token');
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
        formData.append('car_photo_front', {
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <BlurView intensity={80} tint="light" style={styles.card}>
          <Text style={styles.title}>Complete Driver Profile</Text>
          <Text style={styles.subtitle}>Please provide your details to activate your account.</Text>

          {/* License Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>License Number</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputContent}>
                <Ionicons name="document-text" size={20} color="#ec4899" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your license number"
                  placeholderTextColor="#ec4899"
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                />
              </View>
            </View>
          </View>

          {/* Vehicle Type */}
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
    listMode="MODAL"  // Opens in modal for better UX
    style={{ borderColor: '#fce7f3', backgroundColor: '#fff' }}
    dropDownContainerStyle={{ backgroundColor: '#fff', borderColor: '#fce7f3' }}
  />
</View>

          {/* Vehicle Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Vehicle Number</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputContent}>
                <Ionicons name="car" size={20} color="#ec4899" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your vehicle number"
                  placeholderTextColor="#ec4899"
                  value={vehicleNumber}
                  onChangeText={setVehicleNumber}
                />
              </View>
            </View>
          </View>

          {/* Car Photo Front */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Car Photo </Text>
            <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setCarPhoto)}>
              <Ionicons name="cloud-upload" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.uploadButtonText}>{carPhoto ? 'Change Photo' : 'Choose Photo'}</Text>
            </TouchableOpacity>
            {carPhoto ? (
              <Image source={{ uri: carPhoto }} style={styles.uploadPreview} resizeMode="cover" />
            ) : (
              <View style={styles.noPhotoContainer}>
                <Ionicons name="image-outline" size={40} color="#9ca3af" />
                <Text style={styles.noPhotoText}>No photo uploaded</Text>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Car Photo (Front)</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setCarPhotoFront)}>
              <Ionicons name="cloud-upload" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.uploadButtonText}>{carPhotoFront ? 'Change Photo' : 'Choose Photo'}</Text>
            </TouchableOpacity>
            {carPhotoFront ? (
              <Image source={{ uri: carPhotoFront }} style={styles.uploadPreview} resizeMode="cover" />
            ) : (
              <View style={styles.noPhotoContainer}>
                <Ionicons name="image-outline" size={40} color="#9ca3af" />
                <Text style={styles.noPhotoText}>No photo uploaded</Text>
              </View>
            )}
          </View>

          {/* Car Photo Back */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Car Photo (Back)</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setCarPhotoBack)}>
              <Ionicons name="cloud-upload" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.uploadButtonText}>{carPhotoBack ? 'Change Photo' : 'Choose Photo'}</Text>
            </TouchableOpacity>
            {carPhotoBack ? (
              <Image source={{ uri: carPhotoBack }} style={styles.uploadPreview} resizeMode="cover" />
            ) : (
              <View style={styles.noPhotoContainer}>
                <Ionicons name="image-outline" size={40} color="#9ca3af" />
                <Text style={styles.noPhotoText}>No photo uploaded</Text>
              </View>
            )}
          </View>

          {/* Car Photo Left */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Car Photo (Left)</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setCarPhotoLeft)}>
              <Ionicons name="cloud-upload" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.uploadButtonText}>{carPhotoLeft ? 'Change Photo' : 'Choose Photo'}</Text>
            </TouchableOpacity>
            {carPhotoLeft ? (
              <Image source={{ uri: carPhotoLeft }} style={styles.uploadPreview} resizeMode="cover" />
            ) : (
              <View style={styles.noPhotoContainer}>
                <Ionicons name="image-outline" size={40} color="#9ca3af" />
                <Text style={styles.noPhotoText}>No photo uploaded</Text>
              </View>
            )}
          </View>

          {/* Car Photo Right */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Car Photo (Right)</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setCarPhotoRight)}>
              <Ionicons name="cloud-upload" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.uploadButtonText}>{carPhotoRight ? 'Change Photo' : 'Choose Photo'}</Text>
            </TouchableOpacity>
            {carPhotoRight ? (
              <Image source={{ uri: carPhotoRight }} style={styles.uploadPreview} resizeMode="cover" />
            ) : (
              <View style={styles.noPhotoContainer}>
                <Ionicons name="image-outline" size={40} color="#9ca3af" />
                <Text style={styles.noPhotoText}>No photo uploaded</Text>
              </View>
            )}
          </View>

          {/* License Photo */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>License Photo</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setLicensePhoto)}>
              <Ionicons name="cloud-upload" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.uploadButtonText}>{licensePhoto ? 'Change Photo' : 'Choose Photo'}</Text>
            </TouchableOpacity>
            {licensePhoto ? (
              <Image source={{ uri: licensePhoto }} style={styles.uploadPreview} resizeMode="cover" />
            ) : (
              <View style={styles.noPhotoContainer}>
                <Ionicons name="image-outline" size={40} color="#9ca3af" />
                <Text style={styles.noPhotoText}>No photo uploaded</Text>
              </View>
            )}
          </View>

          {/* ID Photo */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>ID Photo</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setIdPhoto)}>
              <Ionicons name="cloud-upload" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.uploadButtonText}>{idPhoto ? 'Change Photo' : 'Choose Photo'}</Text>
            </TouchableOpacity>
            {idPhoto ? (
              <Image source={{ uri: idPhoto }} style={styles.uploadPreview} resizeMode="cover" />
            ) : (
              <View style={styles.noPhotoContainer}>
                <Ionicons name="image-outline" size={40} color="#9ca3af" />
                <Text style={styles.noPhotoText}>No photo uploaded</Text>
              </View>
            )}
          </View>

          {/* Insurance Photo */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Insurance Photo</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setInsurancePhoto)}>
              <Ionicons name="cloud-upload" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.uploadButtonText}>{insurancePhoto ? 'Change Photo' : 'Choose Photo'}</Text>
            </TouchableOpacity>
            {insurancePhoto ? (
              <Image source={{ uri: insurancePhoto }} style={styles.uploadPreview} resizeMode="cover" />
            ) : (
              <View style={styles.noPhotoContainer}>
                <Ionicons name="image-outline" size={40} color="#9ca3af" />
                <Text style={styles.noPhotoText}>No photo uploaded</Text>
              </View>
            )}
          </View>

          {/* Complete Profile Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCompleteProfile}
            disabled={isLoading}
          >
            <LinearGradient colors={['#ec4899', '#8b5cf6', '#3b82f6']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.signInButton}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signInText}>Complete Profile</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf4ff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20, minHeight: height },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 30,
    padding: 30,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.2)',
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#831843', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#9d174d', marginBottom: 20 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#831843', marginBottom: 8 },
  inputWrapper: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fce7f3',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  inputContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 16, color: '#831843' },
  uploadButton: {
    backgroundColor: '#ec4899',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  uploadButtonText: { color: '#fff', fontWeight: '600' },
  uploadPreview: { width: '100%', height: 150, borderRadius: 12, marginTop: 8 },
  noPhotoContainer: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  noPhotoText: { color: '#9ca3af', fontSize: 14, marginTop: 8 },
  signInButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  signInText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
});
