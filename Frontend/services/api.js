import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.100.36:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from AsyncStorage to every request if available
api.interceptors.request.use(async (config) => {
  try {
    // DEBUG: print all AsyncStorage keys and values
    const keys = await AsyncStorage.getAllKeys();
    const stores = await AsyncStorage.multiGet(keys);
    console.log('AsyncStorage contents:', stores);

    // Read token from AsyncStorage
    const token = await AsyncStorage.getItem('userToken');
    console.log('🔄 Token from AsyncStorage in interceptor:', token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🔄 API Request: ${config.method.toUpperCase()} ${config.url}`, config.headers);
  } catch (err) {
    console.error('Error attaching token:', err);
  }
  return config;
});

export const getTrips = () => api.get('/trips');
export const createTrip = (tripData) => api.post('/trips', tripData);
export const updateTrip = (id, tripData) => api.put(`/trips/${id}`, tripData);
export const deleteTrip = (id) => api.delete(`/trips/${id}`);
export const generateShareId = (id) => api.post(`/trips/${id}/share`);

export default api;
