import React, { useState } from 'react';
import { API_BASE_URL } from "../constants/config";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizePhone } from '@/utils/phone';

const { width, height } = Dimensions.get('window');
const API_URL = `${API_BASE_URL}/login`;

interface LoginResponse {
  token: string;
  user: {
    phone: string;
    is_verified: any;
    id: number;
    name: string;
    email: string;
    role: 'driver' | 'passenger' | 'admin' | string;
  };
  profile_completed?: boolean;
}

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const emailScale = useSharedValue(1);
  const passwordScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post<LoginResponse>(API_URL, { email, password });
      const { token, user, profile_completed } = response.data;

      // ✅ CRITICAL: Save all user data to AsyncStorage
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user_id', user.id.toString()); // Save user ID
      await AsyncStorage.setItem('user_role', user.role); // Save user role
      await AsyncStorage.setItem('user_name', user.name); // Save user name
      await AsyncStorage.setItem('user_email', user.email || ''); // Save user email
      
      if (rememberMe) {
        await AsyncStorage.setItem('savedEmail', email);
      }

      console.log('✅ User data saved to AsyncStorage:', {
        user_id: user.id,
        user_role: user.role,
        user_name: user.name,
      });

      if (!user.is_verified && user.phone) {
        const normalizedPhone = normalizePhone(user.phone);
        router.replace(`/verify-otp?phone=${normalizedPhone}&role=${user.role}`);
        return; // stop further navigation
      }

      Alert.alert('Success', `Welcome back, ${user.name}! 🎉`);

      if (user.role === 'passenger') {
        router.replace('/(client)/home');
      } else if (user.role === 'driver') {
        if (profile_completed === false) {
          router.replace('/complete-driver-profile');
        } else {
          router.replace('/(rider)/home');
        }
      } else if (user.role === 'admin') {
        router.replace('/(admin)/home');
      } else {
        Alert.alert('Error', 'Unknown user role.');
      }
    } catch (error) {
      let errorMessage = 'Login failed. Please check your credentials.';
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage = 'Invalid email or password.';
        } else if (error.response?.status === 403) {
          errorMessage = error.response.data.message || 'Access denied.';
        } else if (error.response?.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = error.response?.data?.message || error.message;
        }
      }
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const emailAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(emailScale.value) }],
  }));

  const passwordAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(passwordScale.value) }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(buttonScale.value) }],
  }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Background and UI elements remain the same */}
        <View style={styles.backgroundContainer}>
          <LinearGradient
            colors={['#fce7f3', '#ec4899']}
            style={[styles.blob, styles.blob1]}
          />
          <LinearGradient
            colors={['#ec4899', '#f472b6']}
            style={[styles.blob, styles.blob2]}
          />
          <LinearGradient
            colors={['#f472b6', '#c026d3']}
            style={[styles.blob, styles.blob3]}
          />
        </View>

        <View style={[styles.floatingElement, styles.floatingTop]}>
          <LinearGradient
            colors={['#ec4899', '#c026d3']}
            style={styles.floatingGradient}
          />
        </View>

        <BlurView intensity={80} tint="light" style={styles.card}>
          <View style={[styles.cornerDecor, styles.cornerTopRight]}>
            <LinearGradient
              colors={['#ec4899', '#c026d3']}
              style={styles.cornerGradient}
            />
          </View>
          <View style={[styles.cornerDecor, styles.cornerBottomLeft]}>
            <LinearGradient
              colors={['#f472b6', '#c026d3']}
              style={styles.cornerGradient}
            />
          </View>

          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <LinearGradient
                colors={['#ec4899', '#c026d3', '#f472b6']}
                style={styles.logoGradient}
              >
                <Ionicons name="car" size={48} color="#fff" />
              </LinearGradient>
              <View style={styles.logoShadow} />
            </View>
            <Text style={styles.title}>Bella Ride</Text>
            <Text style={styles.subtitle}>Your trusted women's taxi service</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <Animated.View style={[emailAnimatedStyle]}>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === 'email' && styles.inputFocused,
                ]}
              >
                <View style={styles.inputContent}>
                  <Ionicons
                    name="mail"
                    size={20}
                    color="#ec4899"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor="#ec4899"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => {
                      setFocusedField('email');
                      emailScale.value = 1.02;
                    }}
                    onBlur={() => {
                      setFocusedField(null);
                      emailScale.value = 1;
                    }}
                  />
                </View>
              </View>
            </Animated.View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <Animated.View style={[passwordAnimatedStyle]}>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === 'password' && styles.inputFocused,
                ]}
              >
                <View style={styles.inputContent}>
                  <Ionicons
                    name="lock-closed"
                    size={20}
                    color="#ec4899"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor="#ec4899"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => {
                      setFocusedField('password');
                      passwordScale.value = 1.02;
                    }}
                    onBlur={() => {
                      setFocusedField(null);
                      passwordScale.value = 1;
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#ec4899"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </View>

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberMe}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View
                style={[
                  styles.checkbox,
                  rememberMe && styles.checkboxChecked,
                ]}
              >
                {rememberMe && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace('/forgot-password')}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <Animated.View style={buttonAnimatedStyle}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPressIn={() => (buttonScale.value = 0.95)}
              onPressOut={() => (buttonScale.value = 1)}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#ec4899', '#c026d3', '#f472b6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signInButton}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.signInText}>Signing in...</Text>
                  </View>
                ) : (
                  <Text style={styles.signInText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Alert.alert('Coming Soon', 'Google login will be available soon!')}
            >
              <View style={styles.socialContent}>
                <Text style={styles.googleText}>G</Text>
                <Text style={styles.socialLabel}>Google</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton]}
              onPress={() => Alert.alert('Coming Soon', 'Apple login will be available soon!')}
            >
              <View style={styles.socialContent}>
                <Ionicons name="logo-apple" size={20} color="#fff" />
                <Text style={[styles.socialLabel, styles.appleLabelText]}>
                  Apple
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </BlurView>

        <View style={[styles.badge, styles.verifiedBadge]}>
          <LinearGradient
            colors={['#ec4899', '#c026d3']}
            style={styles.badgeGradient}
          >
            <Text style={styles.badgeText}>✓ Verified</Text>
          </LinearGradient>
        </View>
        <View style={[styles.badge, styles.secureBadge]}>
          <LinearGradient
            colors={['#f472b6', '#c026d3']}
            style={styles.badgeGradient}
          >
            <Text style={styles.badgeText}>🔒 Secure</Text>
          </LinearGradient>
        </View>
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
    marginBottom: 30,
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
    shadowColor: '#ec4899',
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
    backgroundColor: '#ec4899',
    borderRadius: 50,
    opacity: 0.3,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#831843',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#9d174d',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
    marginBottom: 8,
  },
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
  inputFocused: {
    borderColor: '#ec4899',
    shadowColor: '#ec4899',
    shadowOpacity: 0.3,
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
    color: '#831843',
  },
  passwordInput: {
    paddingRight: 45,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
  },
  rememberText: {
    fontSize: 14,
    color: '#831843',
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ec4899',
  },
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#fce7f3',
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 13,
    color: '#9d174d',
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 25,
  },
  socialButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fce7f3',
    paddingVertical: 12,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  appleButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  socialContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  googleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ec4899',
  },
  socialLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#831843',
  },
  appleLabelText: {
    color: '#fff',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: '#9d174d',
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ec4899',
  },
  badge: {
    position: 'absolute',
    borderRadius: 20,
    overflow: 'hidden',
  },
  verifiedBadge: {
    top: 40,
    left: width / 4,
    transform: [{ rotate: '-12deg' }],
  },
  secureBadge: {
    bottom: height / 3,
    right: width / 4,
    transform: [{ rotate: '12deg' }],
  },
  badgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
});
