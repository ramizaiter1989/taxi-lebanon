import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Navigation2, X, Route, Flag } from 'lucide-react-native';
import { router } from 'expo-router';
import { useMap } from '@/providers/MapProvider';
import { useQuery } from '@tanstack/react-query';

interface SearchResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  const { 
    setSelectedPlace, 
    addMarker, 
    isRoutingMode, 
    isBookingMode,
    routeStart, 
    setRouteStart, 
    setRouteEnd 
  } = useMap();

  // Debounce search query for live predictions
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      
      // Focus on Lebanon by adding country code and bounding box
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json` +
        `&q=${encodeURIComponent(debouncedQuery)}` +
        `&countrycodes=lb` + // Lebanon country code
        `&viewbox=35.1,34.4,36.6,33.0` + // Lebanon bounding box (lon_min,lat_max,lon_max,lat_min)
        `&bounded=1` + // Restrict to bounding box
        `&limit=10` +
        `&addressdetails=1`
      );
      
      if (!response.ok) throw new Error('Search failed');
      return response.json() as Promise<SearchResult[]>;
    },
    enabled: debouncedQuery.trim().length > 0,
  });

  const selectPlace = (place: SearchResult) => {
    const marker = {
      id: place.place_id,
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      title: place.display_name.split(',')[0],
      description: place.display_name,
    };
    
    if (isBookingMode || isRoutingMode) {
      if (!routeStart) {
        setRouteStart(marker);
      } else {
        setRouteEnd(marker);
      }
    } else {
      addMarker(marker);
      setSelectedPlace(marker);
    }
    router.back();
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    const [mainName, ...rest] = item.display_name.split(',');
    const subtitle = rest.slice(0, 2).join(',').trim();
    
    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => selectPlace(item)}
        activeOpacity={0.7}
      >
        <View style={styles.resultIcon}>
          <MapPin size={20} color="#007AFF" />
        </View>
        <View style={styles.resultContent}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {mainName}
          </Text>
          <Text style={styles.resultSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        {(isBookingMode || isRoutingMode) ? (
          !routeStart ? (
            <MapPin size={20} color="#FF5252" />
          ) : (
            <Flag size={20} color="#9C27B0" />
          )
        ) : (
          <Navigation2 size={20} color="#999" />
        )}
      </TouchableOpacity>
    );
  };

  // Popular Lebanese locations for quick search
  const popularPlaces = [
    'Hamra, Beirut',
    'Downtown Beirut',
    'Jounieh',
    'Byblos',
    'Tripoli',
    'Batroun',
    'Beirut Airport',
    'AUB',
    'ABC Mall',
    'City Mall',
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.searchContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <X size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.searchInputWrapper}>
            <Search size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder={
                isBookingMode 
                  ? (!routeStart ? 'Search pickup location...' : 'Search destination...')
                  : 'Search for a place in Lebanon...'
              }
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {searchResults && searchResults.length === 0 && !isLoading && searchQuery.trim() && (
          <View style={styles.emptyContainer}>
            <MapPin size={48} color="#CCC" />
            <Text style={styles.emptyText}>No results found in Lebanon</Text>
            <Text style={styles.emptySubtext}>Try searching for a different location</Text>
          </View>
        )}

        {searchResults && searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.place_id}
            renderItem={renderSearchResult}
            contentContainerStyle={styles.resultsList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
          />
        )}

        {!searchQuery && !searchResults && (
          <View style={styles.suggestionsContainer}>
            {(isBookingMode || isRoutingMode) && (
              <View style={styles.routeModeHeader}>
                <Route size={20} color="#007AFF" />
                <Text style={styles.routeModeText}>
                  {!routeStart ? 'Select pickup location' : 'Select destination'}
                </Text>
              </View>
            )}
            <Text style={styles.suggestionsTitle}>Popular Places in Lebanon</Text>
            {popularPlaces.map((place) => (
              <TouchableOpacity
                key={place}
                style={styles.suggestionItem}
                onPress={() => {
                  setSearchQuery(place);
                }}
                activeOpacity={0.7}
              >
                <MapPin size={16} color="#007AFF" />
                <Text style={styles.suggestionText}>{place}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  safeArea: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  resultsList: {
    paddingVertical: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
    marginRight: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 68,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  suggestionsContainer: {
    padding: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
  routeModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  routeModeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});