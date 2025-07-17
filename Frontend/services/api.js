import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your machine's local IP address
const API_BASE_URL = 'http://192.168.100.21:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from AsyncStorage to every request if available
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('userToken');  // <-- changed here
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error('Error attaching token:', err);
  }
  return config;
});

// API functions
export const getTrips = () => api.get('/trips');
export const createTrip = (tripData) => api.post('/trips', tripData);
export const updateTrip = (id, tripData) => api.put(`/trips/${id}`, tripData);
export const deleteTrip = (id) => api.delete(`/trips/${id}`);
// Generate a shareId for a trip (for sharing)
export const generateShareId = (id) => api.post(`/trips/${id}/share`);

export default api;
