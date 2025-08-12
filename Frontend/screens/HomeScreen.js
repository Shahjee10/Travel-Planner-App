import React, { useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ImageBackground,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../context/AuthContext';
import { getTrips } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { showLocation } from 'react-native-map-link';
import debounce from 'lodash.debounce';

const MAPTILER_API_KEY = 'NBiYCxhcRWmnuL52Wz2s';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);

  // Trips state management
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search state & suggestions
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Fetch trips from API
  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await getTrips();
      setTrips(res.data);
    } catch (err) {
      console.error('Error fetching trips:', err);
      Alert.alert('Error', 'Could not load trips. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch place suggestions from MapTiler API
  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const res = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_API_KEY}`
      );
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch (err) {
      setSuggestions([]);
      console.error('Error fetching suggestions:', err);
    }
    setLoadingSuggestions(false);
  };

  // Debounce to reduce API calls on typing
  const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 400), []);

  // Refresh trips when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [])
  );

  // Calculate trip stats
  const totalTrips = trips.length;
  const upcomingTripsCount = trips.filter(trip => {
    const start = new Date(trip.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return start >= today;
  }).length;

  // Open directions in maps apps
  const openDirections = () => {
    if (!selectedPlace || !selectedPlace.center) {
      Alert.alert('No location selected', 'Please search for a place first.');
      return;
    }
    showLocation({
      latitude: selectedPlace.center[1],
      longitude: selectedPlace.center[0],
      title: selectedPlace.text || 'Destination',
      googleForceLatLon: true,
      alwaysIncludeGoogle: true,
      dialogTitle: 'Open in maps',
      dialogMessage: 'Choose an app for directions:',
      cancelText: 'Cancel',
      appsWhiteList: ['google-maps', 'apple-maps', 'waze'],
      directionsMode: 'driving',
    });
  };

  // Render individual trip cards with navigation icon top-right
  const renderTrip = ({ item }) => (
    <TouchableOpacity
      style={styles.tripCard}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('TripDetails', { trip: item })}
      accessibilityLabel={`Trip to ${item.title}`}
      accessibilityHint="Tap to see trip details"
    >
      <ImageBackground
        source={{ uri: item.image || 'https://source.unsplash.com/featured/?travel' }}
        style={styles.cardImage}
        imageStyle={{ borderRadius: 12 }}
      >
        {/* Solid semi-transparent overlay */}
        <View style={styles.cardOverlay}>

          {/* Navigation Icon Button moved top right */}
          <TouchableOpacity
            onPress={() => navigation.navigate('TripDetails', { trip: item })}
            style={styles.navIconButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Go to details of ${item.title}`}
            accessibilityHint="Navigates to trip details screen"
          >
            <Icon name="chevron-forward-circle" size={32} color="#4A90E2" />
          </TouchableOpacity>

          {/* Text Content */}
          <View style={styles.textContent}>
            <Text style={styles.tripTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.tripDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={styles.date}>
              {new Date(item.startDate).toDateString()} → {new Date(item.endDate).toDateString()}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading} accessibilityRole="header">
          Welcome, {user?.name} ✈️
        </Text>
        <TouchableOpacity
          onPress={logout}
          style={styles.logoutButton}
          accessibilityLabel="Logout"
          accessibilityHint="Logs you out of the application"
          activeOpacity={0.7}
        >
          <Icon name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <TextInput
            value={search}
            onChangeText={text => {
              setSearch(text);
              debouncedFetchSuggestions(text);
              setSelectedPlace(null);
            }}
            placeholder="Search for places..."
            style={styles.searchInput}
            accessibilityLabel="Place search input"
            accessibilityHint="Type to search for places"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearch('');
                setSuggestions([]);
                setSelectedPlace(null);
              }}
              accessibilityLabel="Clear search input"
              accessibilityRole="button"
              activeOpacity={0.7}
            >
              <Icon name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestions */}
        {loadingSuggestions && (
          <View style={styles.suggestionsLoading}>
            <ActivityIndicator size="small" color="#4A90E2" />
          </View>
        )}
        {suggestions.length > 0 && search.length > 0 && (
          <View
            style={styles.suggestionsWrapper}
            pointerEvents={loadingSuggestions ? 'none' : 'auto'}
          >
            <FlatList
              data={suggestions}
              keyExtractor={item => item.id}
              keyboardShouldPersistTaps="handled"
              style={styles.suggestionsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => {
                    setSearch(item.place_name);
                    setSuggestions([]);
                    setSelectedPlace(item);
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Select place ${item.place_name}`}
                >
                  <Icon
                    name="location-outline"
                    size={18}
                    color="#4A90E2"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.suggestionText}>{item.place_name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* Map */}
      {selectedPlace && selectedPlace.center && (
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={{
              latitude: selectedPlace.center[1],
              longitude: selectedPlace.center[0],
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
            region={{
              latitude: selectedPlace.center[1],
              longitude: selectedPlace.center[0],
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
            mapType="standard"
          >
            <Marker
              coordinate={{
                latitude: selectedPlace.center[1],
                longitude: selectedPlace.center[0],
              }}
              title={selectedPlace.text}
              description={selectedPlace.place_name}
            />
          </MapView>

          {/* Directions button */}
          <TouchableOpacity
            style={styles.directionsButton}
            onPress={openDirections}
            accessibilityRole="button"
            accessibilityLabel="Get directions"
            accessibilityHint="Opens your preferred map app for navigation"
            activeOpacity={0.8}
          >
            <Icon name="navigate-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.directionsButtonText}>Get Directions</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dashboard */}
      <View style={styles.dashboard}>
        <View style={styles.statCard}>
          <Icon name="airplane-outline" size={28} color="#4A90E2" />
          <Text style={styles.statLabel}>Total Trips</Text>
          <Text style={styles.statValue}>{totalTrips}</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="time-outline" size={28} color="#4A90E2" />
          <Text style={styles.statLabel}>Upcoming</Text>
          <Text style={styles.statValue}>{upcomingTripsCount}</Text>
        </View>
      </View>

      {/* Trips List */}
      {loading ? (
        <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
      ) : trips.length === 0 ? (
        <View style={styles.noTripsContainer}>
          <Text style={styles.noTrips}>
            No trips planned yet. Tap the + button below to start your next adventure! 🌍
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={item => item._id}
          renderItem={renderTrip}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={fetchTrips}
          keyboardShouldPersistTaps="handled"
          accessibilityLabel="List of planned trips"
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTrip')}
        accessibilityRole="button"
        accessibilityLabel="Create new trip"
        accessibilityHint="Navigate to create trip screen"
        activeOpacity={0.8}
      >
        <Icon name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F0FA',
    paddingTop: Platform.OS === 'android' ? 25 : 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A3C6D',
    letterSpacing: 0.5,
  },
  logoutButton: {
    padding: 10,
    backgroundColor: '#FF6F61',
    borderRadius: 50,
  },

  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
    zIndex: 20,
  },
  searchInputWrapper: {
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    paddingRight: 40,
    fontSize: 16,
    borderColor: '#4A90E2',
    borderWidth: 1,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  suggestionsWrapper: {
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: 180,
    borderColor: '#4A90E2',
    borderWidth: 1,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  suggestionsList: {
    paddingHorizontal: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    paddingHorizontal: 12,
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
  suggestionsLoading: {
    paddingVertical: 8,
    alignItems: 'center',
  },

  mapContainer: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#4A90E2',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  map: {
    height: 220,
    width: '100%',
  },

  directionsButton: {
    flexDirection: 'row',
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  directionsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  dashboard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statCard: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A3C6D',
    marginTop: 2,
  },

  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  tripCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    backgroundColor: '#fff',
  },
  cardImage: {
    height: 180,
    justifyContent: 'flex-end',
  },

  // The new overlay covers the entire card for text visibility
  cardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'flex-end',
    position: 'relative',
  },

  textContent: {
    // ensures text is above nav icon (which is absolutely positioned)
  },
  tripTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  tripDescription: {
    fontSize: 16,
    color: '#fff',
    opacity: 1,
    marginBottom: 8,
  },
  date: {
    fontSize: 15,
    color: 'white',
    opacity: 8,
  },

  navIconButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },

  noTripsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noTrips: {
    fontSize: 18,
    color: '#1A3C6D',
    textAlign: 'center',
    paddingHorizontal: 30,
  },

  loader: {
    marginTop: 50,
  },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#4A90E2',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default HomeScreen;
