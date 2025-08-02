import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import API_BASE_URL from '../apiConfig';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');

  const handleSendOtp = async () => {
    if (!email) {
      return Alert.alert('Missing Field', 'Please enter your email');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/reset/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      Alert.alert('Success', 'OTP sent to your email');

      // Navigate to ResetPasswordScreen and pass email as param
      navigation.navigate('ResetPassword', { email });

    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Forgot Password 🔐</Text>

      <Text style={styles.subtitle}>
        Enter your email to receive an OTP to reset your password.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity style={styles.button} onPress={handleSendOtp}>
        <Text style={styles.buttonText}>Send OTP</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F9FF',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#1A3C6D',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 30,
    textAlign: 'center',
    color: '#444',
  },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
