// services/echo.ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { API_BASE_URL } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Make Pusher available globally for Laravel Echo
(window as any).Pusher = Pusher;

export const createEcho = async (): Promise<any> => {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    console.error('No auth token found. User is not authenticated.');
    return null;
  }

  const echo = new Echo({
    broadcaster: 'pusher',
    key: '468c7e64c28cc64601bf',
    cluster: 'eu',
    forceTLS: true,
    authEndpoint: `${API_BASE_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`
      },
      
    },
    
  });
  console.log("echo:",echo);
  return echo;
};