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
import { authCache } from '@/utils/authCache';

// Initialize splash screen and auth cache at the module level
SplashScreen.preventAutoHideAsync();
authCache.initialize();

// Create a single instance of QueryClient
const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="role-selection" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ headerShown: false }} />
      <Stack.Screen name="(client)" options={{ headerShown: false }} />
      <Stack.Screen name="(rider)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  // Only use keep awake on native platforms
  Platform.OS !== 'web' && useKeepAwake();

  useEffect(() => {
    // Hide splash screen after initial render
    SplashScreen.hideAsync();
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
