import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  Share,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { deleteTrip } from '../services/api';
import { generateShareId } from '../services/api'; // Import the shareId API
import * as Print from 'expo-print'; // For PDF generation
import * as Sharing from 'expo-sharing'; // For sharing the PDF

const TripDetailsScreen = ({ route, navigation }) => {
  const { trip, onDelete } = route.params || {};
  const [sharing, setSharing] = React.useState(false); // Loading state for sharing
  const [pdfLoading, setPdfLoading] = React.useState(false); // Loading state for PDF

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

  // Handle sharing the trip link
  const handleShare = async () => {
    setSharing(true);
    try {
      // 1. Generate or fetch shareId from backend
      const res = await generateShareId(trip._id);
      const shareId = res.data.shareId;
      // 2. Construct the public link (replace with your deployed URL if needed)
      const link = `https://yourapp.com/public/trip/${shareId}`;
      // 3. Open the share sheet
      await Share.share({
        message: `Check out my trip! ${link}`,
        url: link,
        title: 'My Trip',
      });
    } catch (err) {
      Alert.alert('Error', 'Could not generate share link.');
      console.error(err);
    }
    setSharing(false);
  };

  // Update handleSharePDF for a more attractive PDF layout
  const handleSharePDF = async () => {
    setPdfLoading(true);
    try {
      // 1. Create visually appealing HTML content for the trip
      const html = `
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css?family=Montserrat:700,400&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Montserrat', Arial, sans-serif; background: #f8fbff; color: #222; margin: 0; padding: 0; }
            .header { background: linear-gradient(90deg, #4A90E2 60%, #FF6F61 100%); color: #fff; padding: 32px 0 18px 0; text-align: center; border-bottom-left-radius: 40px; border-bottom-right-radius: 40px; }
            .header h1 { margin: 0; font-size: 2.2em; font-weight: 700; letter-spacing: 1px; }
            .section { margin: 32px 24px 0 24px; }
            .section-title { color: #4A90E2; font-size: 1.25em; font-weight: 900; margin-bottom: 10px; display: flex; align-items: center; letter-spacing: 0.5px; }
            .icon { font-size: 1.1em; margin-right: 8px; }
            .desc { font-size: 1.08em; margin-bottom: 14px; color: #444; }
            .dates { color: #FF6F61; font-weight: 700; margin-bottom: 20px; font-size: 1.08em; }
            .itinerary-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 1.05em; }
            .itinerary-table th, .itinerary-table td { border: 1px solid #e3e9f7; padding: 12px 8px; text-align: left; }
            .itinerary-table th { background: #e3e9f7; color: #4A90E2; font-weight: 900; font-size: 1.08em; }
            .itinerary-table tr:nth-child(even) td { background: #f3f6fa; }
            .itinerary-table tr:nth-child(odd) td { background: #fff; }
            .notes { color: #FF6F61; font-style: italic; font-size: 1.04em; font-weight: 600; letter-spacing: 0.2px; }
            .footer { margin: 40px 0 0 0; text-align: center; color: #aaa; font-size: 0.98em; letter-spacing: 0.5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌍 ${trip.title}</h1>
          </div>
          <div class="section">
            <div class="section-title"><span class="icon">📝</span>Description</div>
            <div class="desc">${trip.description || 'No description provided'}</div>
            <div class="section-title"><span class="icon">📅</span>Dates</div>
            <div class="dates">${new Date(trip.startDate).toDateString()} &rarr; ${new Date(trip.endDate).toDateString()}</div>
          </div>
          <div class="section">
            <div class="section-title"><span class="icon">🗺️</span>Itinerary</div>
            <table class="itinerary-table">
              <tr><th>Day</th><th>Activities</th><th>Notes</th></tr>
              ${(trip.itinerary || []).map(day => `
                <tr>
                  <td><b>${day.day}</b></td>
                  <td>${day.activities.join(', ') || 'No activities'}</td>
                  <td class="notes">${day.notes || ''}</td>
                </tr>
              `).join('')}
            </table>
          </div>
          <div class="footer">Generated by Travel Planner App</div>
        </body>
        </html>
      `;
      // 2. Generate PDF
      const { uri } = await Print.printToFileAsync({ html });
      // 3. Share PDF
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Trip PDF',
      });
    } catch (err) {
      Alert.alert('Error', 'Could not generate or share PDF.');
      console.error(err);
    }
    setPdfLoading(false);
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

        {/* --- Share as PDF Button --- */}
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: '#FF6F61', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }]}
          onPress={handleSharePDF}
          disabled={pdfLoading}
        >
          <Icon name="document-outline" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.editButtonText}>Share as PDF</Text>
          {pdfLoading && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />}
        </TouchableOpacity>

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
