import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ✅ Replace with your machine's local IP address
const API_BASE_URL = 'http://192.168.100.21:5000/api';

// ✅ Create an axios instance with base settings
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Attach JWT token from SecureStore to every request (if available)
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error('Error attaching token:', err);
  }
  return config;
});

// ✅ Custom API functions can be exported here or in separate files
export const getTrips = () => api.get('/trips');
export const createTrip = (tripData) => api.post('/trips', tripData);
export const updateTrip = (id, tripData) => api.put(`/trips/${id}`, tripData);
export const deleteTrip = (id) => api.delete(`/trips/${id}`);

export default api;
