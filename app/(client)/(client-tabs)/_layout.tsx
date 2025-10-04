// app/(client)/(client-tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Clock, User, Shield } from 'lucide-react-native';

export default function ClientTabsLayout() {
  return (
   <Tabs
  screenOptions={{
    headerShown: false, // disables header for all tabs
    tabBarActiveTintColor: '#6366f1',
    tabBarInactiveTintColor: '#9ca3af',
    tabBarStyle: {
      backgroundColor: 'white',
      borderTopWidth: 1,
      borderTopColor: '#f3f4f6',
      paddingBottom: 8,
      paddingTop: 8,
      height: 88,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '600',
    },
  }}
>
  <Tabs.Screen name="home" options={{ title: 'Book Ride' }} />
  <Tabs.Screen name="history" options={{ title: 'History' }} />
  <Tabs.Screen name="safety" options={{ title: 'Safety' }} />
  <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
</Tabs>

  );
}
