// app/chat.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, FlatList, Text, TextInput, TouchableOpacity, Alert, StyleSheet, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createEcho } from '../services/echo';
import { chatService } from '../services/chatService';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type User = {
  id: number;
  name: string;
};

type Chat = {
  id: number;
  ride_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
  updated_at: string;
  sender: User;
  receiver: User;
};

type ChatScreenProps = {
  route: {
    params: {
      rideId: number;
    };
  };
};

export default function ChatScreen({ route }: ChatScreenProps) {
  const rideId = 4; // Hardcoded for testing
  const router = useRouter();
  const [messages, setMessages] = useState<Chat[]>([]);
  const [text, setText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList<Chat>>(null);
  const echoRef = useRef<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Alert.alert('Error', 'You need to login first');
          router.replace('/');
          return;
        }

        const userIdStr = await AsyncStorage.getItem('user_id');
        const userId = userIdStr ? Number(userIdStr) : null;
        setCurrentUserId(userId);
        console.log('👤 Current user ID:', userId);

        console.log('🔄 Loading messages for ride:', rideId);
        const msgs = await chatService.getMessages();
        
        // Handle both array and {data: array} formats
        let msgsArray: Chat[] = [];
        if (Array.isArray(msgs)) {
          msgsArray = msgs;
        } else if (msgs?.data && Array.isArray(msgs.data)) {
          // If it's a collection resource, extract the data
          msgsArray = msgs.data.map((item: any) => item.data || item);
        }
        
        const validMessages = msgsArray.filter((msg: Chat) => msg && msg.id);
        console.log('📨 Loaded messages:', validMessages.length);
        setMessages(validMessages);

        // Initialize Echo
        console.log('🔌 Initializing Echo...');
        const echo = await createEcho();
        
        if (!echo) {
          console.error('❌ Echo not initialized');
          Alert.alert('Warning', 'Real-time messaging may not work. Check your connection.');
          setIsLoading(false);
          return;
        }

        echoRef.current = echo;

        // Subscribe to private channel
        console.log(`📡 Subscribing to private channel: ride.${rideId}`);
        
        echo
          .private(`ride.${rideId}`)
          .listen('.NewMessageEvent', (e: any) => {
            console.log('🔔 RAW EVENT RECEIVED:', JSON.stringify(e, null, 2));
            
            // Handle different possible data structures
            let newMessage: Chat | null = null;
            
            // Try different paths where the message might be
            if (e.chat?.data) {
              // ChatResource format: { chat: { data: {...} } }
              newMessage = e.chat.data;
              console.log('✅ Found message in e.chat.data');
            } else if (e.chat?.id) {
              // Direct format: { chat: {...} }
              newMessage = e.chat;
              console.log('✅ Found message in e.chat');
            } else if (e.data) {
              // Alternative format: { data: {...} }
              newMessage = e.data;
              console.log('✅ Found message in e.data');
            } else if (e.id) {
              // Direct message: {...}
              newMessage = e;
              console.log('✅ Found message in root');
            }
            
            if (newMessage && newMessage.id) {
              console.log('💬 Processing new message:', {
                id: newMessage.id,
                sender_id: newMessage.sender_id,
                message: newMessage.message?.substring(0, 20) + '...'
              });
              
              // Prevent duplicate messages
              setMessages(prev => {
                const exists = prev.some(msg => msg.id === newMessage!.id);
                if (exists) {
                  console.log('⚠️ Duplicate message ignored:', newMessage!.id);
                  return prev;
                }
                console.log('✅ Adding new message to chat');
                return [...prev, newMessage!];
              });
            } else {
              console.error('❌ Could not extract message from event:', e);
            }
          })
          .error((error: any) => {
            console.error('❌ Channel subscription error:', error);
            Alert.alert('Connection Error', 'Could not connect to chat. Please try again.');
          });

        // Listen for successful subscription
        echo.connector.pusher.connection.bind('connected', () => {
          console.log('✅ Pusher connected');
        });

        echo.connector.pusher.connection.bind('error', (err: any) => {
          console.error('❌ Pusher connection error:', err);
        });

        setIsLoading(false);
        console.log('✅ Chat initialized successfully');
        
      } catch (error: any) {
        console.error('❌ Chat initialization error:', error);
        if (error.response?.status === 401) {
          Alert.alert('Session Expired', 'Please login again', [
            {
              text: 'OK',
              onPress: () => {
                AsyncStorage.clear();
                router.replace('/');
              },
            },
          ]);
        } else {
          Alert.alert('Error', 'Failed to load chat. Please try again.');
        }
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (echoRef.current) {
        console.log('🔌 Leaving channel: ride.' + rideId);
        echoRef.current.leave(`ride.${rideId}`);
        echoRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    const tempMessage = text;
    setText(''); // Clear input immediately

    try {
      console.log('📤 Sending message:', tempMessage.substring(0, 50));
      const response = await chatService.sendMessage(tempMessage);
      console.log('✅ Server response:', JSON.stringify(response, null, 2));
      
      // Extract the message from response
      let newMsg: Chat | null = null;
      
      if (response?.data?.data) {
        // Resource format: { data: { data: {...} } }
        newMsg = response.data.data;
      } else if (response?.data) {
        // Simple format: { data: {...} }
        newMsg = response.data;
      }
      
      if (newMsg && newMsg.id) {
        console.log('📨 Adding sent message locally');
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === newMsg!.id);
          if (!exists) {
            return [...prev, newMsg!];
          }
          return prev;
        });
      }
      
    } catch (error: any) {
      console.error('❌ Send message error:', error);
      setText(tempMessage); // Restore text on error
      
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again');
        router.replace('/');
      } else if (error.response?.status === 422) {
        Alert.alert('Error', 'Invalid message or ride ID');
      } else if (error.response?.status === 403) {
        Alert.alert('Error', 'You are not authorized to send messages in this chat');
      } else {
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    }
  };

  const renderItem = ({ item }: { item: Chat }) => {
    if (!item || !item.sender) return null;
    const isMyMessage = item.sender_id === currentUserId;

    return (
      <View style={[styles.messageRow, isMyMessage ? styles.myMessageRow : styles.theirMessageRow]}>
        {!isMyMessage && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.sender.name.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
        )}
        
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble]}>
          {!isMyMessage && (
            <Text style={styles.senderName}>{item.sender.name}</Text>
          )}
          <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
            {item.message}
          </Text>
          <Text style={[styles.timestamp, isMyMessage ? styles.myTimestamp : styles.theirTimestamp]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {isMyMessage && <View style={styles.avatarSpacer} />}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.spinner}>
            <Ionicons name="chatbubbles" size={50} color="#D81B60" />
          </View>
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#C2185B" />
      
      <LinearGradient
        colors={['#C2185B', '#D81B60']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.closeButton}
        >
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerAvatar}>
            <Ionicons name="person" size={20} color="#FFF" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Driver Chat</Text>
            <Text style={styles.headerSubtitle}>Ride #{rideId}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={22} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item?.id?.toString() || `message-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="chatbubbles-outline" size={70} color="#D81B60" opacity={0.2} />
              </View>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start chatting with your driver</Text>
            </View>
          }
        />
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={styles.sendButton}
            disabled={!text.trim()}
          >
            <LinearGradient
              colors={text.trim() ? ['#C2185B', '#D81B60'] : ['#CCC', '#CCC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendButtonGradient}
            >
              <Ionicons name="send" size={22} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE5DD',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ECE5DD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#D81B60',
    fontWeight: '600',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  closeButton: {
    marginRight: 16,
    padding: 4,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 8,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  theirMessageRow: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    marginTop: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8BBD0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#D81B60',
    fontWeight: 'bold',
    fontSize: 14,
  },
  avatarSpacer: {
    width: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 8,
    padding: 8,
    paddingHorizontal: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  myMessageBubble: {
    backgroundColor: '#D81B60',
    borderTopRightRadius: 0,
  },
  theirMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 0,
  },
  senderName: {
    fontSize: 12,
    color: '#D81B60',
    fontWeight: '600',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#000000',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirTimestamp: {
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    color: '#D81B60',
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
  },
  inputContainer: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
    color: '#000',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});