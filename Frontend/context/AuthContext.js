import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user data on app start
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userData = await AsyncStorage.getItem('user');
        if (token && userData) {
          setUserToken(token);
          setUser(JSON.parse(userData));
        }
      } catch (e) {
        console.log('Failed to load user data', e);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  // ✅ Login
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch('http://192.168.100.21:5000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      // ✅ Set context + AsyncStorage
      setUserToken(data.token);
      setUser(data.user);

      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      console.log('✅ Logged in as:', data.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Register (Send OTP)
  const register = async (name, email, password) => {
    try {
      // Clear old data if exists
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('user');

      const res = await fetch('http://192.168.100.21:5000/api/users/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      return data;
    } catch (error) {
      throw error;
    }
  };

  // ✅ Verify Registration OTP
  const verifyRegistrationOtp = async (email, otp) => {
    setLoading(true);
    try {
      const res = await fetch('http://192.168.100.21:5000/api/users/register/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'OTP verification failed');

      // ✅ Save user + token to AsyncStorage
      setUserToken(data.token);
      setUser(data.user);

      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      console.log('✅ Registered and verified user:', data.user);
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Logout
  const logout = async () => {
    setUser(null);
    setUserToken(null);
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('user');
    } catch (e) {
      console.log('Failed to clear storage on logout', e);
    }
  };

  // ✅ Mark user as verified in context only
  const setUserVerified = async (updatedUser) => {
    const merged = { ...user, ...updatedUser, isVerified: true };
    setUser(merged);
    try {
      await AsyncStorage.setItem('user', JSON.stringify(merged));
    } catch (e) {
      console.log('Failed to update verification', e);
    }
  };

  // ✅ Forgot Password – Send OTP
  const sendResetOtp = async (email) => {
    try {
      const res = await fetch('http://192.168.100.21:5000/api/users/reset/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'OTP send failed');
    } catch (error) {
      throw error;
    }
  };

  // ✅ Forgot Password – Verify OTP & Reset
  const verifyResetOtp = async (email, otp, newPassword) => {
    try {
      const res = await fetch('http://192.168.100.21:5000/api/users/reset/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Password reset failed');
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        login,
        register,
        logout,
        userToken,
        user,
        setUser,
        setUserToken,
        setUserVerified,
        verifyRegistrationOtp,
        sendResetOtp,
        verifyResetOtp,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
