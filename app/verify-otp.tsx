import React, { useState } from 'react';
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
    // Success response from backend
    if (response?.message) {
      Alert.alert('Success', response.message, [
        { text: 'OK', onPress: () => router.push('/login') },
      ]);
    } else if (response?.error) {
      // Backend returned error
      Alert.alert('Error', response.error);
    } else {
      // Unexpected response
      Alert.alert('Error', 'OTP verification failed. Please try again.');
    }
  } catch (error: any) {
    console.log('OTP verify error:', error);

    // Handle different error cases
    let message = 'OTP verification failed.';

    if (error?.response?.data?.error) {
      // Axios error from backend
      message = error.response.data.error;
    } else if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.message) {
      // Generic JS error or network error
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
      <View style={styles.card}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the OTP sent to <Text style={{ fontWeight: 'bold' }}>{phone}</Text>
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          keyboardType="numeric"
          value={code}
          onChangeText={setCode}
          maxLength={6}
        />

        <TouchableOpacity
          onPress={handleVerifyOtp}
          disabled={isLoading}
          style={{ width: '100%' }}
        >
          <LinearGradient
            colors={['#ec4899', '#8b5cf6', '#3b82f6']}
            style={styles.button}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify OTP</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResendOtp} disabled={isLoading} style={{ marginTop: 20 }}>
          <Text style={styles.resendText}>Resend OTP</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9ff' },
  card: { width: width * 0.9, padding: 30, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#8b5cf6', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#6b7280', marginBottom: 20, textAlign: 'center' },
  input: { width: '100%', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 20, fontSize: 16, textAlign: 'center' },
  button: { paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  resendText: { color: '#8b5cf6', fontWeight: '600', textAlign: 'center' },
});
