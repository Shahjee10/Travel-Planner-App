import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createTrip, updateTrip } from '../services/api';
import api from '../services/api'; // Import the axios instance for custom requests

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CreateTripScreen = ({ navigation, route }) => {
  const isEdit = route?.params?.isEdit || false;
  const existingTrip = route?.params?.trip || null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [imageUrl, setImageUrl] = useState('');
  const [loadingImage, setLoadingImage] = useState(false);

  useEffect(() => {
    if (isEdit && existingTrip) {
      setTitle(existingTrip.title);
      setDescription(existingTrip.description || '');
      setStartDate(existingTrip.startDate ? new Date(existingTrip.startDate) : new Date());
      setEndDate(existingTrip.endDate ? new Date(existingTrip.endDate) : new Date());
      setImageUrl(existingTrip.image || '');
    }
  }, [isEdit, existingTrip]);

  const fetchImageForTitle = async (query) => {
    if (!query) return;
    setLoadingImage(true);
    try {
      const response = await api.get(`/image?q=${encodeURIComponent(query)}`);
      const data = response.data;

      console.log('Pixabay API response:', data);

      if (data?.image) {
        setImageUrl(data.image);
      } else {
        setImageUrl(''); // clear if no image found
      }
    } catch (err) {
      console.error('Failed to fetch image from backend:', err);
      setImageUrl('');
    }
    setLoadingImage(false);
  };

  const onTitleChange = (text) => {
    setTitle(text);
    fetchImageForTitle(text);
  };

  const onChangeStartDate = (event, selectedDate) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      if (endDate < selectedDate) {
        setEndDate(selectedDate);
      }
    }
  };

  const onChangeEndDate = (event, selectedDate) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const formatDate = (date) => {
    return date.toISOString().slice(0, 10);
  };

  // Utility: Download image as blob and upload to backend
  const uploadOnlyToCloudinary = async (tripId, imageUrl) => {
    try {
      console.log('Uploading background image to Cloudinary for trip:', tripId);
      console.log('Image URL:', imageUrl);
      console.log('Uploading to URL:', `/trips/${tripId}/upload-background`);
      const res = await api.post(`/photos/${tripId}/upload-background`, { imageUrl });
      console.log('Upload background response:', res.data);
      return res.data.url;
    } catch (err) {
      console.error('Cloudinary background upload failed:', err.response?.data || err.message);
      return null;
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Trip Title is required');
      return;
    }

    const tripData = {
      title,
      description,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      itinerary: isEdit && existingTrip ? existingTrip.itinerary || [] : [],
      image: imageUrl, // initially pixabay or previously saved URL
    };

    try {
      let tripId;
      let savedTrip;

      if (isEdit) {
        console.log('Updating existing trip with data:', tripData);
        const res = await updateTrip(existingTrip._id, tripData);
        savedTrip = res.data || existingTrip;
        tripId = savedTrip._id;
      } else {
        console.log('Creating new trip with data:', tripData);
        const res = await createTrip(tripData);
        savedTrip = res.data || res;
        tripId = savedTrip._id;
      }

      console.log('Trip saved:', savedTrip);

      // If image is still a pixabay URL, upload to Cloudinary and update trip with permanent URL
      if (imageUrl && imageUrl.includes('pixabay.com')) {
        console.log('Uploading image from Pixabay URL to Cloudinary...');
        const permanentUrl = await uploadOnlyToCloudinary(tripId, imageUrl);

        if (permanentUrl) {
          console.log('Cloudinary upload successful, permanent URL:', permanentUrl);

          // Update trip image with permanent URL
          const updatedTripData = { ...tripData, image: permanentUrl };
          const updateRes = await updateTrip(tripId, updatedTripData);

          // Update local state so UI reflects new image immediately (if needed)
          setImageUrl(permanentUrl);

          console.log('Trip updated with permanent image URL:', updateRes.data);
        } else {
          console.warn('Cloudinary upload failed, keeping original image URL');
        }
      }

      Alert.alert(isEdit ? 'Updated' : 'Success', isEdit ? 'Trip updated successfully!' : 'Trip created!');
      navigation.goBack();
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      Alert.alert('Error', 'Failed to submit trip');
    }
  };

  return (
    // KeyboardAvoidingView to avoid keyboard overlay on inputs on iOS
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#1A3C6D" />
        </TouchableOpacity>
        <Text style={styles.title}>{isEdit ? 'Edit Your Trip ✏️' : 'Plan Your Adventure ✈️'}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.formContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title Input */}
        <View style={styles.inputContainer}>
          <Icon name="compass-outline" size={24} color="#4A90E2" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Trip Title*"
            value={title}
            onChangeText={onTitleChange}
            placeholderTextColor="#888"
            returnKeyType="done"
            autoCapitalize="words"
            maxLength={50}
          />
        </View>

        {loadingImage && (
          <ActivityIndicator size="small" color="#4A90E2" style={{ marginBottom: 10 }} />
        )}

        {/* Description Input */}
        <View style={[styles.inputContainer, styles.textAreaContainer]}>
          <Icon name="document-text-outline" size={24} color="#4A90E2" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            placeholderTextColor="#888"
            textAlignVertical="top"
            maxLength={500}
          />
        </View>

        {/* Start Date Picker */}
        <View style={styles.inputContainer}>
          <Icon name="calendar-outline" size={24} color="#4A90E2" style={styles.inputIcon} />
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowStartPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.datePickerText}>{formatDate(startDate)}</Text>
          </TouchableOpacity>
        </View>
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={onChangeStartDate}
          />
        )}

        {/* End Date Picker */}
        <View style={styles.inputContainer}>
          <Icon name="calendar-outline" size={24} color="#4A90E2" style={styles.inputIcon} />
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowEndPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.datePickerText}>{formatDate(endDate)}</Text>
          </TouchableOpacity>
        </View>
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            minimumDate={startDate}
            onChange={onChangeEndDate}
          />
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.createButtonText}>{isEdit ? 'Update Trip' : 'Create Trip'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F0FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 70 : 50, // more top padding on iOS for notch
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 5,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  title: {
    fontSize: SCREEN_WIDTH > 400 ? 28 : 24, // responsive font size
    fontWeight: '700',
    color: '#1A3C6D',
    flex: 1,
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#333',
    paddingVertical: 0, // reset default padding for better vertical alignment
  },
  textAreaContainer: {
    minHeight: 140,
    paddingTop: 14,
  },
  textArea: {
    height: '100%',
    textAlignVertical: 'top',
    paddingTop: 0,
    paddingBottom: 10,
    fontSize: 16,
  },
  datePickerButton: {
    flex: 1,
    paddingVertical: 14,
  },
  datePickerText: {
    fontSize: 17,
    color: '#333',
  },
  createButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  createButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
});

export default CreateTripScreen;
