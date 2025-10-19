// app/chat.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createEcho } from '../services/echo';
import { chatService } from '../services/chatService';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Types
type User = { id: number; name: string; role?: string };
type Chat = {
  id: number | string; // Allow temp IDs
  ride_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender: User;
  receiver: User;
  isPending?: boolean; // For optimistic UI
  isFailed?: boolean; // For failed messages
};
type ChatScreenProps = { route: { params: { rideId: number } } };

const CACHE_KEY = 'chat_messages_';
const USER_INFO_CACHE = 'chat_user_info_';

export default function ChatScreen({ route }: ChatScreenProps) {
  const rideId = 4; // Hardcoded for testing
  const router = useRouter();

  // State
  const [messages, setMessages] = useState<Chat[]>([]);
  const [text, setText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [otherParticipant, setOtherParticipant] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const flatListRef = useRef<FlatList<Chat>>(null);
  const echoRef = useRef<any>(null);
  const hasInitialized = useRef(false);

  // --- Cache Helpers ---
  const saveMessagesToCache = async (msgs: Chat[]) => {
    try {
      await AsyncStorage.setItem(`${CACHE_KEY}${rideId}`, JSON.stringify(msgs));
    } catch (err) {
      console.error('Failed to cache messages:', err);
    }
  };

  const loadMessagesFromCache = async (): Promise<Chat[]> => {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEY}${rideId}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('Failed to load cached messages:', err);
    }
    return [];
  };

  const saveUserInfoToCache = async (userId: number, role: string, participant: User | null) => {
    try {
      await AsyncStorage.setItem(
        `${USER_INFO_CACHE}${rideId}`,
        JSON.stringify({ userId, role, participant })
      );
    } catch (err) {
      console.error('Failed to cache user info:', err);
    }
  };

  const loadUserInfoFromCache = async () => {
    try {
      const cached = await AsyncStorage.getItem(`${USER_INFO_CACHE}${rideId}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('Failed to load cached user info:', err);
    }
    return null;
  };

  // --- Helpers ---
  const loadMessages = async () => {
    try {
      const msgs = await chatService.getMessages();
      let msgsArray: Chat[] = [];

      // Handle different response formats
      if (Array.isArray(msgs)) {
        msgsArray = msgs;
      } else if (msgs?.data && Array.isArray(msgs.data)) {
        // Check if data contains objects with 'data' property or direct chat objects
        msgsArray = msgs.data.map((item: any) => {
          // If item has a 'data' property, use it; otherwise use the item itself
          return item.data || item;
        });
      }

      const validMessages = msgsArray.filter((msg: Chat) => msg && msg.id);
      
      console.log('Loaded messages:', validMessages.length);
      
      // Cache the messages
      await saveMessagesToCache(validMessages);
      
      return validMessages;
    } catch (err) {
      console.error('Failed to load messages:', err);
      return [];
    }
  };

  const identifyOtherParticipant = (msgs: Chat[], userId: number | null, role: string | null) => {
    if (msgs.length > 0 && userId) {
      console.log('Identifying other participant. My userId:', userId);
      
      // Look through all messages to find the other participant
      for (const msg of msgs) {
        console.log('Checking message:', {
          sender_id: msg.sender_id,
          sender_name: msg.sender?.name,
          receiver_id: msg.receiver_id,
          receiver_name: msg.receiver?.name
        });
        
        // If sender is not me, they are the other participant
        if (msg.sender_id !== userId && msg.sender) {
          console.log('Found other participant (from sender):', msg.sender.name);
          return msg.sender;
        }
        
        // If receiver is not me, they are the other participant
        if (msg.receiver_id !== userId && msg.receiver) {
          console.log('Found other participant (from receiver):', msg.receiver.name);
          return msg.receiver;
        }
      }
    }
    
    console.log('Could not identify other participant');
    return null;
  };

  const initChat = async () => {
    // Prevent multiple initializations
    if (hasInitialized.current) {
      console.log('Chat already initialized, skipping...');
      return;
    }
    
    hasInitialized.current = true;
    console.log('Initializing chat...');

    try {
      // STEP 1: Load user info FIRST (before anything else)
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'You need to login first');
        router.replace('/');
        return;
      }

      const userIdStr = await AsyncStorage.getItem('user_id');
      const role = await AsyncStorage.getItem('user_role');
      const userId = userIdStr ? Number(userIdStr) : null;

      console.log('Current user loaded:', { userId, role });

      // Set user ID immediately BEFORE loading messages
      setCurrentUserId(userId);
      setCurrentUserRole(role);

      // STEP 2: Load cached data for instant display
      const cachedMessages = await loadMessagesFromCache();
      const cachedUserInfo = await loadUserInfoFromCache();
      
      if (cachedMessages.length > 0) {
        console.log('Loaded', cachedMessages.length, 'cached messages');
        setMessages(cachedMessages);
        setIsLoading(false); // Show cached data immediately
      }
      
      if (cachedUserInfo && cachedUserInfo.participant) {
        setOtherParticipant(cachedUserInfo.participant);
      }

      // STEP 3: Load fresh messages from server (only once)
      console.log('Fetching fresh messages from server...');
      const validMessages = await loadMessages();
      console.log('Received', validMessages.length, 'messages from server');
      setMessages(validMessages);

      // Determine chat participant
      let participant = cachedUserInfo?.participant || identifyOtherParticipant(validMessages, userId, role);
      
      if (!participant && role) {
        try {
          const rideDetails = await chatService.getRideDetails(rideId);
          const ride = rideDetails?.data;
          if (ride) {
            participant =
              role === 'driver' && ride.passenger
                ? { id: ride.passenger.id, name: ride.passenger.name, role: 'passenger' }
                : role === 'passenger' && ride.driver
                ? { id: ride.driver.user_id, name: ride.driver.name || 'Driver', role: 'driver' }
                : null;
          }
        } catch (err) {
          console.log('Could not load ride details:', err);
        }
      }
      setOtherParticipant(participant);

      // Cache user info
      if (userId && role) {
        await saveUserInfoToCache(userId, role, participant);
      }

      // Mark messages as read
      await chatService.markAsRead(rideId);

      // Initialize Echo
      const echo = await createEcho();
      if (!echo) {
        console.warn('Echo not available');
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }
      echoRef.current = echo;

      echo
        .private(`ride.${rideId}`)
        .listen('.NewMessageEvent', handleNewMessage)
        .listen('.MessageReadEvent', (e: any) => {
          console.log('📖 Message read event received');
          // Refresh messages to update read status
          loadMessages().then(freshMessages => {
            setMessages(freshMessages);
          });
        })
        .error((err: any) => {
          console.error('Channel error:', err);
        });

      // Pusher connection status
      echo.connector.pusher.connection.bind('connected', () => {
        console.log('Pusher connected');
        setIsOnline(true);
      });
      echo.connector.pusher.connection.bind('disconnected', () => {
        console.log('Pusher disconnected');
        setIsOnline(false);
      });
      echo.connector.pusher.connection.bind('error', () => {
        console.log('Pusher error');
        setIsOnline(false);
      });

      setIsLoading(false);
      setIsInitialized(true);
      console.log('Chat initialization complete');
    } catch (error: any) {
      console.error('Chat init error:', error);
      hasInitialized.current = false; // Allow retry on error
      
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

  const handleNewMessage = (e: any) => {
    let newMessage: Chat | null = e.chat?.data || e.chat || e.data || e || null;

    if (!newMessage?.id) {
      console.error('Could not extract message:', e);
      return;
    }

    console.log('📩 New message broadcast received:', {
      id: newMessage.id,
      sender_id: newMessage.sender_id,
      is_read: newMessage.is_read
    });

    // Update other participant if not set
    if (!otherParticipant && newMessage.sender_id !== currentUserId) {
      console.log('Setting other participant from new message:', newMessage.sender);
      setOtherParticipant(newMessage.sender);
    }

    setMessages(prev => {
      // Check if this exact message already exists (by ID)
      const existingMsgIndex = prev.findIndex(msg => msg.id === newMessage!.id);
      
      if (existingMsgIndex !== -1) {
        console.log('✓ Message already exists, updating it (including read status)');
        // Update the existing message with new data (especially is_read)
        const updated = [...prev];
        updated[existingMsgIndex] = {
          ...updated[existingMsgIndex],
          ...newMessage!,
          is_read: newMessage!.is_read, // Ensure is_read is updated
        };
        saveMessagesToCache(updated);
        return updated;
      }

      // Remove any pending messages with the same text from the same sender (optimistic UI cleanup)
      const withoutPending = prev.filter(msg => {
        if (typeof msg.id === 'string' && 
            msg.message === newMessage!.message && 
            msg.sender_id === newMessage!.sender_id &&
            msg.isPending) {
          console.log('✓ Removing pending message, replacing with real one');
          return false;
        }
        return true;
      });

      console.log('✓ Adding new message to list');
      const updated = [...withoutPending, newMessage!];
      
      // Cache updated messages (don't await, do in background)
      saveMessagesToCache(updated);
      
      return updated;
    });

    // Auto mark as read if incoming message (from other person)
    if (newMessage.sender_id !== currentUserId) {
      setTimeout(() => chatService.markAsRead(rideId).catch(console.error), 1000);
    }
  };

  // --- Effects ---
  useEffect(() => {
    console.log('🚀 Component mounted, initializing chat once...');
    initChat();

    return () => {
      console.log('🔌 Component unmounting, cleaning up...');
      if (echoRef.current) {
        echoRef.current.leave(`ride.${rideId}`);
        echoRef.current.disconnect();
      }
      hasInitialized.current = false; // Reset for next mount
    };
  }, []); // Empty dependency array - run ONCE on mount

  useEffect(() => {
    // Only scroll when new messages are added AND chat is already initialized
    if (messages.length > 0 && isInitialized) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, isInitialized]); // Only depend on length, not entire messages array

  // --- Actions ---
  const sendMessage = async () => {
    if (!text.trim() || isSending) return;

    const messageText = text.trim();
    setText('');
    setIsSending(true);

    // Create optimistic message with proper user data
    const tempId = `temp-${Date.now()}`;
    
    // Get current user name from AsyncStorage or default
    let currentUserName = 'You';
    try {
      const name = await AsyncStorage.getItem('user_name');
      if (name) currentUserName = name;
    } catch (err) {
      console.log('Could not get user name:', err);
    }

    const optimisticMessage: Chat = {
      id: tempId,
      ride_id: rideId,
      sender_id: currentUserId!,
      receiver_id: otherParticipant?.id || 0,
      message: messageText,
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: {
        id: currentUserId!,
        name: currentUserName,
        role: currentUserRole || undefined,
      },
      receiver: otherParticipant || { id: 0, name: 'Unknown' },
      isPending: true,
      isFailed: false,
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Scroll to bottom
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await chatService.sendMessage(messageText);
      console.log('Send response:', response);
      
      const newMsg: Chat | null = response?.data?.data || response?.data || null;

      if (newMsg?.id) {
        // Replace optimistic message with real one
        setMessages(prev => {
          // Remove the temporary message
          const withoutTemp = prev.filter(msg => msg.id !== tempId);
          
          // Check if the real message already exists (avoid duplicates)
          const messageExists = withoutTemp.some(msg => msg.id === newMsg.id);
          
          if (messageExists) {
            console.log('Real message already exists (from broadcast), just removing temp');
            return withoutTemp;
          }
          
          const updated = [...withoutTemp, newMsg];
          
          // Cache updated messages
          saveMessagesToCache(updated);
          
          return updated;
        });
      } else {
        // If no proper response but no error, just remove pending status
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId ? { ...msg, isPending: false } : msg
          )
        );
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      console.error('Error response:', error.response?.data);

      // Mark message as failed
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId ? { ...msg, isPending: false, isFailed: true } : msg
        )
      );

      if (error.response?.status === 401) {
        router.replace('/');
      } else {
        Alert.alert('Error', 'Failed to send message. Tap the message to retry.');
      }
    } finally {
      setIsSending(false);
    }
  };

  const retryFailedMessage = async (failedMessage: Chat) => {
    if (isSending) return;

    setMessages(prev =>
      prev.map(msg =>
        msg.id === failedMessage.id ? { ...msg, isPending: true, isFailed: false } : msg
      )
    );

    setIsSending(true);

    try {
      const response = await chatService.sendMessage(failedMessage.message);
      const newMsg: Chat | null = response?.data?.data || response?.data || null;

      if (newMsg?.id) {
        setMessages(prev => {
          const withoutFailed = prev.filter(msg => msg.id !== failedMessage.id);
          const updated = [...withoutFailed, newMsg];
          saveMessagesToCache(updated);
          return updated;
        });
      }
    } catch (error) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === failedMessage.id ? { ...msg, isPending: false, isFailed: true } : msg
        )
      );
      Alert.alert('Error', 'Failed to send message again.');
    } finally {
      setIsSending(false);
    }
  };

  // --- Render ---
  const renderItem = ({ item }: { item: Chat }) => {
    if (!item?.sender) return null;
    
    // CRITICAL: Always use sender_id to determine message position
    const isMyMessage = item.sender_id === currentUserId;

    return (
      <TouchableOpacity
        disabled={!item.isFailed}
        onPress={() => item.isFailed && retryFailedMessage(item)}
        style={[styles.messageRow, isMyMessage ? styles.myMessageRow : styles.theirMessageRow]}
      >
        {!isMyMessage && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.sender.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
            item.isPending && styles.pendingMessage,
            item.isFailed && styles.failedMessage,
          ]}
        >
          {!isMyMessage && <Text style={styles.senderName}>{item.sender.name}</Text>}
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText,
            ]}
          >
            {item.message}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.timestamp,
                isMyMessage ? styles.myTimestamp : styles.theirTimestamp,
              ]}
            >
              {new Date(item.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {isMyMessage && (
              <View style={styles.readIconContainer}>
                {item.isPending ? (
                  <ActivityIndicator size="small" color="rgba(255,255,255,0.9)" />
                ) : item.isFailed ? (
                  <Ionicons name="alert-circle" size={18} color="#FF6B6B" />
                ) : (
                  <Ionicons
                    name={item.is_read ? 'checkmark-done' : 'checkmark'}
                    size={18}
                    color={item.is_read ? '#4FC3F7' : 'rgba(255,255,255,0.9)'}
                  />
                )}
              </View>
            )}
          </View>
        </View>
        {isMyMessage && <View style={styles.avatarSpacer} />}
      </TouchableOpacity>
    );
  };

  // --- Loading ---
  if (isLoading && messages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#D81B60" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#C2185B" />

      {/* Header */}
      <LinearGradient
        colors={['#C2185B', '#D81B60']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {otherParticipant?.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              {otherParticipant?.name || 'Loading...'}
            </Text>
            <View style={styles.headerSubtitleRow}>
              <View
                style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#999' }]}
              />
              <Text style={styles.headerSubtitle}>
                {isOnline ? 'Online' : 'Offline'} • Ride #{rideId}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={22} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Messages */}
      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => {
            // Use string ID for temp messages, number ID for real messages
            if (typeof item.id === 'string') return item.id;
            return `msg-${item.id}`;
          }}
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
              <Text style={styles.emptySubtext}>
                Start chatting with {otherParticipant?.name || 'your contact'}
              </Text>
            </View>
          }
        />
      </View>

      {/* Input */}
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
            editable={!isSending}
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={styles.sendButton}
            disabled={!text.trim() || isSending}
          >
            <LinearGradient
              colors={text.trim() && !isSending ? ['#C2185B', '#D81B60'] : ['#CCC', '#CCC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendButtonGradient}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="send" size={22} color="#FFF" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECE5DD' },
  loadingContainer: { flex: 1, backgroundColor: '#ECE5DD', justifyContent: 'center', alignItems: 'center' },
  loadingContent: { alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#D81B60', fontWeight: '600', marginTop: 12 },
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
  closeButton: { marginRight: 16, padding: 4 },
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  headerSubtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  moreButton: { padding: 4 },
  messagesContainer: { flex: 1 },
  messagesList: { padding: 8, flexGrow: 1 },
  messageRow: { flexDirection: 'row', marginVertical: 4, paddingHorizontal: 8 },
  myMessageRow: { justifyContent: 'flex-end' },
  theirMessageRow: { justifyContent: 'flex-start' },
  avatarContainer: { marginRight: 8, marginTop: 4 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8BBD0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#D81B60', fontWeight: 'bold', fontSize: 14 },
  avatarSpacer: { width: 8 },
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
  myMessageBubble: { backgroundColor: '#D81B60', borderTopRightRadius: 0 },
  theirMessageBubble: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 0 },
  pendingMessage: { opacity: 0.7 },
  failedMessage: { backgroundColor: '#FFB3BA' },
  senderName: { fontSize: 12, color: '#D81B60', fontWeight: '600', marginBottom: 2 },
  messageText: { fontSize: 15, lineHeight: 20 },
  myMessageText: { color: '#FFFFFF' },
  theirMessageText: { color: '#000000' },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  timestamp: { fontSize: 10 },
  myTimestamp: { color: 'rgba(255,255,255,0.7)' },
  theirTimestamp: { color: '#999' },
  readIconContainer: { marginLeft: 6, minWidth: 18, alignItems: 'center', justifyContent: 'center' },
  readIcon: { marginLeft: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyIconContainer: { marginBottom: 20 },
  emptyText: { fontSize: 20, color: '#D81B60', fontWeight: '600', marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: '#888' },
  inputContainer: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
  },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end' },
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
  sendButton: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});