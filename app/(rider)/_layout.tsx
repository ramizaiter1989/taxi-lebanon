import { Tabs } from 'expo-router';
import { Car, Clock, DollarSign, User } from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';

export default function RiderTabLayout() {
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
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Drive',
          tabBarIcon: ({ color, size, focused }) => (
            <Car 
              color={color} 
              size={focused ? 26 : 24} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size, focused }) => (
            <Clock 
              color={color} 
              size={focused ? 26 : 24}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color, size, focused }) => (
            <DollarSign 
              color={color} 
              size={focused ? 26 : 24}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen 
  name="testChat" 
  options={{ 
    title: 'Chat Test', 
    tabBarButton: () => null // hides it from tab bar
  }} 
/>

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <User 
              color={color} 
              size={focused ? 26 : 24}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}