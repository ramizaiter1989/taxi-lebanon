import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ChatScreen from '../chat'; // adjust path if needed

export default function TestChat() {
  const { rideId } = useLocalSearchParams();
  const rideIdNumber = Number(rideId);

  return (
    <View style={{ flex: 1 }}>
      <ChatScreen route={{ params: { rideId: rideIdNumber } }} />
    </View>
  );
}
