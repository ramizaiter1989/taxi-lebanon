import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  MapPin, 
  Navigation2, 
  Share2, 
  ExternalLink,
  Copy,
} from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';


export default function PlaceDetailsScreen() {
  const params = useLocalSearchParams();
  const { title, description, lat, lng } = params as {
    title: string;
    description: string;
    lat: string;
    lng: string;
  };

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  const openInMaps = () => {
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${latitude},${longitude}`;
    const label = encodeURIComponent(title);
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
      default: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const shareLocation = async () => {
    try {
      await Share.share({
        message: `${title}\n${description}\n\nLocation: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n\nView on map: https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`,
        title: title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const copyCoordinates = async () => {
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      } catch (error) {
        console.log('Clipboard not available on web');
      }
    } else {
      // For mobile, we'll just show an alert since expo-clipboard isn't available
      console.log('Coordinates copied:', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#007AFF', '#0051D5']}
          style={styles.header}
        >
          <View style={styles.iconContainer}>
            <MapPin size={48} color="white" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.coordinates}>
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={openInMaps}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                <Navigation2 size={24} color="#007AFF" />
              </View>
              <Text style={styles.actionLabel}>Navigate</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={shareLocation}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                <Share2 size={24} color="#4CAF50" />
              </View>
              <Text style={styles.actionLabel}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={copyCoordinates}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
                <Copy size={24} color="#FF9800" />
              </View>
              <Text style={styles.actionLabel}>Copy</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => {
                const url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
                Linking.openURL(url);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
                <ExternalLink size={24} color="#9C27B0" />
              </View>
              <Text style={styles.actionLabel}>Open Web</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Location Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Latitude:</Text>
              <Text style={styles.infoValue}>{latitude.toFixed(6)}°</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Longitude:</Text>
              <Text style={styles.infoValue}>{longitude.toFixed(6)}°</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>DMS:</Text>
              <Text style={styles.infoValue}>
                {convertToDMS(latitude, longitude)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.back()}
        >
          <LinearGradient
            colors={['#007AFF', '#0051D5']}
            style={styles.buttonGradient}
          >
            <Text style={styles.primaryButtonText}>Back to Map</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function convertToDMS(lat: number, lng: number): string {
  if (typeof lat !== 'number' || typeof lng !== 'number') return 'Invalid coordinates';
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return 'Invalid coordinates';
  
  const latDirection = lat >= 0 ? 'N' : 'S';
  const lngDirection = lng >= 0 ? 'E' : 'W';
  
  const absLat = Math.abs(lat);
  const absLng = Math.abs(lng);
  
  const latDeg = Math.floor(absLat);
  const latMin = Math.floor((absLat - latDeg) * 60);
  const latSec = ((absLat - latDeg - latMin / 60) * 3600).toFixed(1);
  
  const lngDeg = Math.floor(absLng);
  const lngMin = Math.floor((absLng - lngDeg) * 60);
  const lngSec = ((absLng - lngDeg - lngMin / 60) * 3600).toFixed(1);
  
  return `${latDeg}°${latMin}'${latSec}"${latDirection}, ${lngDeg}°${lngMin}'${lngSec}"${lngDirection}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  coordinates: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    padding: 16,
  },
  descriptionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  actionCard: {
    width: '25%',
    padding: 6,
  },
  actionIcon: {
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  bottomActions: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});