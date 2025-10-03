// app/(auth)/register.tsx
import React, { useState } from 'react';
import { register } from '@/services/AuthService';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const { width, height } = Dimensions.get('window');


export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'passenger' | 'driver'>('passenger');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Driver-specific fields
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [carPhotoFront, setCarPhotoFront] = useState<string | null>(null);
  const [carPhotoBack, setCarPhotoBack] = useState<string | null>(null);
  const [carPhotoLeft, setCarPhotoLeft] = useState<string | null>(null);
  const [carPhotoRight, setCarPhotoRight] = useState<string | null>(null);
  const [licenseImage, setLicenseImage] = useState<string | null>(null);
  const [idImage, setIdImage] = useState<string | null>(null);
  const [insuranceImage, setInsuranceImage] = useState<string | null>(null);

  // Animated scales
  const nameScale = useSharedValue(1);
  const emailScale = useSharedValue(1);
  const phoneScale = useSharedValue(1);
  const passwordScale = useSharedValue(1);
  const confirmPasswordScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const licenseNumberScale = useSharedValue(1);
  const vehicleNumberScale = useSharedValue(1);

  // Create all animated styles at the top level
  const nameAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(nameScale.value) }]
  }));

  const emailAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(emailScale.value) }]
  }));

  const phoneAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(phoneScale.value) }]
  }));

  const passwordAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(passwordScale.value) }]
  }));

  const confirmPasswordAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(confirmPasswordScale.value) }]
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(buttonScale.value) }]
  }));

  const licenseNumberAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(licenseNumberScale.value) }]
  }));

  const vehicleNumberAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(vehicleNumberScale.value) }]
  }));

  const handleRegister = async () => {
  if (!name || !email || !password || !confirmPassword) {
    Alert.alert('Error', 'Please fill all required fields.');
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert('Error', 'Passwords do not match.');
    return;
  }

  if (
    role === 'driver' &&
    (!licenseNumber ||
      !vehicleNumber ||
      !carPhotoFront ||
      !carPhotoBack ||
      !carPhotoLeft ||
      !carPhotoRight ||
      !licenseImage ||
      !idImage ||
      !insuranceImage)
  ) {
    Alert.alert('Error', 'Please complete all driver details and upload all required photos.');
    return;
  }

  setIsLoading(true);

  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('password', password);
    formData.append('password_confirmation', confirmPassword);
    formData.append('role', role);
    formData.append('gender', gender || '');

    if (role === 'driver') {
      formData.append('license_number', licenseNumber);
      formData.append('vehicle_number', vehicleNumber);

      const appendImage = (uri: string, fieldName: string) => {
        const uriParts = uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append(fieldName, {
          uri,
          name: `${fieldName}.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      };

      if (carPhotoFront) appendImage(carPhotoFront, 'car_photo_front');
      if (carPhotoBack) appendImage(carPhotoBack, 'car_photo_back');
      if (carPhotoLeft) appendImage(carPhotoLeft, 'car_photo_left');
      if (carPhotoRight) appendImage(carPhotoRight, 'car_photo_right');
      if (licenseImage) appendImage(licenseImage, 'license_image');
      if (idImage) appendImage(idImage, 'id_image');
      if (insuranceImage) appendImage(insuranceImage, 'insurance_image');
    }

    const response = await register(formData as any);
    console.log('Register response:', response);

    // ✅ Redirect to verify-otp page automatically if phone is provided
    if (phone) {
      router.replace(`/verify-otp?phone=${phone.trim()}&role=${role}`);
    } else {
      Alert.alert('Success', 'Registration completed successfully!');
      router.replace('/login');
    }
  } catch (error: any) {
    let errorMessage = 'Registration failed.';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    }
    Alert.alert('Error', errorMessage);
  } finally {
    setIsLoading(false);
  }
};




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

  const ImageUploadSection = ({ 
    label, 
    image, 
    onPress 
  }: { 
    label: string; 
    image: string | null; 
    onPress: () => void;
  }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={onPress}>
        <Ionicons name="cloud-upload" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.uploadButtonText}>{image ? 'Change Photo' : 'Choose Photo'}</Text>
      </TouchableOpacity>
      {image ? (
        <Image source={{ uri: image }} style={styles.uploadPreview} resizeMode="cover" />
      ) : (
        <View style={styles.noPhotoContainer}>
          <Ionicons name="image-outline" size={40} color="#9ca3af" />
          <Text style={styles.noPhotoText}>No photo uploaded</Text>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.backgroundContainer}>
          <LinearGradient colors={['#a855f7', '#ec4899']} style={[styles.blob, styles.blob1]} />
          <LinearGradient colors={['#ec4899', '#3b82f6']} style={[styles.blob, styles.blob2]} />
          <LinearGradient colors={['#3b82f6', '#8b5cf6']} style={[styles.blob, styles.blob3]} />
        </View>

        <BlurView intensity={80} tint="light" style={styles.card}>
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <LinearGradient colors={['#ec4899', '#8b5cf6', '#3b82f6']} style={styles.logoGradient}>
                <Ionicons name="car" size={48} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your SafeRide journey today.</Text>
          </View>

          {/* Role Selection */}
          <View style={styles.optionsRow}>
            <TouchableOpacity style={[styles.roleButton, role === 'passenger' && styles.roleButtonActive]} onPress={() => setRole('passenger')}>
              <Ionicons name="people" size={20} color={role === 'passenger' ? '#fff' : '#9ca3af'} />
              <Text style={[styles.roleText, role === 'passenger' && styles.roleTextActive]}>Passenger</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roleButton, role === 'driver' && styles.roleButtonActive]} onPress={() => setRole('driver')}>
              <Ionicons name="car" size={20} color={role === 'driver' ? '#fff' : '#9ca3af'} />
              <Text style={[styles.roleText, role === 'driver' && styles.roleTextActive]}>Driver</Text>
            </TouchableOpacity>
          </View>

          {/* Common Inputs */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <Animated.View style={nameAnimatedStyle}>
              <View style={[styles.inputWrapper, focusedField === 'name' && styles.inputFocused]}>
                <View style={styles.inputContent}>
                  <Ionicons name="person" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9ca3af"
                    value={name}
                    onChangeText={setName}
                    onFocus={() => { setFocusedField('name'); nameScale.value = 1.02; }}
                    onBlur={() => { setFocusedField(null); nameScale.value = 1; }}
                  />
                </View>
              </View>
            </Animated.View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <Animated.View style={emailAnimatedStyle}>
              <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputFocused]}>
                <View style={styles.inputContent}>
                  <Ionicons name="mail" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => { setFocusedField('email'); emailScale.value = 1.02; }}
                    onBlur={() => { setFocusedField(null); emailScale.value = 1; }}
                  />
                </View>
              </View>
            </Animated.View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number (Optional)</Text>
            <Animated.View style={phoneAnimatedStyle}>
              <View style={[styles.inputWrapper, focusedField === 'phone' && styles.inputFocused]}>
                <View style={styles.inputContent}>
                  <Ionicons name="call" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#9ca3af"
                    value={phone}
                    onChangeText={(text) => setPhone(text.trim())}
                    keyboardType="phone-pad"
                    onFocus={() => { setFocusedField('phone'); phoneScale.value = 1.02; }}
                    onBlur={() => { setFocusedField(null); phoneScale.value = 1; }}
                  />
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Gender */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender (Optional)</Text>
            <View style={styles.genderContainer}>
              {['male', 'female', 'other'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderOption, gender === g && styles.genderOptionActive]}
                  onPress={() => setGender(g as 'male' | 'female' | 'other')}
                >
                  <Text style={[styles.genderOptionText, gender === g && styles.genderOptionTextActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <Animated.View style={passwordAnimatedStyle}>
              <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputFocused]}>
                <View style={styles.inputContent}>
                  <Ionicons name="lock-closed" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => { setFocusedField('password'); passwordScale.value = 1.02; }}
                    onBlur={() => { setFocusedField(null); passwordScale.value = 1; }}
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <Animated.View style={confirmPasswordAnimatedStyle}>
              <View style={[styles.inputWrapper, focusedField === 'confirmPassword' && styles.inputFocused]}>
                <View style={styles.inputContent}>
                  <Ionicons name="lock-closed" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9ca3af"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    onFocus={() => { setFocusedField('confirmPassword'); confirmPasswordScale.value = 1.02; }}
                    onBlur={() => { setFocusedField(null); confirmPasswordScale.value = 1; }}
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Driver-specific Inputs */}
          {role === 'driver' && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>License Number</Text>
                <Animated.View style={licenseNumberAnimatedStyle}>
                  <View style={[styles.inputWrapper, focusedField === 'licenseNumber' && styles.inputFocused]}>
                    <View style={styles.inputContent}>
                      <Ionicons name="document-text" size={20} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your license number"
                        placeholderTextColor="#9ca3af"
                        value={licenseNumber}
                        onChangeText={setLicenseNumber}
                        onFocus={() => { setFocusedField('licenseNumber'); licenseNumberScale.value = 1.02; }}
                        onBlur={() => { setFocusedField(null); licenseNumberScale.value = 1; }}
                      />
                    </View>
                  </View>
                </Animated.View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Vehicle Number</Text>
                <Animated.View style={vehicleNumberAnimatedStyle}>
                  <View style={[styles.inputWrapper, focusedField === 'vehicleNumber' && styles.inputFocused]}>
                    <View style={styles.inputContent}>
                      <Ionicons name="car" size={20} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your vehicle number"
                        placeholderTextColor="#9ca3af"
                        value={vehicleNumber}
                        onChangeText={setVehicleNumber}
                        onFocus={() => { setFocusedField('vehicleNumber'); vehicleNumberScale.value = 1.02; }}
                        onBlur={() => { setFocusedField(null); vehicleNumberScale.value = 1; }}
                      />
                    </View>
                  </View>
                </Animated.View>
              </View>

              {/* Car Photos Section */}
              <View style={styles.sectionHeader}>
                <Ionicons name="car-sport" size={24} color="#8b5cf6" />
                <Text style={styles.sectionTitle}>Vehicle Photos (All 4 Sides)</Text>
              </View>

              <ImageUploadSection 
                label="Car Photo - Front" 
                image={carPhotoFront} 
                onPress={() => pickImage(setCarPhotoFront)} 
              />

              <ImageUploadSection 
                label="Car Photo - Back" 
                image={carPhotoBack} 
                onPress={() => pickImage(setCarPhotoBack)} 
              />

              <ImageUploadSection 
                label="Car Photo - Left Side" 
                image={carPhotoLeft} 
                onPress={() => pickImage(setCarPhotoLeft)} 
              />

              <ImageUploadSection 
                label="Car Photo - Right Side" 
                image={carPhotoRight} 
                onPress={() => pickImage(setCarPhotoRight)} 
              />

              {/* Documents Section */}
              <View style={styles.sectionHeader}>
                <Ionicons name="documents" size={24} color="#8b5cf6" />
                <Text style={styles.sectionTitle}>Required Documents</Text>
              </View>

              <ImageUploadSection 
                label="Driver License Photo" 
                image={licenseImage} 
                onPress={() => pickImage(setLicenseImage)} 
              />

              <ImageUploadSection 
                label="ID Photo" 
                image={idImage} 
                onPress={() => pickImage(setIdImage)} 
              />

              <ImageUploadSection 
                label="Insurance Photo" 
                image={insuranceImage} 
                onPress={() => pickImage(setInsuranceImage)} 
              />
            </>
          )}

          {/* Register Button */}
          <Animated.View style={buttonAnimatedStyle}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPressIn={() => (buttonScale.value = 0.95)}
              onPressOut={() => (buttonScale.value = 1)}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <LinearGradient colors={['#ec4899', '#8b5cf6', '#3b82f6']} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.signInButton}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.signInText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Sign In Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.signUpLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  genderContainer: { flexDirection:'row', gap:8 },
  genderOption: { flex:1, borderRadius:16, padding:12, alignItems:'center', borderWidth:1, borderColor:'#e5e7eb', backgroundColor:'#fff' },
  genderOptionActive: { backgroundColor:'#8b5cf6', borderColor:'#8b5cf6' },
  genderOptionText: { color:'#374151', fontWeight:'600' },
  genderOptionTextActive: { color:'#fff' },
  uploadButton: { backgroundColor:'#8b5cf6', padding:12, borderRadius:12, alignItems:'center', marginTop:8, flexDirection: 'row', justifyContent: 'center' },
  uploadButtonText: { color:'#fff', fontWeight:'600' },
  uploadPreview: { width:'100%', height:150, borderRadius:12, marginTop:8 },
  noPhotoContainer: { width:'100%', height:150, borderRadius:12, marginTop:8, backgroundColor:'#f3f4f6', justifyContent:'center', alignItems:'center', borderWidth:2, borderColor:'#e5e7eb', borderStyle:'dashed' },
  noPhotoText: { color:'#9ca3af', fontSize:14, marginTop:8 },
  sectionHeader: { flexDirection:'row', alignItems:'center', gap:10, marginTop:20, marginBottom:15, paddingBottom:10, borderBottomWidth:1, borderBottomColor:'#e5e7eb' },
  sectionTitle: { fontSize:18, fontWeight:'bold', color:'#374151' },

  container: { flex: 1, backgroundColor: '#f8f9ff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20, minHeight: height },
  backgroundContainer: { position: 'absolute', top:0, left:0, right:0, bottom:0 },
  blob: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.3 },
  blob1: { top: 80, left: -100 },
  blob2: { top: 150, right: -120 },
  blob3: { bottom: 100, left: width/3 },
  card: { backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 30, padding: 30, shadowColor:'#000', shadowOffset:{width:0,height:20}, shadowOpacity:0.25, shadowRadius:30, elevation:20, overflow:'hidden' },
  logoContainer: { alignItems:'center', marginBottom:30 },
  logoWrapper: { position:'relative', marginBottom:15 },
  logoGradient: { width:100, height:100, borderRadius:25, justifyContent:'center', alignItems:'center', shadowColor:'#8b5cf6', shadowOffset:{width:0,height:15}, shadowOpacity:0.4, shadowRadius:25, elevation:15 },
  title: { fontSize:32, fontWeight:'bold', color:'#8b5cf6', marginBottom:5 },
  subtitle: { fontSize:14, color:'#6b7280' },
  inputContainer: { marginBottom:20 },
  label: { fontSize:14, fontWeight:'600', color:'#374151', marginBottom:8 },
  inputWrapper: { backgroundColor:'#fff', borderRadius:16, borderWidth:1, borderColor:'#e5e7eb', shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.1, shadowRadius:10, elevation:5 },
  inputFocused: { borderColor:'#8b5cf6', shadowColor:'#8b5cf6', shadowOpacity:0.3, shadowRadius:15, elevation:10 },
  inputContent: { flexDirection:'row', alignItems:'center', paddingHorizontal:15 },
  inputIcon: { marginRight:10 },
  input: { flex:1, paddingVertical:15, fontSize:16, color:'#1f2937' },
  passwordInput: { paddingRight:45 },
  eyeButton: { position:'absolute', right:15, padding:5 },
  optionsRow: { flexDirection:'row', justifyContent:'space-between', marginBottom:25 },
  roleButton: { flexDirection:'row', alignItems:'center', gap:8, flex:1, padding:12, borderRadius:16, backgroundColor:'#fff', justifyContent:'center', borderWidth:1, borderColor:'#e5e7eb' },
  roleButtonActive: { backgroundColor:'#8b5cf6', borderColor:'#8b5cf6' },
  roleText: { fontSize:14, fontWeight:'600', color:'#374151' },
  roleTextActive: { color:'#fff' },
  signInButton: { paddingVertical:18, borderRadius:16, alignItems:'center', marginBottom:25, shadowColor:'#8b5cf6', shadowOffset:{width:0,height:10}, shadowOpacity:0.5, shadowRadius:20, elevation:15 },
  signInText: { fontSize:18, fontWeight:'bold', color:'#fff' },
  signUpContainer: { flexDirection:'row', justifyContent:'center', alignItems:'center' },
  signUpText: { fontSize:14, color:'#6b7280' },
  signUpLink: { fontSize:14, fontWeight:'bold', color:'#8b5cf6' },
});