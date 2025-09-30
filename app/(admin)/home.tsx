import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import axios from 'axios';
const AdminHomeScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      Alert.alert('Logged out', 'You have been logged out.');
      router.replace('../Login'); // Navigate back to login
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, Admin!</Text>
      
      <Button
        title="Manage Drivers"
        onPress={() => router.replace('/(client)/home')}
      />

      <Button
        title="Manage Passengers"
        onPress={() => router.replace('/(rider)/home')}
      />

      <Button
        title="Logout"
        color="red"
        onPress={handleLogout}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
});

export default AdminHomeScreen;
