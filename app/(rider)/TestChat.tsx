//app/(rider)/TestChat.tsx
import React from 'react';
   import { View, TouchableOpacity, Text } from 'react-native';
   import { useRouter } from 'expo-router';
   import ChatScreen from '../chat';

   export default function TestChat() {
     const router = useRouter();
     
     return (
       <View style={{ flex: 1 }}>
         <ChatScreen />
       </View>
     );
   }