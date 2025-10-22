import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Navigation,
  Clock,
  Check,
  X,
  CreditCard,
  Wallet,
  Banknote,
  Tag,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMap, VEHICLE_OPTIONS } from '@/providers/MapProvider';

interface EnhancedBookingModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function EnhancedBookingModal({ visible, onClose, onConfirm }: EnhancedBookingModalProps) {
  const {
    rideBooking,
    selectedVehicleType,
    selectedPaymentMethod,
    promoCode,
    setVehicleType,
    setPaymentMethod,
    applyPromoCode,
  } = useMap();
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  const handleApplyPromo = () => {
    if (!promoInput.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }
    applyPromoCode(promoInput.toUpperCase());
    setPromoError('');
    Alert.alert('Success', 'Promo code applied!');
  };

  const handleConfirm = () => {
    onConfirm();
  };

  if (!rideBooking) return null;
  const savings = rideBooking.discount || 0;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer} edges={['bottom']}>
          <LinearGradient
            colors={['#fdf2f8', '#fce7f3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Confirm Your Ride</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#831843" />
            </TouchableOpacity>
          </LinearGradient>
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Trip Details */}
            <View style={styles.section}>
              <View style={styles.tripRoute}>
                <View style={styles.routePoint}>
                  <View style={[styles.routeDot, { backgroundColor: '#ec4899' }]} />
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeLabel}>Pickup</Text>
                    <Text style={styles.routeAddress} numberOfLines={2}>
                      {rideBooking.pickup.title}
                    </Text>
                  </View>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                  <View style={[styles.routeDot, { backgroundColor: '#831843' }]} />
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeLabel}>Destination</Text>
                    <Text style={styles.routeAddress} numberOfLines={2}>
                      {rideBooking.destination.title}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.tripStats}>
                <View style={styles.statBox}>
                  <Navigation size={18} color="#ec4899" />
                  <Text style={styles.statValue}>
                    {(rideBooking.route.distance / 1000).toFixed(1)} km
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Clock size={18} color="#831843" />
                  <Text style={styles.statValue}>
                    {Math.round(rideBooking.route.duration / 60)} min
                  </Text>
                </View>
              </View>
            </View>

            {/* Vehicle Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Vehicle</Text>
              <View style={styles.vehicleGrid}>
                {VEHICLE_OPTIONS.map((vehicle) => {
                  const isSelected = selectedVehicleType === vehicle.id;
                  const estimatedFare = Math.round(rideBooking.baseFare * vehicle.multiplier);

                  return (
                    <TouchableOpacity
                      key={vehicle.id}
                      style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
                      onPress={() => setVehicleType(vehicle.id)}
                      activeOpacity={0.7}
                    >
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <Check size={14} color="white" />
                        </View>
                      )}
                      <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
                      <Text style={styles.vehicleName}>{vehicle.name}</Text>
                      <Text style={styles.vehicleDesc}>{vehicle.description}</Text>
                      <Text style={styles.vehicleCapacity}>{vehicle.capacity} seats</Text>
                      <Text style={styles.vehicleFare}>
                        {estimatedFare.toLocaleString()} LBP
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Payment Method */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.paymentOptions}>
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    selectedPaymentMethod === 'cash' && styles.paymentOptionSelected,
                  ]}
                  onPress={() => setPaymentMethod('cash')}
                  activeOpacity={0.7}
                >
                  <Banknote size={24} color={selectedPaymentMethod === 'cash' ? '#ec4899' : '#9d174d'} />
                  <Text style={[
                    styles.paymentText,
                    selectedPaymentMethod === 'cash' && styles.paymentTextSelected,
                  ]}>
                    Cash
                  </Text>
                  {selectedPaymentMethod === 'cash' && (
                    <Check size={20} color="#ec4899" style={styles.paymentCheck} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    selectedPaymentMethod === 'card' && styles.paymentOptionSelected,
                  ]}
                  onPress={() => setPaymentMethod('card')}
                  activeOpacity={0.7}
                >
                  <CreditCard size={24} color={selectedPaymentMethod === 'card' ? '#ec4899' : '#9d174d'} />
                  <Text style={[
                    styles.paymentText,
                    selectedPaymentMethod === 'card' && styles.paymentTextSelected,
                  ]}>
                    Card
                  </Text>
                  {selectedPaymentMethod === 'card' && (
                    <Check size={20} color="#ec4899" style={styles.paymentCheck} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    selectedPaymentMethod === 'wallet' && styles.paymentOptionSelected,
                  ]}
                  onPress={() => setPaymentMethod('wallet')}
                  activeOpacity={0.7}
                >
                  <Wallet size={24} color={selectedPaymentMethod === 'wallet' ? '#ec4899' : '#9d174d'} />
                  <Text style={[
                    styles.paymentText,
                    selectedPaymentMethod === 'wallet' && styles.paymentTextSelected,
                  ]}>
                    Wallet
                  </Text>
                  {selectedPaymentMethod === 'wallet' && (
                    <Check size={20} color="#ec4899" style={styles.paymentCheck} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Promo Code */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Promo Code</Text>
              <View style={styles.promoContainer}>
                <View style={styles.promoInputWrapper}>
                  <Tag size={20} color="#9d174d" />
                  <TextInput
                    style={styles.promoInput}
                    placeholder="Enter promo code"
                    value={promoInput}
                    onChangeText={(text) => {
                      setPromoInput(text);
                      setPromoError('');
                    }}
                    autoCapitalize="characters"
                  />
                </View>
                <TouchableOpacity style={styles.applyButton} onPress={handleApplyPromo}>
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
              {promoError ? (
                <Text style={styles.promoError}>{promoError}</Text>
              ) : null}
              {promoCode && (
                <View style={styles.promoSuccess}>
                  <Check size={16} color="#831843" />
                  <Text style={styles.promoSuccessText}>
                    Promo code "{promoCode}" applied!
                  </Text>
                </View>
              )}
            </View>

            {/* Fare Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fare Summary</Text>
              <View style={styles.fareBreakdown}>
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Base Fare</Text>
                  <Text style={styles.fareValue}>
                    {rideBooking.baseFare.toLocaleString()} LBP
                  </Text>
                </View>
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>
                    Vehicle ({VEHICLE_OPTIONS.find((v) => v.id === selectedVehicleType)?.name})
                  </Text>
                  <Text style={styles.fareValue}>
                    {(Math.round(rideBooking.baseFare * (VEHICLE_OPTIONS.find((v) => v.id === selectedVehicleType)?.multiplier || 1)) - rideBooking.baseFare).toLocaleString()} LBP
                  </Text>
                </View>
                {savings > 0 && (
                  <View style={styles.fareRow}>
                    <Text style={[styles.fareLabel, styles.discountLabel]}>Discount</Text>
                    <Text style={[styles.fareValue, styles.discountValue]}>
                      -{savings.toLocaleString()} LBP
                    </Text>
                  </View>
                )}
                <View style={styles.fareDivider} />
                <View style={styles.fareRow}>
                  <Text style={styles.fareTotalLabel}>Total</Text>
                  <Text style={styles.fareTotalValue}>
                    {rideBooking.finalFare.toLocaleString()} LBP
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} activeOpacity={0.8}>
              <LinearGradient colors={['#ec4899', '#c026d3']} style={styles.confirmGradient}>
                <Check size={20} color="white" />
                <Text style={styles.confirmButtonText}>
                  Confirm {rideBooking.finalFare.toLocaleString()} LBP
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#fce7f3',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#831843',
  },
  closeButton: {
    padding: 4,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#fce7f3',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#831843',
    marginBottom: 16,
  },
  tripRoute: {
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: '#9d174d',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeAddress: {
    fontSize: 14,
    color: '#831843',
    fontWeight: '500',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#fce7f3',
    marginLeft: 5,
    marginVertical: 4,
  },
  tripStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#831843',
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vehicleCard: {
    width: '48%',
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  vehicleCardSelected: {
    backgroundColor: '#fce7f3',
    borderColor: '#ec4899',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ec4899',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#831843',
    marginBottom: 4,
  },
  vehicleDesc: {
    fontSize: 12,
    color: '#9d174d',
    marginBottom: 4,
    textAlign: 'center',
  },
  vehicleCapacity: {
    fontSize: 11,
    color: '#9d174d',
    marginBottom: 8,
  },
  vehicleFare: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ec4899',
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fdf2f8',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  paymentOptionSelected: {
    backgroundColor: '#fce7f3',
    borderColor: '#ec4899',
  },
  paymentText: {
    fontSize: 14,
    color: '#9d174d',
    marginTop: 8,
    fontWeight: '500',
  },
  paymentTextSelected: {
    color: '#ec4899',
    fontWeight: '600',
  },
  paymentCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  promoContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  promoInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  promoInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#831843',
  },
  applyButton: {
    backgroundColor: '#ec4899',
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  promoError: {
    fontSize: 12,
    color: '#f87171',
    marginTop: 8,
  },
  promoSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fce7f3',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  promoSuccessText: {
    fontSize: 14,
    color: '#831843',
    fontWeight: '500',
  },
  fareBreakdown: {
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    padding: 16,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fareLabel: {
    fontSize: 14,
    color: '#9d174d',
  },
  fareValue: {
    fontSize: 14,
    color: '#831843',
    fontWeight: '500',
  },
  discountLabel: {
    color: '#831843',
  },
  discountValue: {
    color: '#831843',
  },
  fareDivider: {
    height: 1,
    backgroundColor: '#fce7f3',
    marginVertical: 8,
  },
  fareTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#831843',
  },
  fareTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ec4899',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#fce7f3',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fce7f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9d174d',
  },
  confirmButton: {
    flex: 2,
    borderRadius: 12,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
