import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { authCache } from '@/utils/authCache';

export default function IndexScreen() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      await authCache.initialize();

      if (authCache.isAuthenticated()) {
        const role = authCache.getUserRole();
        if (role === 'passenger') {
          router.replace('/(client)/home');
        } else if (role === 'driver') {
          router.replace('/(rider)/home');
        } else if (role === 'admin') {
          router.replace('/(admin)/home');
        } else {
          router.replace('/login');
        }
      } else {
        router.replace('/login');
      }

      setIsReady(true);
    };

    checkAuth();
  }, []);

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366f1',
  },
});
