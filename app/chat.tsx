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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Types
type User = { id: number; name: string; role?: string | null };

type Chat = {
  id: number | string;
  ride_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender: User;
  receiver: User;
  isPending?: boolean;
  isFailed?: boolean;
};

const CACHE_KEY = 'chat_messages_';
const USER_INFO_CACHE = 'chat_user_info_';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // State
  const [rideId, setRideId] = useState<number | null>(null);
  const [isLoadingRideId, setIsLoadingRideId] = useState(true);
  const [rideIdError, setRideIdError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Chat[]>([]);
  const [text, setText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [otherParticipant, setOtherParticipant] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs
  const flatListRef = useRef<FlatList<Chat>>(null);
  const echoRef = useRef<any>(null);
  const hasInitialized = useRef(false);

  // --- Helpers ---
  const saveMessagesToCache = async (msgs: Chat[]) => {
    if (!rideId) return;
    try {
      await AsyncStorage.setItem(`${CACHE_KEY}${rideId}`, JSON.stringify(msgs));
    } catch (err) {
      console.error('Failed to cache messages:', err);
    }
  };

  const loadMessagesFromCache = async (): Promise<Chat[]> => {
    if (!rideId) return [];
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEY}${rideId}`);
      return cached ? JSON.parse(cached) : [];
    } catch (err) {
      console.error('Failed to load cached messages:', err);
      return [];
    }
  };

  const saveUserInfoToCache = async (userId: number, role: string, participant: User | null) => {
    if (!rideId) return;
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
    if (!rideId) return null;
    try {
      const cached = await AsyncStorage.getItem(`${USER_INFO_CACHE}${rideId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      console.error('Failed to load cached user info:', err);
      return null;
    }
  };

  const loadMessages = async () => {
    if (!rideId) return [];
    try {
      const msgs = await chatService.getMessages(rideId);
      const msgsArray = Array.isArray(msgs)
        ? msgs
        : msgs?.data?.map((item: any) => item.data || item) || [];
      const validMessages = msgsArray.filter((msg: Chat) => msg && msg.id);
      await saveMessagesToCache(validMessages);
      return validMessages;
    } catch (err) {
      console.error('Failed to load messages:', err);
      return [];
    }
  };

  const identifyOtherParticipant = (msgs: Chat[], userId: number | null, role: string | null) => {
    if (!msgs.length || !userId) return null;
    for (const msg of msgs) {
      if (msg.sender_id !== userId && msg.sender) return msg.sender;
      if (msg.receiver_id !== userId && msg.receiver) return msg.receiver;
    }
    return null;
  };

  // --- Event Handlers ---
  const handleNewMessage = (e: any) => {
    const newMessage: Chat | null = e.chat?.data || e.chat || e.data || e || null;
    if (!newMessage?.id) {
      console.error('Could not extract message:', e);
      return;
    }
    console.log('📩 New message received:', { id: newMessage.id, is_read: newMessage.is_read });
    if (!otherParticipant && newMessage.sender_id !== currentUserId) {
      setOtherParticipant(newMessage.sender);
    }
    setMessages(prev => {
      const existingMsgIndex = prev.findIndex(msg => msg.id === newMessage!.id);
      if (existingMsgIndex !== -1) {
        const updated = [...prev];
        updated[existingMsgIndex] = { ...updated[existingMsgIndex], ...newMessage!, is_read: newMessage!.is_read };
        saveMessagesToCache(updated);
        return updated;
      }
      const withoutPending = prev.filter(msg => {
        if (typeof msg.id === 'string' && msg.message === newMessage!.message && msg.sender_id === newMessage!.sender_id && msg.isPending) {
          return false;
        }
        return true;
      });
      const updated = [...withoutPending, newMessage!];
      saveMessagesToCache(updated);
      return updated;
    });
    if (newMessage.sender_id !== currentUserId && rideId) {
      setTimeout(() => chatService.markAsRead(rideId).catch(console.error), 1000);
    }
  };

  const handleMessageReadEvent = (e: any) => {
    const { messageId } = e;
    console.log('📖 Message read event received:', { messageId });
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, is_read: true } : msg
      )
    );
  };

  // --- Actions ---
  const sendMessage = async () => {
    if (!text.trim() || isSending || !rideId) return;
    const messageText = text.trim();
    setText('');
    setIsSending(true);
    const tempId = `temp-${Date.now()}`;
    const currentUserName = await AsyncStorage.getItem('user_name').catch(() => 'You');
    const optimisticMessage: Chat = {
      id: tempId,
      ride_id: rideId,
      sender_id: currentUserId!,
      receiver_id: otherParticipant?.id || 0,
      message: messageText,
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: { id: currentUserId!, name: currentUserName || 'You', role: currentUserRole },
      receiver: otherParticipant || { id: 0, name: 'Unknown' },
      isPending: true,
      isFailed: false,
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const response = await chatService.sendMessage(rideId, messageText);
      const newMsg: Chat | null = response?.data?.data || response?.data || null;
      if (newMsg?.id) {
        setMessages(prev => {
          const withoutTemp = prev.filter(msg => msg.id !== tempId);
          const messageExists = withoutTemp.some(msg => msg.id === newMsg.id);
          if (messageExists) return withoutTemp;
          const updated = [...withoutTemp, newMsg];
          saveMessagesToCache(updated);
          return updated;
        });
      } else {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId ? { ...msg, isPending: false } : msg
          )
        );
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId ? { ...msg, isPending: false, isFailed: true } : msg
        )
      );
      if (error.response?.status === 401) {
        setTimeout(() => router.replace('/'), 100);
      } else {
        Alert.alert('Error', 'Failed to send message. Tap the message to retry.');
      }
    } finally {
      setIsSending(false);
    }
  };

  const retryFailedMessage = async (failedMessage: Chat) => {
    if (isSending || !rideId) return;
    setMessages(prev =>
      prev.map(msg =>
        msg.id === failedMessage.id ? { ...msg, isPending: true, isFailed: false } : msg
      )
    );
    setIsSending(true);
    try {
      const response = await chatService.sendMessage(rideId, failedMessage.message);
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

  // --- Initialization ---
  const initChat = async () => {
    if (hasInitialized.current || !rideId) return;
    hasInitialized.current = true;
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'You need to login first', [{ text: 'OK', onPress: () => router.replace('/') }]);
        return;
      }
      const userId = Number(await AsyncStorage.getItem('user_id'));
      const role = await AsyncStorage.getItem('user_role');
      setCurrentUserId(userId);
      setCurrentUserRole(role);
      const cachedMessages = await loadMessagesFromCache();
      const cachedUserInfo = await loadUserInfoFromCache();
      if (cachedMessages.length) setMessages(cachedMessages);
      if (cachedUserInfo?.participant) setOtherParticipant(cachedUserInfo.participant);
      const validMessages = await loadMessages();
      setMessages(validMessages);
      let participant = identifyOtherParticipant(validMessages, userId, role);
      if (!participant && cachedUserInfo?.participant) participant = cachedUserInfo.participant;
      if (!participant && role && userId) {
        const rideDetails = await chatService.getRideDetails(rideId);
        const ride = rideDetails?.data;
        if (ride) {
          if (role === 'passenger' && ride.driver?.user) {
            participant = { id: ride.driver.user.id, name: ride.driver.user.name || 'Driver', role: 'driver' };
          } else if (role === 'driver' && ride.passenger) {
            participant = { id: ride.passenger.id, name: ride.passenger.name || 'Passenger', role: 'passenger' };
          } else if (ride.driver?.user?.id === userId && ride.passenger) {
            participant = { id: ride.passenger.id, name: ride.passenger.name || 'Passenger', role: 'passenger' };
          } else if (ride.passenger?.id === userId && ride.driver?.user) {
            participant = { id: ride.driver.user.id, name: ride.driver.user.name || 'Driver', role: 'driver' };
          }
        }
      }
      setOtherParticipant(participant);
      if (userId && role) await saveUserInfoToCache(userId, role, participant);
      await chatService.markAsRead(rideId);
      const echo = await createEcho();
      if (!echo) {
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }
      echoRef.current = echo;
      echo
        .private(`ride.${rideId}`)
        .listen('.NewMessageEvent', handleNewMessage)
        .listen('.MessageReadEvent', handleMessageReadEvent)
        .error((err: any) => console.error('Channel error:', err));
      echo.connector.pusher.connection.bind('connected', () => setIsOnline(true));
      echo.connector.pusher.connection.bind('disconnected', () => setIsOnline(false));
      echo.connector.pusher.connection.bind('error', () => setIsOnline(false));
      setIsLoading(false);
      setIsInitialized(true);
    } catch (error: any) {
      console.error('Chat init error:', error);
      hasInitialized.current = false;
      if (error.response?.status === 401) {
        AsyncStorage.clear().then(() => router.replace('/'));
      } else {
        Alert.alert('Error', 'Failed to load chat. Please try again.');
      }
      setIsLoading(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    const getRideId = async () => {
      try {
        let id = params.rideId ? Number(params.rideId) : null;
        if (!id || isNaN(id)) {
          const cachedRideId = await AsyncStorage.getItem('current_ride_id');
          if (cachedRideId) id = Number(cachedRideId);
        }
        if (!id || isNaN(id)) {
          setRideIdError('No active ride found');
          setIsLoadingRideId(false);
          return;
        }
        setRideId(id);
        setIsLoadingRideId(false);
      } catch (error) {
        setRideIdError('Failed to load ride information');
        setIsLoadingRideId(false);
      }
    };
    getRideId();
  }, [params.rideId]);

  useEffect(() => {
    if (rideIdError && !isLoadingRideId) {
      const timer = setTimeout(() => {
        Alert.alert('Error', rideIdError, [{
          text: 'OK',
          onPress: () => router.canGoBack() ? router.back() : router.replace('/(client)/home'),
        }]);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [rideIdError, isLoadingRideId]);

  useEffect(() => {
    if (rideId && !isLoadingRideId && !rideIdError) initChat();
    return () => {
      if (echoRef.current && rideId) {
        echoRef.current.leave(`ride.${rideId}`);
        echoRef.current.disconnect();
      }
      hasInitialized.current = false;
    };
  }, [rideId, isLoadingRideId, rideIdError]);

  useEffect(() => {
    if (messages.length > 0 && isInitialized) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, isInitialized]);

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
        <TouchableOpacity
          disabled={!item.isFailed}
          onPress={() => item.isFailed && retryFailedMessage(item)}
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
            item.isPending && styles.pendingMessage,
            item.isFailed && styles.failedMessage,
          ]}
        >
          {!isMyMessage && <Text style={styles.senderName}>{item.sender.name}</Text>}
          <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
            {item.message}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.timestamp, isMyMessage ? styles.myTimestamp : styles.theirTimestamp]}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isMyMessage && (
              <View style={styles.readIconContainer}>
                {item.isPending ? (
                  <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
                ) : item.isFailed ? (
                  <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
                ) : (
                  <Ionicons
                    name={item.is_read ? 'checkmark-done' : 'checkmark'}
                    size={16}
                    color={item.is_read ? '#4FC3F7' : 'rgba(255,255,255,0.7)'}
                  />
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
        {isMyMessage && <View style={styles.avatarSpacer} />}
      </View>
    );
  };

  // --- Loading States ---
  if (isLoadingRideId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D81B60" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }
  if (rideIdError) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle" size={60} color="#D81B60" />
        <Text style={styles.errorText}>{rideIdError}</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/(client)/home')}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (isLoading && messages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D81B60" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  // --- Main Render ---
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#C2185B" />
      {/* Header */}
      <LinearGradient colors={['#C2185B', '#D81B60']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(client)/home')} style={styles.closeButton}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{otherParticipant?.name?.charAt(0).toUpperCase() || '?'}</Text>
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
          keyExtractor={(item) => (typeof item.id === 'string' ? item.id : `msg-${item.id}`)}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={70} color="#D81B60" opacity={0.2} />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start chatting with {otherParticipant?.name || 'your contact'}</Text>
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
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loadingContainer: { flex: 1, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#5B6B8C', fontWeight: '600', marginTop: 12 },
  errorText: { fontSize: 16, color: '#E74C3C', fontWeight: '600', marginTop: 16, textAlign: 'center', paddingHorizontal: 32 },
  errorButton: { marginTop: 20, backgroundColor: '#5B6B8C', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, elevation: 2 },
  errorButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  header: { paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  closeButton: { marginRight: 16, padding: 4 },
  headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  headerAvatarText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', letterSpacing: 0.3 },
  headerSubtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  moreButton: { padding: 4 },
  messagesContainer: { flex: 1, backgroundColor: '#F5F7FA' },
  messagesList: { padding: 12, flexGrow: 1 },
  messageRow: { flexDirection: 'row', marginVertical: 6, paddingHorizontal: 4, alignItems: 'flex-end' },
  myMessageRow: { justifyContent: 'flex-end', paddingLeft: '20%' },
  theirMessageRow: { justifyContent: 'flex-start', paddingRight: '20%' },
  avatarContainer: { marginRight: 8, marginBottom: 4 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8EBF0', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  avatarText: { color: '#5B6B8C', fontWeight: '700', fontSize: 15 },
  avatarSpacer: { width: 8 },
  messageBubble: { maxWidth: '80%', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  myMessageBubble: { backgroundColor: '#5B6B8C', borderBottomRightRadius: 4, marginLeft: 'auto' },
  theirMessageBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E8EBF0' },
  pendingMessage: { opacity: 0.65 },
  failedMessage: { backgroundColor: '#FFE5E5', borderWidth: 1, borderColor: '#FFB3BA' },
  senderName: { fontSize: 12, color: '#5B6B8C', fontWeight: '700', marginBottom: 4, letterSpacing: 0.2 },
  messageText: { fontSize: 15, lineHeight: 21, letterSpacing: 0.2 },
  myMessageText: { color: '#FFFFFF' },
  theirMessageText: { color: '#2C3E50' },
  messageFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 6, justifyContent: 'flex-end' },
  timestamp: { fontSize: 11, fontWeight: '500', letterSpacing: 0.2 },
  myTimestamp: { color: 'rgba(255,255,255,0.75)' },
  theirTimestamp: { color: '#95A5B8' },
  readIconContainer: { marginLeft: 6, minWidth: 16, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyIconContainer: { marginBottom: 20, backgroundColor: '#E8EBF0', padding: 24, borderRadius: 50 },
  emptyText: { fontSize: 20, color: '#5B6B8C', fontWeight: '700', marginBottom: 8, letterSpacing: 0.3 },
  emptySubtext: { fontSize: 15, color: '#95A5B8', textAlign: 'center', lineHeight: 22 },
  inputContainer: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E8EBF0', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#F5F7FA', borderRadius: 24, paddingRight: 4, borderWidth: 1, borderColor: '#E8EBF0' },
  input: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16, paddingVertical: 10, paddingTop: 10, fontSize: 15, maxHeight: 100, color: '#2C3E50', letterSpacing: 0.2 },
  sendButton: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', marginLeft: 4 },
  sendButtonGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
});
