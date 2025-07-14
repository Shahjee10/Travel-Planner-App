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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Allow photo access to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      uploadPhoto(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', {
        uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      });

      await api.post(`/trips/${tripId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Photo uploaded!');
      fetchPhotos();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const renderPhoto = ({ item, index }) => {
    const marginRight = (index + 1) % numColumns === 0 ? 0 : spacing;
    return (
      <Image
        source={{ uri: item.url }}
        style={[styles.photo, { marginRight }]}
        resizeMode="cover"
      />
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
    paddingTop: 16, // Add some padding from top inside safe area
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
    marginBottom: spacing,
    backgroundColor: '#ddd',
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
