import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://loaclhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = async () => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};
