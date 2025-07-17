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
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getTrips } from '../services/api';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Dimensions } from 'react-native';

// Import showLocation from react-native-map-link
import { showLocation } from 'react-native-map-link';

const MAPTILER_API_KEY = 'NBiYCxhcRWmnuL52Wz2s';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await getTrips();
      setTrips(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (query) => {
    if (!query) return setSuggestions([]);
    setLoadingSuggestions(true);
    try {
      const res = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_API_KEY}`
      );
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch (err) {
      setSuggestions([]);
    }
    setLoadingSuggestions(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [])
  );

  const totalTrips = trips.length;
  const upcomingTripsCount = trips.filter(trip => {
    const start = new Date(trip.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return start >= today;
  }).length;

  // UPDATED openDirections function with react-native-map-link
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

  const renderTrip = ({ item }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() =>
        navigation.navigate('TripDetails', {
          trip: item,
        })
      }
    >
      <ImageBackground
        source={{ uri: item.image || 'https://source.unsplash.com/featured/?travel' }}
        style={styles.cardImage}
        imageStyle={{ borderRadius: 12 }}
      >
        <View style={styles.cardOverlay}>
          <Text style={styles.tripTitle}>{item.title}</Text>
          <Text style={styles.tripDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.date}>
            {new Date(item.startDate).toDateString()} →{' '}
            {new Date(item.endDate).toDateString()}
          </Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Welcome, {user?.name} ✈️</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Icon name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Place Search Bar */}
      <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
        <TextInput
          value={search}
          onChangeText={text => {
            setSearch(text);
            fetchSuggestions(text);
            setSelectedPlace(null);
          }}
          placeholder="Search for places..."
          style={{
            backgroundColor: '#fff',
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            borderColor: '#4A90E2',
            borderWidth: 1,
            marginBottom: 2,
          }}
        />
        {suggestions.length > 0 && search.length > 0 && (
          <FlatList
            data={suggestions}
            keyExtractor={item => item.id}
            style={{ backgroundColor: '#fff', borderRadius: 8, maxHeight: 180, borderColor: '#4A90E2', borderWidth: 1, marginTop: 2 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                onPress={() => {
                  setSearch(item.place_name);
                  setSuggestions([]);
                  setSelectedPlace(item);
                }}
              >
                <Text style={{ fontSize: 16 }}>{item.place_name}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Map showing selected place */}
      {selectedPlace && selectedPlace.center && (
        <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
          <View style={{ height: 220, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#4A90E2' }}>
            <MapView
              provider={PROVIDER_DEFAULT}
              style={{ flex: 1 }}
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
              customMapStyle={[]}
              mapType="none"
              tileOverlay={{}}
              urlTemplate={`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`}
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
          </View>

          {/* Get Directions Button */}
          <TouchableOpacity
            style={{
              marginTop: 10,
              backgroundColor: '#4A90E2',
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 3,
            }}
            onPress={openDirections}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Get Directions</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dashboard stats */}
      <View style={styles.dashboard}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Trips</Text>
          <Text style={styles.statValue}>{totalTrips}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Upcoming</Text>
          <Text style={styles.statValue}>{upcomingTripsCount}</Text>
        </View>
      </View>

      {/* Trip List */}
      {loading ? (
        <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
      ) : trips.length === 0 ? (
        <View style={styles.noTripsContainer}>
          <Text style={styles.noTrips}>Plan your first adventure! 🌍</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item._id}
          renderItem={renderTrip}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={fetchTrips}
        />
      )}

      {/* Create Trip FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTrip')}
      >
        <Icon name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

// Styles (unchanged)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F0FA',
    paddingTop: 60,
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
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A3C6D',
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
  },
  cardImage: {
    height: 180,
    justifyContent: 'flex-end',
  },
  cardOverlay: {
    flex: 1,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  tripTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  tripDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
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
