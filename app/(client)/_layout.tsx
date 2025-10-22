import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Clock, Settings, Car } from 'lucide-react-native';
import { Platform } from 'react-native';
export default function ClientTabsLayout() {
  return (
    <Tabs
      screenOptions={{
              tabBarActiveTintColor: '#ec4899',
              tabBarInactiveTintColor: '#d1d5db',
              headerShown: false,
              tabBarStyle: {
                backgroundColor: 'white',
                borderTopWidth: 0,
                paddingBottom: Platform.OS === 'ios' ? 20 : 8,
                paddingTop: 12,
                height: Platform.OS === 'ios' ? 88 : 68,
                elevation: 8,
                shadowColor: '#ec4899',
                shadowOffset: {
                  width: 0,
                  height: -3,
                },
                shadowOpacity: 0.08,
                shadowRadius: 8,
              },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="trip-history"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="active-ride"
        options={{
          title: 'Live Ride',
          tabBarIcon: ({ color, size }) => <Car color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
      <Tabs.Screen 
  name="testChat" 
  options={{ 
    title: 'Chat Test', 
    tabBarButton: () => null // hides it from tab bar
  }} 
/>

      
            {/* 🚫 Hidden tabs (internal screens) */}
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="safety" options={{ href: null }} />
      <Tabs.Screen name="ride-tracking" options={{ href: null }} />
      <Tabs.Screen name="saved-locations" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="EnhancedBookingModal" options={{ href: null }} />
    </Tabs>
  );
}