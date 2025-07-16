import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import Icon from 'react-native-vector-icons/Ionicons';

const screenWidth = Dimensions.get('window').width;
const numColumns = 3;
const spacing = 12;
const imageSize = (screenWidth - 20 * 2 - spacing * (numColumns - 1)) / numColumns;

const TripGalleryScreen = ({ route }) => {
  const { tripId } = route.params;

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch trip photos from backend
  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/trips/${tripId}`);
      setPhotos(res.data.photos || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  // Open image library and pick an image
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Allow photo access to upload images.');
      return;
    }

    try {
      // Launch image library picker with correct mediaTypes string 'images'
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images', // lowercase string required
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length > 0) {
        uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Picker error:', error);
      Alert.alert('Error', 'Image picker failed to open or timed out.');
    }
  };

  // Upload photo to backend
  const uploadPhoto = async (uri) => {
    try {
      setUploading(true);

      const extension = uri.split('.').pop();
      const fileType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;

      const formData = new FormData();
      formData.append('image', {
        uri,
        name: `photo.${extension}`,
        type: fileType,
      });

      console.log('Uploading photo:', { uri, type: fileType });

      await api.post(`/trips/${tripId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Photo uploaded!');
      fetchPhotos();
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  // Delete photo by public_id
  const deletePhoto = async (publicId) => {
    try {
      const encodedId = encodeURIComponent(publicId);
      await api.delete(`/trips/${tripId}/photos/${encodedId}`);
      Alert.alert('Deleted', 'Photo deleted successfully');
      fetchPhotos();
    } catch (err) {
      console.error('Delete error:', err);
      Alert.alert('Error', 'Failed to delete photo');
    }
  };

  // Render each photo with delete button
  const renderPhoto = ({ item, index }) => {
    const marginRight = (index + 1) % numColumns === 0 ? 0 : spacing;

    return (
      <View style={{ marginBottom: spacing, marginRight, position: 'relative' }}>
        <Image
          source={{ uri: item.url }}
          style={styles.photo}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={styles.deleteIcon}
          onPress={() =>
            Alert.alert('Delete', 'Are you sure you want to delete this photo?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Yes', onPress: () => deletePhoto(item.public_id) },
            ])
          }
        >
          <Icon name="trash-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Trip Photos</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            <Icon name="cloud-upload-outline" size={22} color="#fff" />
            <Text style={styles.uploadButtonText}>Upload</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#4A90E2" style={styles.loadingIndicator} />
        ) : photos.length === 0 ? (
          <Text style={styles.noPhotosText}>No photos added yet.</Text>
        ) : (
          <FlatList
            data={photos}
            keyExtractor={(item) => item.public_id}
            renderItem={renderPhoto}
            numColumns={numColumns}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.photoGrid}
          />
        )}

        {uploading && (
          <ActivityIndicator size="large" color="#FF6F61" style={styles.uploadingIndicator} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E6F0FA',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A3C6D',
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6F61',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  photoGrid: {
    paddingBottom: 30,
  },
  photo: {
    width: imageSize,
    height: imageSize,
    borderRadius: 12,
    backgroundColor: '#ddd',
  },
  deleteIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FF6F61',
    borderRadius: 12,
    padding: 4,
    zIndex: 1,
  },
  noPhotosText: {
    textAlign: 'center',
    marginTop: 60,
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
  loadingIndicator: {
    marginTop: 60,
  },
  uploadingIndicator: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
  },
});

export default TripGalleryScreen;
