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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createTrip, updateTrip } from '../services/api';
import api from '../services/api'; // Import the axios instance for custom requests

const PIXABAY_API_KEY = '51320245-f4b6917bb053d2b671fe70259';

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
      const response = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
          query
        )}&image_type=photo&category=places&per_page=3&safesearch=true`
      );
      const data = await response.json();
      if (data?.hits?.length > 0) {
        setImageUrl(data.hits[0].webformatURL);
      } else {
        setImageUrl('');
      }
    } catch (err) {
      console.error('Failed to fetch image:', err);
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
  const uploadImageToBackend = async (imageUrl, tripId) => {
    try {
      // Download image as blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      // Prepare form data
      const formData = new FormData();
      formData.append('image', {
        uri: imageUrl,
        name: 'trip-location.jpg',
        type: blob.type || 'image/jpeg',
      });
      // Upload to backend (Cloudinary via your API)
      const uploadRes = await api.post(`/trips/${tripId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Return the permanent Cloudinary URL
      return uploadRes.data.url;
    } catch (err) {
      console.error('Image upload failed:', err);
      return '';
    }
  };

  const handleSubmit = async () => {
    if (!title) return Alert.alert('Error', 'Please enter a trip title');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) return Alert.alert('Invalid Date', 'Start date is in the past');
    if (endDate < startDate) return Alert.alert('Invalid Date', 'End date is before start date');

    // Prepare trip data (initially with Pixabay URL)
    const tripData = {
      title,
      description,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      itinerary: isEdit && existingTrip ? existingTrip.itinerary || [] : [],
      image: imageUrl, // Will be replaced with permanent URL after upload
    };

    try {
      let tripId;
      let savedTrip;
      if (isEdit) {
        // Update trip first
        const res = await updateTrip(existingTrip._id, tripData);
        savedTrip = res.data || existingTrip;
        tripId = savedTrip._id;
      } else {
        // Create trip first
        const res = await createTrip(tripData);
        savedTrip = res.data || res;
        tripId = savedTrip._id;
      }

      // If imageUrl is a Pixabay URL, upload it to backend and update trip
      if (imageUrl && imageUrl.includes('pixabay.com')) {
        const permanentUrl = await uploadImageToBackend(imageUrl, tripId);
        if (permanentUrl) {
          // Update trip with permanent image URL
          await updateTrip(tripId, { ...tripData, image: permanentUrl });
        }
      }

      Alert.alert(isEdit ? 'Updated' : 'Success', isEdit ? 'Trip updated successfully!' : 'Trip created!');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to submit trip');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#1A3C6D" />
        </TouchableOpacity>
        <Text style={styles.title}>{isEdit ? 'Edit Your Trip ✏️' : 'Plan Your Adventure ✈️'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Icon name="compass-outline" size={24} color="#4A90E2" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Trip Title*"
            value={title}
            onChangeText={onTitleChange}
            placeholderTextColor="#888"
          />
        </View>

        {loadingImage && (
          <ActivityIndicator size="small" color="#4A90E2" style={{ marginBottom: 10 }} />
        )}

        <View style={styles.inputContainer}>
          <Icon name="document-text-outline" size={24} color="#4A90E2" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="calendar-outline" size={24} color="#4A90E2" style={styles.inputIcon} />
          <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowStartPicker(true)}>
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

        <View style={styles.inputContainer}>
          <Icon name="calendar-outline" size={24} color="#4A90E2" style={styles.inputIcon} />
          <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowEndPicker(true)}>
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

        <TouchableOpacity style={styles.createButton} onPress={handleSubmit}>
          <Text style={styles.createButtonText}>{isEdit ? 'Update Trip' : 'Create Trip'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A3C6D',
    flex: 1,
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  datePickerButton: {
    flex: 1,
    paddingVertical: 14,
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  createButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CreateTripScreen;
