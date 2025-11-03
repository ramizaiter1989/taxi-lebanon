import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform } from "react-native";
import { UserProvider } from "@/hooks/user-store";
import { RideProvider } from "@/hooks/ride-store";
import { MapProvider } from "@/providers/MapProvider";
import { useKeepAwake } from 'expo-keep-awake';
import * as Notifications from 'expo-notifications';
import { notificationService } from '@/services/NotificationService'; // Adjust the import path

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="role-selection" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ headerShown: false }} />
      <Stack.Screen name="(client)" options={{ headerShown: false }} />
      <Stack.Screen name="(rider)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  // Only use keep awake on native platforms (iOS and Android)
  if (Platform.OS !== 'web') {
    useKeepAwake();
  }

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    // Initialize notifications
    notificationService.initialize();

    // Handle notifications when the app is foregrounded
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      // Optionally show an alert or update state
      alert(`Notification: ${notification.request.content.title}`);
    });

    // Handle notifications when the app is opened from a quit state
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification) {
        console.log('Notification opened from quit state:', response.notification);
      }
    });

    // Clean up the listener when the component unmounts
    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <MapProvider>
          <UserProvider>
            <RideProvider>
              <RootLayoutNav />
            </RideProvider>
          </UserProvider>
        </MapProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
