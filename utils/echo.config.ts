
   // services/echo.ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native'; // ✅ keep react-native version if you're in React Native
import { API_BASE_URL } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Make Pusher globally available for Laravel Echo
(window as any).Pusher = Pusher;

/**
 * Initialize Laravel Echo instance
 */
export const initializeEcho = async (): Promise<any> => {
  try {
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
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
    });

    console.log('✅ Echo initialized:', echo);
    return echo;
  } catch (error) {
    console.error('❌ Failed to initialize Echo:', error);
    return null;
  }
};

/**
 * Disconnect Echo instance safely
 */
export const disconnectEcho = (echo: any) => {
  if (echo) {
    echo.disconnect();
    console.log('🔌 Echo disconnected');
  }
};
