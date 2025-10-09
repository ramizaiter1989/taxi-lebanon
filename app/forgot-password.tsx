import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from "../constants/config";

const API_URL = `${API_BASE_URL}/login`;

interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: 'driver' | 'passenger' | 'admin' | string;
  };
}

const ForgotPasswordScreen: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    console.log('[Login] Starting login process...');
    if (!email || !password) {
      console.log('[Login] Validation failed: missing email or password');
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[Login] Sending request to API:', API_URL);
      const response = await axios.post<LoginResponse>(API_URL, { email, password });
      console.log('[Login] API response received:', response.data);

      const { token, user } = response.data;

      await AsyncStorage.setItem('token', token);
      console.log('[Login] Token saved to AsyncStorage');

      Alert.alert('Success', `Logged in as ${user.name}.`);

      if (user.role === 'driver') router.replace('/(client)/home');
      else if (user.role === 'passenger') router.replace('/(rider)/home');
      else if (user.role === 'admin') router.replace('/(admin)/home');
      else {
        console.log('[Login] Unknown user role:', user.role);
        Alert.alert('Error', 'Unknown user role.');
      }
    } catch (error) {
      console.log('[Login] Login failed with error:', error);
      let errorMessage = 'Login failed.';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
      }
      Alert.alert('Login Failed', errorMessage);
    } finally {
      console.log('[Login] Login process finished');
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password or code"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title="Login" onPress={handleLogin} disabled={isLoading} />

      {isLoading && <ActivityIndicator style={styles.loading} size="large" color="#0000ff" />}

      {/* Registration Link */}
      <View style={{ marginTop: 20, alignItems: 'center' }}>
        <Text>Don't have an account?</Text>
        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={{ color: '#007bff', marginTop: 5 }}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, marginBottom: 30, textAlign: 'center', fontWeight: 'bold', color: '#333' },
  input: { height: 50, borderColor: '#ddd', borderWidth: 1, borderRadius: 10, marginBottom: 15, paddingHorizontal: 15, backgroundColor: '#fff', fontSize: 16 },
  loading: { marginTop: 20, alignItems: 'center' },
});

export default ForgotPasswordScreen;
