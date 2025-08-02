import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../apiConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [splashLoading, setSplashLoading] = useState(false);

 const register = async (name, email, password) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/register/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      // OTP sent, no user/token yet
      console.log('OTP sent:', data.message);
      return data; // return the message or status
    } else {
      throw new Error(data.message || 'Registration failed');
    }
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    throw error;
  }
};

  const verifyRegistrationOtp = async (email, otp) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/register/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();

    if (res.ok) {
      // OTP verified, but DO NOT set user or token here
      console.log('🔑 Token saved after OTP verification:', data.token);
      return data.message; // or something to indicate success
    } else {
      throw new Error(data.message || 'OTP verification failed');
    }
  } catch (error) {
    console.error('❌ OTP verification error:', error.message);
    throw error;
  }
};



  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        await AsyncStorage.setItem('userToken', data.token);
        console.log('🔑 Token saved after login:', data.token);
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error.message);
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('userToken');
    console.log('🗝️ User logged out, token cleared');
  };

  const isLoggedIn = async () => {
    try {
      setSplashLoading(true);
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('userToken');

      console.log('🔄 Loaded user from AsyncStorage:', storedUser);
      console.log('🔄 Loaded token from AsyncStorage:', storedToken);

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
      setSplashLoading(false);
    } catch (error) {
      console.error('❌ Auto login check failed:', error.message);
      setSplashLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ user, splashLoading, register, verifyRegistrationOtp, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
