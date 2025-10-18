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

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
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