import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://4f7abfb7d80b.ngrok-free.app/api/register'; // 👈 Laravel API route

const RegisterScreen: React.FC = () => {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('passenger'); // default
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    console.log('[Register] Starting registration process...');

    if (!name || !email || !password || !passwordConfirmation) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    if (password !== passwordConfirmation) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(API_URL, {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation, // 👈 needed for Laravel confirmed rule
        role,
      });

      console.log('[Register] API response:', response.data);

      const { token, user } = response.data;

      await AsyncStorage.setItem('token', token);
      console.log('[Register] Token saved to AsyncStorage');

      Alert.alert('Success', `Welcome ${user.name}! Registration successful.`);

      // redirect to login or auto-login
      router.replace('/(client)/home');
    } catch (error) {
      console.log('[Register] Error:', error);
      let errorMessage = 'Registration failed.';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      console.log('[Register] Registration process finished');
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={passwordConfirmation}
        onChangeText={setPasswordConfirmation}
        secureTextEntry
      />

      <Button title="Register" onPress={handleRegister} disabled={isLoading} />
      {isLoading && <ActivityIndicator style={styles.loading} size="large" color="#0000ff" />}

      <View style={{ marginTop: 20, alignItems: 'center' }}>
        <Text>Already have an account?</Text>
        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={{ color: '#007bff', marginTop: 5 }}>Login</Text>
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

export default RegisterScreen;
