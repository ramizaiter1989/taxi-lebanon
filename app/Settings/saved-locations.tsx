import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Home,
  Briefcase,
  MapPin,
  Plus,
  Trash2,
  X,
  Check,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMap, SavedLocation } from '@/providers/MapProvider';
import { LinearGradient } from 'expo-linear-gradient';

export default function SavedLocationsScreen() {
  const router = useRouter();
  const { savedLocations, addSavedLocation, removeSavedLocation } = useMap();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: 'custom' as 'home' | 'work' | 'custom',
  });

  const handleAddLocation = () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const newLocation: SavedLocation = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      address: formData.address.trim(),
      lat: 33.8886, // Beirut default lat
      lng: 35.4955, // Beirut default lng
      type: formData.type,
    };

    addSavedLocation(newLocation);
    setShowAddModal(false);
    resetForm();
    Alert.alert('Success', 'Location saved successfully!');
  };

  const handleDeleteLocation = (id: string) => {
    Alert.alert(
      'Delete Location',
      'Are you sure you want to delete this saved location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeSavedLocation(id),
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({ name: '', address: '', type: 'custom' });
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Home size={24} color="#007AFF" />;
      case 'work':
        return <Briefcase size={24} color="#007AFF" />;
      default:
        return <MapPin size={24} color="#007AFF" />;
    }
  };

  const renderLocationItem = ({ item }: { item: SavedLocation }) => (
    <View style={styles.locationItem}>
      <View style={styles.locationIcon}>{getLocationIcon(item.type)}</View>
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{item.name}</Text>
        <Text style={styles.locationAddress} numberOfLines={2}>
          {item.address}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteLocation(item.id)}
      >
        <Trash2 size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Locations</Text>
        <View style={{ width: 40 }} />
      </View>

      {savedLocations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MapPin size={64} color="#CCC" />
          <Text style={styles.emptyText}>No saved locations yet</Text>
          <Text style={styles.emptySubtext}>
            Add your favorite places for quick access
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedLocations}
          keyExtractor={(item) => item.id}
          renderItem={renderLocationItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <LinearGradient colors={['#007AFF', '#0051D5']} style={styles.addGradient}>
          <Plus size={24} color="white" />
          <Text style={styles.addButtonText}>Add Location</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Location Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent} edges={['bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Saved Location</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Location Type</Text>
                <View style={styles.typeOptions}>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      formData.type === 'home' && styles.typeOptionActive,
                    ]}
                    onPress={() => setFormData({ ...formData, type: 'home' })}
                    activeOpacity={0.7}
                  >
                    <Home
                      size={20}
                      color={formData.type === 'home' ? '#007AFF' : '#666'}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        formData.type === 'home' && styles.typeTextActive,
                      ]}
                    >
                      Home
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      formData.type === 'work' && styles.typeOptionActive,
                    ]}
                    onPress={() => setFormData({ ...formData, type: 'work' })}
                    activeOpacity={0.7}
                  >
                    <Briefcase
                      size={20}
                      color={formData.type === 'work' ? '#007AFF' : '#666'}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        formData.type === 'work' && styles.typeTextActive,
                      ]}
                    >
                      Work
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      formData.type === 'custom' && styles.typeOptionActive,
                    ]}
                    onPress={() => setFormData({ ...formData, type: 'custom' })}
                    activeOpacity={0.7}
                  >
                    <MapPin
                      size={20}
                      color={formData.type === 'custom' ? '#007AFF' : '#666'}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        formData.type === 'custom' && styles.typeTextActive,
                      ]}
                    >
                      Other
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Location Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Home, Office, Gym"
                  placeholderTextColor="#999"
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  maxLength={50}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter full address in Lebanon"
                  placeholderTextColor="#999"
                  value={formData.address}
                  onChangeText={(text) =>
                    setFormData({ ...formData, address: text })
                  }
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  maxLength={200}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddLocation}
              >
                <LinearGradient
                  colors={['#34C759', '#28A745']}
                  style={styles.saveGradient}
                >
                  <Check size={20} color="white" />
                  <Text style={styles.saveButtonText}>Save Location</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
  list: {
    padding: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  deleteButton: {
    padding: 8,
  },
  separator: {
    height: 12,
  },
  addButton: {
    margin: 16,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  typeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  typeOptionActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  typeText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  typeTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    borderRadius: 12,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});