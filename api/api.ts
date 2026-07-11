import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authCache } from '@/utils/authCache';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = authCache.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
