import axios from 'axios';
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

export const chatService = {
  async getMessages(rideId: number) {
    try {
      const { headers } = await getAuthHeaders();
      const response = await axios.get(`${API_BASE_URL}/chat/${rideId}`, { headers });
      return response.data;
    } catch (error: any) {
      console.error('Get messages error:', error.response?.data || error.message);
      throw error;
    }
  },

  async sendMessage(rideId: number, message: string) {
    try {
      const { headers } = await getAuthHeaders();
      const payload = {
        ride_id: rideId,
        message,
      };
      console.log('Sending chat:', payload);
      const response = await axios.post(`${API_BASE_URL}/chat`, payload, { headers });
      console.log('Message sent:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Send message error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  async markAsRead(rideId: number) {
    try {
      const { headers } = await getAuthHeaders();
      const response = await axios.post(`${API_BASE_URL}/chat/${rideId}/mark-read`, {}, { headers });
      console.log('Messages marked as read');
      return response.data;
    } catch (error: any) {
      console.error('Mark as read error:', error.response?.data || error.message);
      throw error;
    }
  },

  async getRideDetails(rideId: number) {
    try {
      const { headers } = await getAuthHeaders();
      const response = await axios.get(`${API_BASE_URL}/rides/${rideId}`, { headers });
      return response.data;
    } catch (error: any) {
      console.error('Get ride details error:', error.response?.data || error.message);
      // Don't throw - just return null if ride not found
      return null;
    }
  },
};