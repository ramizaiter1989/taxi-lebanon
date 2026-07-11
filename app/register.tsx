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

    const normalizedPhone = normalizePhone(phone);

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', normalizedPhone);
      formData.append('password', password);
      formData.append('password_confirmation', confirmPassword);
      formData.append('role', role);
      formData.append('gender', gender || '');

      const response = await register(formData as any);

      if (response.error) {
        Alert.alert('OTP Error', response.error);
      } else if (phone) {
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
                <Ionicons name="person-add" size={48} color="#fefefef8" />
              </LinearGradient>
              <View style={styles.logoShadow} />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the She Moves community</Text>
          </View>

          {/* Role Selection */}
          <View style={styles.roleContainer}>
            <Text style={styles.label}>I want to be a</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'passenger' && styles.roleButtonActive]}
                onPress={() => setRole('passenger')}
                accessible={true}
                accessibilityLabel="Select passenger role"
                accessibilityRole="button"
                accessibilityState={{ selected: role === 'passenger' }}
              >
                <LinearGradient
                  colors={role === 'passenger' ? ['#e361a280', '#ab1275bd', '#f985c1c3'] : ['transparent', 'transparent']}
                  style={styles.roleGradient}
                >
                  <Ionicons name="people" size={20} color={role === 'passenger' ? '#fff' : '#46042295'} />
                  <Text style={[styles.roleText, role === 'passenger' && styles.roleTextActive]}>Passenger</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'driver' && styles.roleButtonActive]}
                onPress={() => setRole('driver')}
                accessible={true}
                accessibilityLabel="Select driver role"
                accessibilityRole="button"
                accessibilityState={{ selected: role === 'driver' }}
              >
                <LinearGradient
                  colors={role === 'driver' ? ['#e361a280', '#ab1275bd', '#f985c1c3'] : ['transparent', 'transparent']}
                  style={styles.roleGradient}
                >
                  <Ionicons name="car" size={20} color={role === 'driver' ? '#fff' : '#46042295'} />
                  <Text style={[styles.roleText, role === 'driver' && styles.roleTextActive]}>Driver</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Name input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <Animated.View style={nameAnimatedStyle}>
              <View style={[styles.inputWrapper, focusedField === 'name' && styles.inputFocused]}>
                <View style={styles.inputContent}>
                  <Ionicons name="person" size={20} color="#46042295" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9ca3af"
                    value={name}
                    onChangeText={setName}
                    accessible={true}
                    accessibilityLabel="Full name"
                    accessibilityHint="Enter your full name"
                    onFocus={() => { setFocusedField('name'); nameScale.value = 1.02; }}
                    onBlur={() => { setFocusedField(null); nameScale.value = 1; }}
                  />
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Email input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <Animated.View style={emailAnimatedStyle}>
              <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputFocused]}>
                <View style={styles.inputContent}>
                  <Ionicons name="mail" size={20} color="#46042295" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessible={true}
                    accessibilityLabel="Email address"
                    accessibilityHint="Enter your email address"
                    onFocus={() => { setFocusedField('email'); emailScale.value = 1.02; }}
                    onBlur={() => { setFocusedField(null); emailScale.value = 1; }}
                  />
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Phone input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number (Optional)</Text>
            <Animated.View style={phoneAnimatedStyle}>
              <View style={[styles.inputWrapper, focusedField === 'phone' && styles.inputFocused]}>
                <View style={styles.inputContent}>
                  <Ionicons name="call" size={20} color="#46042295" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="exp: 71233456"
                    placeholderTextColor="#9ca3af"
                    value={phone}
                    onChangeText={(text) => setPhone(text.trim())}
                    keyboardType="phone-pad"
                    accessible={true}
                    accessibilityLabel="Phone number"
                    accessibilityHint="Enter your phone number"
                    onFocus={() => { setFocusedField('phone'); phoneScale.value = 1.02; }}
                    onBlur={() => { setFocusedField(null); phoneScale.value = 1; }}
                  />
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Gender Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender (Optional)</Text>
            <View style={styles.genderContainer}>
              {(['male', 'female', 'other'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderOption, gender === g && styles.genderOptionActive]}
                  onPress={() => setGender(g)}
                  accessible={true}
                  accessibilityLabel={`Select ${g} gender`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: gender === g }}
                >
                  <Text style={[styles.genderOptionText, gender === g && styles.genderOptionTextActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Password input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <Animated.View style={passwordAnimatedStyle}>
              <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputFocused]}>
                <View style={styles.inputContent}>
                  <Ionicons name="lock-closed" size={20} color="#46042295" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    accessible={true}
                    accessibilityLabel="Password"
                    accessibilityHint="Enter your password"
                    onFocus={() => { setFocusedField('password'); passwordScale.value = 1.02; }}
                    onBlur={() => { setFocusedField(null); passwordScale.value = 1; }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    accessible={true}
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                    accessibilityRole="button"
                  >
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#46042295" />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Confirm Password input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <Animated.View style={confirmPasswordAnimatedStyle}>
              <View style={[styles.inputWrapper, focusedField === 'confirmPassword' && styles.inputFocused]}>
                <View style={styles.inputContent}>
                  <Ionicons name="lock-closed" size={20} color="#46042295" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9ca3af"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    accessible={true}
                    accessibilityLabel="Confirm password"
                    accessibilityHint="Re-enter your password"
                    onFocus={() => { setFocusedField('confirmPassword'); confirmPasswordScale.value = 1.02; }}
                    onBlur={() => { setFocusedField(null); confirmPasswordScale.value = 1; }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}
                    accessible={true}
                    accessibilityLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    accessibilityRole="button"
                  >
                    <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#46042295" />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Create Account button */}
          <Animated.View style={buttonAnimatedStyle}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPressIn={() => (buttonScale.value = 0.95)}
              onPressOut={() => (buttonScale.value = 1)}
              onPress={handleRegister}
              disabled={isLoading}
              accessible={true}
              accessibilityLabel="Create account"
              accessibilityRole="button"
              accessibilityState={{ disabled: isLoading }}
            >
              <LinearGradient
                colors={['#e361a280', '#ab1275bd', '#f985c1c3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signInButton}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.signInText}>Creating account...</Text>
                  </View>
                ) : (
                  <Text style={styles.signInText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Sign in link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push('/login')}
              accessible={true}
              accessibilityLabel="Sign in to existing account"
              accessibilityRole="button"
            >
              <Text style={styles.signUpLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </ScrollView>
    </KeyboardAvoidingView>
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
    minHeight: height,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#440b24ff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b1839',
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fce7f3',
    overflow: 'hidden',
    shadowColor: '#ec489a96',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  roleButtonActive: {
    borderColor: '#f96db8d3',
    shadowOpacity: 0.4,
  },
  roleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  roleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4a0e28',
  },
  roleTextActive: {
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
  passwordInput: {
    paddingRight: 45,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fce7f3',
    backgroundColor: '#fff',
    shadowColor: '#ec489a96',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  genderOptionActive: {
    backgroundColor: '#671344ff',
    borderColor: '#7c0a52ff',
  },
  genderOptionText: {
    color: '#4a0e28',
    fontWeight: '600',
    fontSize: 14,
  },
  genderOptionTextActive: {
    color: '#fff',
  },
  signInButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 25,
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
  signInText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: '#371021ff',
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fa2b96ff',
  },
});