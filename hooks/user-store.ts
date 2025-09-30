import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { User, UserRole } from '@/types/user';

const MOCK_USERS: Record<UserRole, User> = {
  client: {
    id: '1',
    name: 'Sarah Ahmad',
    email: 'sarah@example.com',
    phone: '+961 70 123 456',
    role: 'client',
    isVerified: true,
    rating: 4.8,
    totalRides: 45
  },
  rider: {
    id: '2',
    name: 'Layla Hassan',
    email: 'layla@example.com',
    phone: '+961 71 987 654',
    role: 'rider',
    isVerified: true,
    rating: 4.9,
    totalRides: 120
  }
};

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (role: UserRole) => {
    const userData = MOCK_USERS[role];
    setUser(userData);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return {
    user,
    isLoading,
    login,
    logout,
    updateUser
  };
});