// utils/authCache.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthCache {
  token: string | null;
  userId: string | null;
  userRole: string | null;
  userName: string | null;
  userEmail: string | null;
  isGuest: boolean;
  isMock: boolean;
}

class AuthCacheManager {
  private cache: AuthCache = {
    token: null,
    userId: null,
    userRole: null,
    userName: null,
    userEmail: null,
    isGuest: false,
    isMock: false,
  };

  private initialized = false;

  /**
   * Initialize cache from AsyncStorage (call once on app start)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [token, userId, userRole, userName, userEmail, isGuest, isMock] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user_id'),
        AsyncStorage.getItem('user_role'),
        AsyncStorage.getItem('user_name'),
        AsyncStorage.getItem('user_email'),
        AsyncStorage.getItem('is_guest'),
        AsyncStorage.getItem('is_mock'),
      ]);

      this.cache = {
        token,
        userId,
        userRole,
        userName,
        userEmail,
        isGuest: isGuest === 'true',
        isMock: isMock === 'true',
      };

      this.initialized = true;
      console.log('✅ Auth cache initialized');
    } catch (error) {
      console.error('❌ Failed to initialize auth cache:', error);
    }
  }

  /**
   * Get token (instant - no AsyncStorage call)
   */
  getToken(): string | null {
    return this.cache.token;
  }

  /**
   * Get user ID (instant)
   */
  getUserId(): string | null {
    return this.cache.userId;
  }

  /**
   * Get user role (instant)
   */
  getUserRole(): string | null {
    return this.cache.userRole;
  }

  /**
   * Get user name (instant)
   */
  getUserName(): string | null {
    return this.cache.userName;
  }

  /**
   * Get user email (instant)
   */
  getUserEmail(): string | null {
    return this.cache.userEmail;
  }

  /**
   * Check if current session is a guest
   */
  isGuestUser(): boolean {
    return this.cache.isGuest;
  }

  /**
   * Check if current session is a mock/demo user
   */
  isMockUser(): boolean {
    return this.cache.isMock;
  }

  /**
   * Local-only session (guest or mock) — no real API token
   */
  isLocalSession(): boolean {
    return this.cache.isGuest || this.cache.isMock;
  }

  /**
   * Get all cached data
   */
  getAll(): AuthCache {
    return { ...this.cache };
  }

  /**
   * Update cache after login
   */
async setAuthData(data: {
  token: string;
  userId: string;
  userRole: string;
  userName: string;
  userEmail: string;
}): Promise<void> {
  try {
    // Clear old cache first
    await this.clear();

    // Save new values
    await Promise.all([
      AsyncStorage.setItem('token', data.token),
      AsyncStorage.setItem('user_id', data.userId),
      AsyncStorage.setItem('user_role', data.userRole),
      AsyncStorage.setItem('user_name', data.userName),
      AsyncStorage.setItem('user_email', data.userEmail),
      AsyncStorage.removeItem('is_guest'),
      AsyncStorage.removeItem('is_mock'),
    ]);

    // Update in-memory cache
    this.cache = {
      token: data.token,
      userId: data.userId,
      userRole: data.userRole,
      userName: data.userName,
      userEmail: data.userEmail,
      isGuest: false,
      isMock: false,
    };

    this.initialized = true; // Reset and mark initialized again
    console.log('✅ Auth cache updated and reinitialized');
  } catch (error) {
    console.error('❌ Failed to update auth cache:', error);
    throw error;
  }
}


  /**
   * Create a local guest session (browse-only, no API auth)
   */
  async setGuestData(role: 'passenger' | 'driver' = 'passenger'): Promise<void> {
    const guestId = `guest_${Date.now()}`;
    const guestData = {
      token: `guest_token_${guestId}`,
      userId: guestId,
      userRole: role,
      userName: role === 'driver' ? 'Guest Driver' : 'Guest',
      userEmail: '',
    };

    try {
      await Promise.all([
        AsyncStorage.setItem('token', guestData.token),
        AsyncStorage.setItem('user_id', guestData.userId),
        AsyncStorage.setItem('user_role', guestData.userRole),
        AsyncStorage.setItem('user_name', guestData.userName),
        AsyncStorage.setItem('user_email', guestData.userEmail),
        AsyncStorage.setItem('is_guest', 'true'),
      ]);

      this.cache = {
        ...guestData,
        isGuest: true,
        isMock: false,
      };

      this.initialized = true;
      console.log('✅ Guest session created');
    } catch (error) {
      console.error('❌ Failed to create guest session:', error);
      throw error;
    }
  }

  /**
   * Create a local mock/demo session (full app access, no backend)
   */
  async setMockAuthData(data: {
    token: string;
    userId: string;
    userRole: string;
    userName: string;
    userEmail: string;
  }): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem('token', data.token),
        AsyncStorage.setItem('user_id', data.userId),
        AsyncStorage.setItem('user_role', data.userRole),
        AsyncStorage.setItem('user_name', data.userName),
        AsyncStorage.setItem('user_email', data.userEmail),
        AsyncStorage.removeItem('is_guest'),
        AsyncStorage.setItem('is_mock', 'true'),
      ]);

      this.cache = {
        ...data,
        isGuest: false,
        isMock: true,
      };

      this.initialized = true;
      console.log('✅ Mock session created');
    } catch (error) {
      console.error('❌ Failed to create mock session:', error);
      throw error;
    }
  }

  /**
   * Clear cache and AsyncStorage (logout)
   */
  async clear(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem('token'),
        AsyncStorage.removeItem('user_id'),
        AsyncStorage.removeItem('user_role'),
        AsyncStorage.removeItem('user_name'),
        AsyncStorage.removeItem('user_email'),
        AsyncStorage.removeItem('is_guest'),
        AsyncStorage.removeItem('is_mock'),
      ]);

      this.cache = {
        token: null,
        userId: null,
        userRole: null,
        userName: null,
        userEmail: null,
        isGuest: false,
        isMock: false,
      };

      console.log('✅ Auth cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear auth cache:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.cache.token;
  }

  /**
   * Check if cache is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const authCache = new AuthCacheManager();

// Helper function for backward compatibility
export const getAuthToken = (): string | null => {
  return authCache.getToken();
};