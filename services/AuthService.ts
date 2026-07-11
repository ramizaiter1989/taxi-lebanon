import axios from "axios";
import { API_BASE_URL, MOCK_USERS, MockUser } from "../constants/config";

// --- Request and Response Types ---
interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  role: "passenger" | "driver";
}

interface OtpPayload {
  phone: string;
  code: string; // ✅ Must match Laravel backend
}

interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: "passenger" | "driver";
}

export interface AuthResponse {
  message?: string;
  error?: string;
  data?: any;
}

// --- Auth Functions ---

// Register + send OTP
export const register = async (formData: any) => {
  const response = await axios.post(`${API_BASE_URL}/register`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};


// Verify OTP
export const verifyOtp = async (payload: OtpPayload): Promise<AuthResponse> => {
  const response = await axios.post(`${API_BASE_URL}/otp/verify`, payload);
  return response.data as AuthResponse;
};

// Resend OTP
export const resendOtp = async (phone: string): Promise<AuthResponse> => {
  const response = await axios.post(`${API_BASE_URL}/otp/resend`, { phone });
  return response.data;
};

// Login
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await axios.post(`${API_BASE_URL}/login`, credentials);
  return response.data;
};

// Logout
export const logout = async (token: string) => {
  return axios.post(
    `${API_BASE_URL}/logout`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
};

// Guest login (local session — browse app, sign up required for real actions)
export const guestLogin = async (role: 'passenger' | 'driver' = 'passenger') => {
  const { authCache } = await import('../utils/authCache');
  await authCache.setGuestData(role);
};

// Mock login (local demo accounts — no backend call)
export const findMockUser = (email: string, password: string): MockUser | null => {
  const normalizedEmail = email.trim().toLowerCase();
  return (
    MOCK_USERS.find(
      (user) =>
        user.email.toLowerCase() === normalizedEmail && user.password === password
    ) ?? null
  );
};

export const mockLogin = async (email: string, password: string): Promise<MockUser | null> => {
  const user = findMockUser(email, password);
  if (!user) return null;

  const { authCache } = await import('../utils/authCache');
  await authCache.setMockAuthData({
    token: `mock_token_${user.id}`,
    userId: user.id,
    userRole: user.role,
    userName: user.name,
    userEmail: user.email,
  });

  return user;
};
