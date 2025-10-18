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
  id: number;
  ride_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender: User;
  receiver: User;
};
type ChatScreenProps = { route: { params: { rideId: number } } };

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

  const flatListRef = useRef<FlatList<Chat>>(null);
  const echoRef = useRef<any>(null);

  // --- Helpers ---
  const loadMessages = async () => {
    try {
      const msgs = await chatService.getMessages();
      let msgsArray: Chat[] = [];

      if (Array.isArray(msgs)) msgsArray = msgs;
      else if (msgs?.data && Array.isArray(msgs.data))
        msgsArray = msgs.data.map((item: any) => item.data || item);

      return msgsArray.filter((msg: Chat) => msg && msg.id);
    } catch (err) {
      console.error('Failed to load messages:', err);
      return [];
    }
  };

  const identifyOtherParticipant = (msgs: Chat[], userId: number | null, role: string | null) => {
    if (msgs.length > 0) {
      const firstMsg = msgs[0];
      return firstMsg.sender_id === userId ? firstMsg.receiver : firstMsg.sender;
    }
    return null;
  };

  const initChat = async () => {
    try {
      // Load user info
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'You need to login first');
        router.replace('/');
        return;
      }

      const userIdStr = await AsyncStorage.getItem('user_id');
      const role = await AsyncStorage.getItem('user_role');
      const userId = userIdStr ? Number(userIdStr) : null;

      setCurrentUserId(userId);
      setCurrentUserRole(role);

      // Load messages
      const validMessages = await loadMessages();
      setMessages(validMessages);

      // Determine chat participant
      let participant = identifyOtherParticipant(validMessages, userId, role);
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

      // Mark messages as read
      await chatService.markAsRead(rideId);

      // Initialize Echo
      const echo = await createEcho();
      if (!echo) {
        Alert.alert('Warning', 'Real-time messaging may not work.');
        setIsLoading(false);
        return;
      }
      echoRef.current = echo;

      echo
        .private(`ride.${rideId}`)
        .listen('.NewMessageEvent', handleNewMessage)
        .error((err: any) => {
          console.error('Channel error:', err);
          Alert.alert('Connection Error', 'Could not connect to chat.');
        });

      // Pusher connection status
      echo.connector.pusher.connection.bind('connected', () => setIsOnline(true));
      echo.connector.pusher.connection.bind('disconnected', () => setIsOnline(false));
      echo.connector.pusher.connection.bind('error', () => setIsOnline(false));

      setIsLoading(false);
    } catch (error: any) {
      console.error('Chat init error:', error);
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
    let newMessage: Chat | null =
      e.chat?.data || e.chat || e.data || e || null;

    if (!newMessage?.id) {
      console.error('Could not extract message:', e);
      return;
    }

    if (!otherParticipant && newMessage.sender_id !== currentUserId) {
      setOtherParticipant(newMessage.sender);
    }

    // Auto mark as read if incoming message
    if (newMessage.sender_id !== currentUserId) {
      setTimeout(() => chatService.markAsRead(rideId).catch(console.error), 1000);
    }

    setMessages(prev => {
      if (prev.some(msg => msg.id === newMessage!.id)) return prev;
      return [...prev, newMessage!];
    });
  };

  // --- Effects ---
  useEffect(() => {
    initChat();

    return () => {
      if (echoRef.current) {
        echoRef.current.leave(`ride.${rideId}`);
        echoRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // --- Actions ---
  const sendMessage = async () => {
    if (!text.trim() || isSending) return;

    const tempMessage = text;
    setText('');
    setIsSending(true);

    try {
      const response = await chatService.sendMessage(tempMessage);
      const newMsg: Chat | null =
        response?.data?.data || response?.data || null;

      if (newMsg?.id) {
        setMessages(prev => (prev.some(msg => msg.id === newMsg!.id) ? prev : [...prev, newMsg!]));
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      setText(tempMessage);

      if (error.response?.status === 401) router.replace('/');
      else Alert.alert('Error', 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  // --- Render ---
  const renderItem = ({ item }: { item: Chat }) => {
    if (!item?.sender) return null;
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
          {!isMyMessage && <Text style={styles.senderName}>{item.sender.name}</Text>}
          <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
            {item.message}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.timestamp, isMyMessage ? styles.myTimestamp : styles.theirTimestamp]}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isMyMessage && (
              <Ionicons
                name={item.is_read ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={item.is_read ? '#4FC3F7' : 'rgba(255,255,255,0.7)'}
                style={styles.readIcon}
              />
            )}
          </View>
        </View>
        {isMyMessage && <View style={styles.avatarSpacer} />}
      </View>
    );
  };

  // --- Loading ---
  if (isLoading) {
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
      <LinearGradient colors={['#C2185B', '#D81B60']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
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
            <Text style={styles.headerTitle}>{otherParticipant?.name || 'Loading...'}</Text>
            <View style={styles.headerSubtitleRow}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#999' }]} />
              <Text style={styles.headerSubtitle}>{isOnline ? 'Online' : 'Offline'} • Ride #{rideId}</Text>
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
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton} disabled={!text.trim() || isSending}>
            <LinearGradient
              colors={text.trim() && !isSending ? ['#C2185B', '#D81B60'] : ['#CCC', '#CCC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendButtonGradient}
            >
              {isSending ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="send" size={22} color="#FFF" />}
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
  header: { paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  closeButton: { marginRight: 16, padding: 4 },
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
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
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F8BBD0', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#D81B60', fontWeight: 'bold', fontSize: 14 },
  avatarSpacer: { width: 8 },
  messageBubble: { maxWidth: '75%', borderRadius: 8, padding: 8, paddingHorizontal: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
  myMessageBubble: { backgroundColor: '#D81B60', borderTopRightRadius: 0 },
  theirMessageBubble: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 0 },
  senderName: { fontSize: 12, color: '#D81B60', fontWeight: '600', marginBottom: 2 },
  messageText: { fontSize: 15, lineHeight: 20 },
  myMessageText: { color: '#FFFFFF' },
  theirMessageText: { color: '#000000' },
  messageFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4, justifyContent: 'flex-end' },
  timestamp: { fontSize: 10 },
  myTimestamp: { color: 'rgba(255,255,255,0.7)' },
  theirTimestamp: { color: '#999' },
  readIcon: { marginLeft: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyIconContainer: { marginBottom: 20 },
  emptyText: { fontSize: 20, color: '#D81B60', fontWeight: '600', marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: '#888' },
  inputContainer: { backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#DDD' },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, paddingTop: 10, fontSize: 15, maxHeight: 100, marginRight: 8, color: '#000', borderWidth: 1, borderColor: '#DDD' },
  sendButton: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  sendButtonGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
});
