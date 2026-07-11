import React, { useState, useRef } from 'react';
import { normalizePhone } from '@/utils/phone';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { verifyOtp, resendOtp } from '@/services/AuthService';

const { width, height } = Dimensions.get('window');

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string; role: string }>();
  const phone = params.phone || '';
  const role = params.role || '';

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<boolean>(false);

  // Animated scales
  const codeScale = useSharedValue(1);
  const verifyButtonScale = useSharedValue(1);

  const codeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(codeScale.value) }]
  }));
  const verifyButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(verifyButtonScale.value) }]
  }));

  const handleVerifyOtp = async () => {
    if (!code) {
      Alert.alert('Error', 'Please enter the OTP code.');
      return;
    }

    console.log("Sending OTP payload:", { phone, code });

    setIsLoading(true);

    try {
      const payload = {
        phone: phone.trim(),
        code: code.trim(),
      };

      const response = await verifyOtp(payload);
      console.log('helo', response);

      if (response?.message) {
        Alert.alert('Success', response.message, [
          { text: 'OK', onPress: () => router.push('/login') },
        ]);
      } else if (response?.error) {
        Alert.alert('Error', response.error);
      } else {
        Alert.alert('Error', 'OTP verification failed. Please try again.');
      }
    } catch (error: any) {
      console.log('OTP verify error:', error);

      let message = 'OTP verification failed.';

      if (error?.response?.data?.error) {
        message = error.response.data.error;
      } else if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      }

      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const response = await resendOtp(normalizePhone(phone));
      Alert.alert('Success', response.message || 'OTP resent successfully');
    } catch (error: any) {
      let message = 'Failed to resend OTP.';
      if (error.response?.data?.error) message = error.response.data.error;
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

      <View style={styles.content}>
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
                <Ionicons name="shield-checkmark" size={48} color="#fefefef8" />
              </LinearGradient>
              <View style={styles.logoShadow} />
            </View>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              Enter the code sent to{'\n'}
              <Text style={styles.phoneText}>{phone}</Text>
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Verification Code</Text>
            <Animated.View style={codeAnimatedStyle}>
              <View style={[styles.inputWrapper, focusedField && styles.inputFocused]}>
                <View style={styles.inputContent}>
                  <Ionicons name="key" size={20} color="#46042295" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#9ca3af"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="numeric"
                    maxLength={6}
                    accessible={true}
                    accessibilityLabel="OTP code"
                    accessibilityHint="Enter the 6-digit verification code"
                    onFocus={() => {
                      setFocusedField(true);
                      codeScale.value = 1.02;
                    }}
                    onBlur={() => {
                      setFocusedField(false);
                      codeScale.value = 1;
                    }}
                  />
                  {code.length === 6 && (
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" style={styles.checkIcon} />
                  )}
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Verify Button */}
          <Animated.View style={verifyButtonAnimatedStyle}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPressIn={() => (verifyButtonScale.value = 0.95)}
              onPressOut={() => (verifyButtonScale.value = 1)}
              onPress={handleVerifyOtp}
              disabled={isLoading}
              accessible={true}
              accessibilityLabel="Verify OTP"
              accessibilityRole="button"
              accessibilityState={{ disabled: isLoading }}
            >
              <LinearGradient
                colors={['#e361a280', '#ab1275bd', '#f985c1c3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.verifyButton}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.verifyButtonText}>Verifying...</Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.verifyButtonText}>Verify Code</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Didn't receive code?</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Resend Button */}
          <TouchableOpacity
            onPress={handleResendOtp}
            disabled={isLoading}
            style={styles.resendButton}
            accessible={true}
            accessibilityLabel="Resend OTP"
            accessibilityRole="button"
            accessibilityState={{ disabled: isLoading }}
          >
            <View style={styles.resendContent}>
              <Ionicons name="refresh" size={18} color="#fa2b96ff" />
              <Text style={styles.resendText}>Resend Code</Text>
            </View>
          </TouchableOpacity>

          {/* Back to Login */}
          <View style={styles.backContainer}>
            <Text style={styles.backText}>Remember your password? </Text>
            <TouchableOpacity
              onPress={() => router.push('/login')}
              accessible={true}
              accessibilityLabel="Go back to login"
              accessibilityRole="button"
            >
              <Text style={styles.backLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Security Badge */}
          <View style={styles.securityBadge}>
            <Ionicons name="lock-closed" size={14} color="#6b1839" />
            <Text style={styles.securityText}>Your information is secure</Text>
          </View>
        </BlurView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf4ff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b1839',
    textAlign: 'center',
    lineHeight: 20,
  },
  phoneText: {
    fontWeight: 'bold',
    color: '#440b24ff',
  },
  inputContainer: {
    marginBottom: 25,
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
    fontSize: 18,
    color: '#1f1f1f',
    letterSpacing: 4,
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 10,
  },
  verifyButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 20,
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
  verifyButtonText: {
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
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 13,
    color: '#6b1839',
    fontWeight: '500',
  },
  resendButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#fce7f3',
    marginBottom: 20,
    shadowColor: '#ec489a96',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  resendContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resendText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fa2b96ff',
  },
  backContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  backText: {
    fontSize: 14,
    color: '#371021ff',
  },
  backLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fa2b96ff',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(252, 231, 243, 0.5)',
    borderRadius: 20,
    alignSelf: 'center',
  },
  securityText: {
    fontSize: 12,
    color: '#6b1839',
    fontWeight: '500',
  },
});