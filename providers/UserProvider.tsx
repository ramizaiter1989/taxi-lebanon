import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

export interface UserData {
  name: string;
  email: string;
  phone: string;
}

const USER_STORAGE_KEY = 'user_data';

const validateUserData = (data: UserData): boolean => {
  if (!data.name?.trim() || data.name.length > 100) return false;
  if (!data.email?.trim() || data.email.length > 100) return false;
  if (!data.phone?.trim() || data.phone.length > 20) return false;
  return true;
};

export const [UserProvider, useUser] = createContextHook(() => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (validateUserData(parsed)) {
          setUserData(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserData = useCallback(async (data: UserData) => {
    if (!validateUserData(data)) {
      console.error('Invalid user data provided');
      return;
    }
    
    const sanitizedData = {
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
    };
    
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sanitizedData));
      setUserData(sanitizedData);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }, []);

  const clearUserData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUserData(null);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }, []);

  return useMemo(() => ({
    userData,
    isLoading,
    saveUserData,
    clearUserData,
    isLoggedIn: !!userData,
  }), [userData, isLoading, saveUserData, clearUserData]);
});