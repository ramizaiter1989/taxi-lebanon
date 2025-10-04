import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  Banknote,
  Plus,
  Check,
  X,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet';
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: Date;
  status: 'completed' | 'pending';
}

export default function PaymentScreen() {
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState(125000);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '1', type: 'card', last4: '4242', brand: 'Visa', isDefault: true },
    { id: '2', type: 'card', last4: '5555', brand: 'Mastercard', isDefault: false },
  ]);
  const [transactions] = useState<Transaction[]>([
    { id: '1', type: 'debit', amount: 18000, description: 'Ride to AUB', date: new Date('2024-10-03'), status: 'completed' },
    { id: '2', type: 'credit', amount: 50000, description: 'Wallet Top-up', date: new Date('2024-10-02'), status: 'completed' },
    { id: '3', type: 'debit', amount: 12500, description: 'Ride to Downtown', date: new Date('2024-10-01'), status: 'completed' },
  ]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');

  const handleAddCard = () => {
    Alert.alert('Add Card', 'Card integration coming soon!');
    setShowAddCard(false);
  };

  const handleTopUp = () => {
    if (!topUpAmount || parseInt(topUpAmount) < 5000) {
      Alert.alert('Error', 'Minimum top-up amount is 5,000 LBP');
      return;
    }
    setWalletBalance(walletBalance + parseInt(topUpAmount));
    setShowTopUp(false);
    setTopUpAmount('');
    Alert.alert('Success', 'Wallet topped up successfully!');
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(m => ({ ...m, isDefault: m.id === id }))
    );
  };

  const handleDeleteCard = (id: string) => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setPaymentMethods(methods => methods.filter(m => m.id !== id)),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Wallet Balance */}
        <View style={styles.walletSection}>
          <LinearGradient
            colors={['#007AFF', '#0051D5']}
            style={styles.walletCard}
          >
            <View style={styles.walletHeader}>
              <View style={styles.walletIcon}>
                <Wallet size={24} color="white" />
              </View>
              <Text style={styles.walletLabel}>Wallet Balance</Text>
            </View>
            <Text style={styles.walletBalance}>
              {walletBalance.toLocaleString()} LBP
            </Text>
            <TouchableOpacity 
              style={styles.topUpButton}
              onPress={() => setShowTopUp(true)}
            >
              <Plus size={18} color="#007AFF" />
              <Text style={styles.topUpText}>Top Up</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddCard(true)}
            >
              <Plus size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {/* Cash Option */}
          <View style={styles.paymentCard}>
            <View style={styles.paymentIcon}>
              <Banknote size={24} color="#34C759" />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>Cash</Text>
              <Text style={styles.paymentDesc}>Pay with cash</Text>
            </View>
          </View>

          {/* Saved Cards */}
          {paymentMethods.map((method) => (
            <View key={method.id} style={styles.paymentCard}>
              <View style={styles.paymentIcon}>
                <CreditCard size={24} color="#007AFF" />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentName}>
                  {method.brand} •••• {method.last4}
                </Text>
                <Text style={styles.paymentDesc}>
                  {method.isDefault ? 'Default' : 'Tap to set as default'}
                </Text>
              </View>
              {method.isDefault ? (
                <View style={styles.defaultBadge}>
                  <Check size={16} color="white" />
                </View>
              ) : (
                <TouchableOpacity onPress={() => handleSetDefault(method.id)}>
                  <Text style={styles.setDefaultText}>Set Default</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                onPress={() => handleDeleteCard(method.id)}
                style={styles.deleteIcon}
              >
                <X size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/settings/transactions' as any)}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={[
                styles.transactionIcon,
                { backgroundColor: transaction.type === 'credit' ? '#E8F5E9' : '#FFEBEE' }
              ]}>
                {transaction.type === 'credit' ? (
                  <TrendingUp size={20} color="#34C759" />
                ) : (
                  <TrendingDown size={20} color="#FF3B30" />
                )}
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionDesc}>{transaction.description}</Text>
                <Text style={styles.transactionDate}>
                  {transaction.date.toLocaleDateString()}
                </Text>
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: transaction.type === 'credit' ? '#34C759' : '#FF3B30' }
              ]}>
                {transaction.type === 'credit' ? '+' : '-'}
                {transaction.amount.toLocaleString()} LBP
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Card Modal */}
      <Modal visible={showAddCard} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Payment Card</Text>
              <TouchableOpacity onPress={() => setShowAddCard(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Card Number"
                keyboardType="numeric"
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="MM/YY"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="CVV"
                  keyboardType="numeric"
                  secureTextEntry
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Cardholder Name"
              />
              <TouchableOpacity style={styles.submitButton} onPress={handleAddCard}>
                <Text style={styles.submitButtonText}>Add Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Top Up Modal */}
      <Modal visible={showTopUp} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Top Up Wallet</Text>
              <TouchableOpacity onPress={() => setShowTopUp(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.form}>
              <Text style={styles.label}>Enter Amount (LBP)</Text>
              <TextInput
                style={styles.input}
                placeholder="Minimum 5,000 LBP"
                keyboardType="numeric"
                value={topUpAmount}
                onChangeText={setTopUpAmount}
              />
              <View style={styles.quickAmounts}>
                {[10000, 25000, 50000, 100000].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.quickAmount}
                    onPress={() => setTopUpAmount(amount.toString())}
                  >
                    <Text style={styles.quickAmountText}>
                      {(amount / 1000)}K
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.submitButton} onPress={handleTopUp}>
                <Text style={styles.submitButtonText}>Top Up</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  walletSection: {
    padding: 16,
  },
  walletCard: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  walletLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  walletBalance: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  topUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  topUpText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paymentDesc: {
    fontSize: 14,
    color: '#666',
  },
  defaultBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  setDefaultText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 8,
  },
  deleteIcon: {
    padding: 4,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
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
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickAmount: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});