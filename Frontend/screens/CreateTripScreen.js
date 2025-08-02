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
    const response = await api.get(`/image?q=${encodeURIComponent(query)}`);
    const data = response.data;

    if (data?.image) {
      setImageUrl(data.image);
    }
    // If no image found, keep the existing imageUrl unchanged
  } catch (err) {
    console.error('Failed to fetch image from backend:', err);
    // On error, also keep the existing imageUrl unchanged
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
  // ... validation ...

  const tripData = {
    title,
    description,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    itinerary: isEdit && existingTrip ? existingTrip.itinerary || [] : [],
    image: imageUrl, // initially pixabay URL
  };

  try {
    let tripId;
    let savedTrip;

    if (isEdit) {
      const res = await updateTrip(existingTrip._id, tripData);
      savedTrip = res.data || existingTrip;
      tripId = savedTrip._id;
    } else {
      const res = await createTrip(tripData);
      savedTrip = res.data || res;
      tripId = savedTrip._id;
    }

    // Upload background image with tripId included in URL
    if (imageUrl && imageUrl.includes('pixabay.com')) {
      const permanentUrl = await uploadOnlyToCloudinary(tripId, imageUrl);
      if (permanentUrl) {
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
