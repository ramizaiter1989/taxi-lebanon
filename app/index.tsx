import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useUser } from '@/hooks/user-store';

export default function IndexScreen() {
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // User IS logged in: Redirect to the main app based on role
        router.replace(user.role === 'client' ? '/(client)/home' : '/(rider)/home');
      } else {
        // User IS NOT logged in: Redirect to the Login Screen
        // Changed from '/role-selection' to '/login'
        router.replace('/login');
      }
    }
  }, [user, isLoading]);

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366f1',
  },
});