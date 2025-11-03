import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('No auth token found');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  private expoPushToken: string | null = null;

  async initialize() {
    if (Platform.OS === 'web') {
      console.log('Notifications not supported on web');
      return;
    }

    try {
      if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '2832cd6a-963d-4eab-8c7a-9cc81f938cc1', // Replace with your actual Expo project ID
      });

      this.expoPushToken = token.data;
      console.log('Expo push token:', this.expoPushToken);

      // Send the Expo push token to the backend
      await this.sendPushTokenToBackend(this.expoPushToken);

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  async sendLocalNotification(notification: NotificationData) {
    if (Platform.OS === 'web') {
      console.log('Local notification (web):', notification.title, notification.body);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  // Ride-specific notification methods
  async notifyRideAccepted(driverName: string, eta: number) {
    await this.sendLocalNotification({
      title: 'Ride Accepted! 🚗',
      body: `${driverName} is coming to pick you up. ETA: ${eta} minutes`,
      data: { type: 'ride_accepted' },
    });
  }

  async notifyDriverArriving(driverName: string) {
    await this.sendLocalNotification({
      title: 'Driver Arriving 📍',
      body: `${driverName} is almost at your pickup location`,
      data: { type: 'driver_arriving' },
    });
  }

  async notifyTripStarted() {
    await this.sendLocalNotification({
      title: 'Trip Started 🛣️',
      body: 'Your ride has begun. Enjoy your journey!',
      data: { type: 'trip_started' },
    });
  }

  async notifyTripCompleted(fare: number) {
    await this.sendLocalNotification({
      title: 'Trip Completed ✅',
      body: `You have arrived safely. Fare: ${fare} LBP`,
      data: { type: 'trip_completed' },
    });
  }

  async notifyNewRideRequest(pickup: string, dropoff: string, fare: number) {
    await this.sendLocalNotification({
      title: 'New Ride Request! 🚖',
      body: `From ${pickup} to ${dropoff} - ${fare} LBP`,
      data: { type: 'new_ride_request' },
    });
  }

  async notifyRideCancelled() {
    await this.sendLocalNotification({
      title: 'Ride Cancelled ❌',
      body: 'The ride has been cancelled',
      data: { type: 'ride_cancelled' },
    });
  }

  async notifySOSAlert(location: string) {
    await this.sendLocalNotification({
      title: '🚨 SOS Alert',
      body: `Emergency alert from ${location}`,
      data: { type: 'sos_alert' },
    });
  }

  async sendPushTokenToBackend(token: string) {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/update-push-token`, {
        method: 'POST',
        ...authHeaders,
        body: JSON.stringify({ expo_push_token: token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to send push token to backend:', errorData);
      } else {
        console.log('Push token sent to backend successfully');
      }
    } catch (error) {
      console.error('Error sending push token:', error);
    }
  }

  getExpoPushToken() {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService();
