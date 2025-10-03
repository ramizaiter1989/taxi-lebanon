import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Search as SearchIcon, MapPin, Clock, Navigation } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMap } from '@/providers/MapProvider';
import { LinearGradient } from 'expo-linear-gradient';

export default function SearchScreen() {
  const params = useLocalSearchParams();
  const { mode } = params as { mode?: 'pickup' | 'dropoff' | 'place' };
  
  const { 
    searchLocation, 
    recentSearches, 
    addToRecentSearches,
    searchResultToMarker,
    isSearching,
    setSelectedPlace,
    setRouteStart,
    setRouteEnd
  } = useMap();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      const searchResults = await searchLocation(query);
      setResults(searchResults);
      setHasSearched(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, searchLocation]);

  const handleSelectResult = useCallback((result: any) => {
    addToRecentSearches(result);
    const marker = searchResultToMarker(result);

    if (mode === 'pickup') {
      setRouteStart(marker);
      router.back();
    } else if (mode === 'dropoff') {
      setRouteEnd(marker);
      router.back();
    } else {
      setSelectedPlace(marker);
      router.push({
        pathname: '/place-details',
        params: {
          id: marker.id,
          title: marker.title,
          description: marker.description,
          lat: marker.lat.toString(),
          lng: marker.lng.toString(),
        }
      });
    }
  }, [mode, addToRecentSearches, searchResultToMarker, setSelectedPlace, setRouteStart, setRouteEnd]);

  const handleSelectRecent = useCallback((result: any) => {
    setQuery(result.display_name);
    handleSelectResult(result);
  }, [handleSelectResult]);

  const getTitle = () => {
    switch(mode) {
      case 'pickup': return 'Select Pickup Location';
      case 'dropoff': return 'Select Dropoff Location';
      default: return 'Search Places';
    }
  };

  const renderResultItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelectResult(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {mode === 'pickup' ? (
          <MapPin size={20} color="#10b981" />
        ) : mode === 'dropoff' ? (
          <Navigation size={20} color="#ef4444" />
        ) : (
          <MapPin size={20} color="#6366f1" />
        )}
      </View>
      <View style={styles.resultTextContainer}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {item.address?.road || item.type || 'Location'}
        </Text>
        <Text style={styles.resultSubtitle} numberOfLines={2}>
          {item.display_name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderRecentItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelectRecent(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Clock size={20} color="#9ca3af" />
      </View>
      <View style={styles.resultTextContainer}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {item.address?.road || item.type || 'Location'}
        </Text>
        <Text style={styles.resultSubtitle} numberOfLines={2}>
          {item.display_name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <X size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTitle()}</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <SearchIcon size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a location..."
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : query.trim() && results.length === 0 && hasSearched ? (
        <View style={styles.emptyContainer}>
          <SearchIcon size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>
            Try searching with different keywords
          </Text>
        </View>
      ) : query.trim() && results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderResultItem}
          keyExtractor={(item) => item.place_id}
          style={styles.resultsList}
          contentContainerStyle={styles.resultsContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyboardShouldPersistTaps="handled"
        />
      ) : recentSearches.length > 0 ? (
        <View style={styles.recentContainer}>
          <Text style={styles.recentTitle}>Recent Searches</Text>
          <FlatList
            data={recentSearches}
            renderItem={renderRecentItem}
            keyExtractor={(item) => item.place_id}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <MapPin size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>Search for places</Text>
          <Text style={styles.emptySubtext}>
            Find pickup, dropoff, or any location in Lebanon
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
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
    color: '#1f2937',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    paddingVertical: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTextContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  separator: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 68,
  },
  recentContainer: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});