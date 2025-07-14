import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { updateTrip } from '../services/api';

const EditItineraryScreen = ({ navigation, route }) => {
  const { trip, onSave } = route.params;

  // Initialize itinerary from trip or empty array
  const [itinerary, setItinerary] = useState(
    trip.itinerary.length > 0
      ? trip.itinerary.map(day => ({
          ...day,
          activities: day.activities.length ? day.activities : [''],
          notes: day.notes || '',
        }))
      : [
          {
            day: 1,
            activities: [''],
            notes: '',
          },
        ]
  );

  // Add a new itinerary day
  const addDay = () => {
    setItinerary(prev => [
      ...prev,
      {
        day: prev.length + 1,
        activities: [''],
        notes: '',
      },
    ]);
  };

  // Remove itinerary day by index
  const removeDay = index => {
    if (itinerary.length === 1) {
      Alert.alert('Cannot delete', 'You must have at least one day.');
      return;
    }
    setItinerary(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Re-number days after removal
      return updated.map((day, i) => ({ ...day, day: i + 1 }));
    });
  };

  // Update a day’s notes
  const updateNotes = (index, text) => {
    setItinerary(prev => {
      const copy = [...prev];
      copy[index].notes = text;
      return copy;
    });
  };

  // Add new activity input field to a day
  const addActivity = dayIndex => {
    setItinerary(prev => {
      const copy = [...prev];
      copy[dayIndex].activities.push('');
      return copy;
    });
  };

  // Remove activity input from a day
  const removeActivity = (dayIndex, activityIndex) => {
    setItinerary(prev => {
      const copy = [...prev];
      if (copy[dayIndex].activities.length === 1) {
        Alert.alert('Cannot delete', 'At least one activity required.');
        return prev;
      }
      copy[dayIndex].activities.splice(activityIndex, 1);
      return copy;
    });
  };

  // Update activity text for a day
  const updateActivityText = (dayIndex, activityIndex, text) => {
    setItinerary(prev => {
      const copy = [...prev];
      copy[dayIndex].activities[activityIndex] = text;
      return copy;
    });
  };

  // Save itinerary to backend
  const saveItinerary = async () => {
    // Validate no empty titles for activities
    for (const day of itinerary) {
      if (day.activities.some(act => act.trim() === '')) {
        Alert.alert('Validation Error', 'Please fill all activity fields or remove empty ones.');
        return;
      }
    }

    try {
      // Call backend updateTrip with new itinerary
      await updateTrip(trip._id, {
        ...trip,
        itinerary,
      });
      Alert.alert('Success', 'Itinerary updated!');
      if (onSave) onSave();
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update itinerary.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#E6F0FA' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={24} color="#1A3C6D" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Itinerary</Text>
        </View>

        {/* Itinerary Days */}
        {itinerary.map((day, dayIndex) => (
          <View key={dayIndex} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>Day {day.day}</Text>
              <TouchableOpacity onPress={() => removeDay(dayIndex)}>
                <Icon name="trash-outline" size={24} color="#FF6F61" />
              </TouchableOpacity>
            </View>

            {/* Activities list */}
            {day.activities.map((activity, i) => (
              <View key={i} style={styles.activityRow}>
                <TextInput
                  style={styles.activityInput}
                  placeholder={`Activity ${i + 1}`}
                  value={activity}
                  onChangeText={text => updateActivityText(dayIndex, i, text)}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => removeActivity(dayIndex, i)} style={styles.removeActivityBtn}>
                  <Icon name="close-circle" size={20} color="#FF6F61" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addActivityBtn}
              onPress={() => addActivity(dayIndex)}
            >
              <Icon name="add-circle-outline" size={20} color="#4A90E2" />
              <Text style={styles.addActivityText}>Add Activity</Text>
            </TouchableOpacity>

            {/* Notes input */}
            <TextInput
              style={styles.notesInput}
              placeholder="Notes (optional)"
              multiline
              value={day.notes}
              onChangeText={text => updateNotes(dayIndex, text)}
              placeholderTextColor="#999"
            />
          </View>
        ))}

        {/* Add new day */}
        <TouchableOpacity style={styles.addDayBtn} onPress={addDay}>
          <Icon name="add-circle" size={26} color="#00AEEF" />
          <Text style={styles.addDayText}>Add Day</Text>
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={saveItinerary}>
          <Text style={styles.saveBtnText}>Save Itinerary</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  activityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  removeActivityBtn: {
    marginLeft: 8,
  },
  addActivityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addActivityText: {
    marginLeft: 6,
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#333',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  addDayBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  addDayText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '700',
    color: '#00AEEF',
  },
  saveBtn: {
    backgroundColor: '#FF6F61',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
});

export default EditItineraryScreen;
