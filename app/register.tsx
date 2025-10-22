import React, { useState } from 'react';
import { register } from '@/services/AuthService';
import { normalizePhone } from '@/utils/phone';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
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

  // Animated scales
  const nameScale = useSharedValue(1);
  const emailScale = useSharedValue(1);
  const phoneScale = useSharedValue(1);
  const passwordScale = useSharedValue(1);
  const confirmPasswordScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

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

  const handleRegister = async () => {
  if (!name || !email || !password || !confirmPassword) {
    Alert.alert('Error', 'Please fill all required fields.');
    return;
  }
  if (password !== confirmPassword) {
    Alert.alert('Error', 'Passwords do not match.');
    return;
  }

  // Normalize phone number before saving
  const normalizedPhone = normalizePhone(phone);

  setIsLoading(true);
  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', normalizedPhone); // ✅ use normalized phone
    formData.append('password', password);
    formData.append('password_confirmation', confirmPassword);
    formData.append('role', role);
    formData.append('gender', gender || '');

    const response = await register(formData as any);

    if (response.error) {
      Alert.alert('OTP Error', response.error);
    } else if (phone) {
      // ✅ also use normalized phone for OTP
      router.replace(`/verify-otp?phone=${normalizedPhone}&role=${role}`);
    } else {
      Alert.alert('Success', 'Registration completed successfully!');
      router.replace('/login');
    }
  } catch (error: any) {
    let errorMessage = 'Registration failed.';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
    }
    Alert.alert('Error', errorMessage);
  } finally {
    setIsLoading(false);
  }
};


  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.backgroundContainer}>
          <LinearGradient colors={['#fce7f3', '#ec4899']} style={[styles.blob, styles.blob1]} />
          <LinearGradient colors={['#ec4899', '#f472b6']} style={[styles.blob, styles.blob2]} />
          <LinearGradient colors={['#f472b6', '#c026d3']} style={[styles.blob, styles.blob3]} />
        </View>
        <BlurView intensity={80} tint="light" style={styles.card}>
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <LinearGradient colors={['#ec4899', '#c026d3', '#f472b6']} style={styles.logoGradient}>
                <Ionicons name="car" size={48} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your Bella Ride journey today.</Text>
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
                  <Ionicons name="person" size={20} color="#ec4899" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#ec4899"
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
                  <Ionicons name="mail" size={20} color="#ec4899" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor="#ec4899"
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
                  <Ionicons name="call" size={20} color="#ec4899" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="exp:71233456"
                    placeholderTextColor="#da83afc4"
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
                  <Ionicons name="lock-closed" size={20} color="#ec4899" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor="#ec4899"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => { setFocusedField('password'); passwordScale.value = 1.02; }}
                    onBlur={() => { setFocusedField(null); passwordScale.value = 1; }}
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#ec4899" />
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
                  <Ionicons name="lock-closed" size={20} color="#ec4899" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Confirm your password"
                    placeholderTextColor="#ec4899"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    onFocus={() => { setFocusedField('confirmPassword'); confirmPasswordScale.value = 1.02; }}
                    onBlur={() => { setFocusedField(null); confirmPasswordScale.value = 1; }}
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#ec4899" />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </View>
          {/* Create Account Button */}
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
  genderContainer: { flexDirection: 'row', gap: 8 },
  genderOption: { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#fce7f3', backgroundColor: '#fff' },
  genderOptionActive: { backgroundColor: '#ec4899', borderColor: '#ec4899' },
  genderOptionText: { color: '#831843', fontWeight: '600' },
  genderOptionTextActive: { color: '#fff' },
  container: { flex: 1, backgroundColor: '#fdf4ff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20, minHeight: height },
  backgroundContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
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
  signInButton: { paddingVertical:18, borderRadius:16, alignItems:'center', marginBottom:25, shadowColor:'#8b5cf6', shadowOffset:{width:0,height:10}, shadowOpacity:1, shadowRadius:20, elevation:15 },
  signInText: { fontSize:18, fontWeight:'bold', color:'#db6ef3ff' },
  signUpContainer: { flexDirection:'row', justifyContent:'center', alignItems:'center' },
  signUpText: { fontSize:14, color:'#6b7280' },
  signUpLink: { fontSize:14, fontWeight:'bold', color:'#8b5cf6' },
});