import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { deleteTrip } from '../services/api';

const TripDetailsScreen = ({ route, navigation }) => {
  const { trip, onDelete } = route.params || {};

  // 🚨 Debug: Log the image URL
  console.log('Trip Image URI:', trip?.image);

  if (!trip) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.noTripText}>
          No trip data found. Please go back and select a trip.
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTrip(trip._id);
              if (onDelete) onDelete();
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete trip');
              console.error(err);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#1A3C6D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ✅ Updated ImageBackground */}
        <ImageBackground
          source={{
            uri: trip.image?.trim() || 'https://source.unsplash.com/800x600/?travel',
          }}
          style={styles.tripImage}
          imageStyle={{ borderRadius: 12 }}
        >
          <View style={styles.imageOverlay}>
            <Text style={styles.tripTitle}>{trip.title}</Text>
          </View>
        </ImageBackground>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() =>
            navigation.navigate('CreateTrip', {
              isEdit: true,
              trip,
              onGoBack: onDelete,
            })
          }
        >
          <Icon name="create-outline" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.editButtonText}>Edit Trip</Text>
        </TouchableOpacity>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Icon name="document-text-outline" size={20} color="#4A90E2" style={styles.detailIcon} />
            <Text style={styles.description}>{trip.description || 'No description provided'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="calendar-outline" size={20} color="#4A90E2" style={styles.detailIcon} />
            <Text style={styles.dates}>
              {new Date(trip.startDate).toDateString()} → {new Date(trip.endDate).toDateString()}
            </Text>
          </View>

          <View style={styles.itinerarySection}>
            <Text style={styles.sectionTitle}>Itinerary 📅</Text>
            {trip.itinerary?.length > 0 ? (
              trip.itinerary.map((day, index) => (
                <View key={index} style={styles.itineraryCard}>
                  <Text style={styles.itineraryDay}>Day {day.day}</Text>
                  <Text style={styles.itineraryActivities}>
                    {day.activities.join(', ') || 'No activities'}
                  </Text>
                  {day.notes ? <Text style={styles.itineraryNotes}>📝 {day.notes}</Text> : null}
                </View>
              ))
            ) : (
              <Text style={styles.placeholderText}>No itinerary added yet.</Text>
            )}

            <TouchableOpacity
              style={styles.editButton}
              onPress={() =>
                navigation.navigate('EditItinerary', {
                  trip,
                  onSave: onDelete,
                })
              }
            >
              <Icon name="calendar-outline" size={20} color="#fff" />
              <Text style={styles.editButtonText}>Edit Itinerary</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.galleryButton}
          onPress={() => navigation.navigate('TripGallery', { tripId: trip._id })}
        >
          <Icon name="images-outline" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.galleryButtonText}>View Photos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Icon name="trash-outline" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.deleteButtonText}>Delete Trip</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E6F0FA' },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30,
  },
  noTripText: {
    fontSize: 18, color: '#666', textAlign: 'center', marginBottom: 20,
  },
  goBackButton: {
    backgroundColor: '#4A90E2', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25,
  },
  goBackButtonText: {
    color: '#fff', fontSize: 16, fontWeight: '600',
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
  },
  backButton: { padding: 10 },
  headerTitle: {
    fontSize: 26, fontWeight: '700', color: '#1A3C6D',
    flex: 1, textAlign: 'center',
  },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  tripImage: {
    height: 200, justifyContent: 'flex-end', marginBottom: 16,
  },
  imageOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12, padding: 16, justifyContent: 'flex-end',
  },
  tripTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  detailsCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3,
    marginBottom: 20,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailIcon: { marginRight: 10 },
  description: { fontSize: 16, color: '#333', flex: 1 },
  dates: { fontSize: 14, color: '#666', flex: 1 },
  itinerarySection: { marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#1A3C6D' },
  itineraryCard: {
    backgroundColor: '#f8f8f8', borderRadius: 10, padding: 10, marginBottom: 8,
  },
  itineraryDay: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  itineraryActivities: { color: '#555', marginTop: 4 },
  itineraryNotes: { color: '#777', marginTop: 4, fontStyle: 'italic' },
  placeholderText: { fontSize: 16, color: '#888', fontStyle: 'italic' },
  editButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#4A90E2', paddingVertical: 16,
    borderRadius: 12, marginBottom: 12,
  },
  editButtonText: { fontSize: 18, fontWeight: '600', color: '#fff', marginLeft: 8 },
  deleteButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FF6F61', paddingVertical: 16,
    borderRadius: 12, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 3,
  },
  deleteButtonText: { fontSize: 18, fontWeight: '600', color: '#fff', marginLeft: 8 },
  buttonIcon: { marginRight: 8 },
  galleryButton: {
    flexDirection: 'row', backgroundColor: '#00AEEF',
    paddingVertical: 16, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  galleryButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

export default TripDetailsScreen;
