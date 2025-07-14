import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      const savedToken = await SecureStore.getItemAsync('token');
      const savedUser = await SecureStore.getItemAsync('user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }

      setLoading(false);
    };

    loadToken();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/users/login', { email, password });
    const { token, user } = res.data;

    setToken(token);
    setUser(user);
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
  };

  const register = async (name, email, password) => {
    const res = await api.post('/users/register', { name, email, password });
    return res.data;
  };

  const logout = async () => {
    setToken('');
    setUser(null);
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
