import axios from 'axios';

// 🛑 CRITICAL FIX: Changed 'localhost' to '10.0.2.2' for Android Emulator access.
const API_BASE_URL = 'https://4f7abfb7d80b.ngrok-free.app/api'; 

// --- 1. Define Request and Response Types ---

// The structure of the data sent to the login endpoint
interface LoginCredentials {
  email: string;
  password: string;
}

// The expected structure of the successful response from the Laravel API
export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: 'client' | 'rider'; // Assuming roles are used for routing
    // Add any other user fields you need
  };
}

// --- 2. The Core Login Function ---

/**
 * Sends a POST request to the Laravel /api/login endpoint.
 * @param credentials - Object containing email and password.
 * @returns A promise that resolves with the LoginResponse data on success.
 * @throws An error if the request fails (e.g., network error or 401 unauthorized).
 */
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  // NOTE: If API_BASE_URL already includes '/api', the URL here should be:
  const url = `${API_BASE_URL}/login`; // This resolves to http://10.0.2.2:8000/api/login

  try {
    // Axios handles the JSON serialization of the credentials object
    const response = await axios.post<LoginResponse>(url, credentials);
    
    // Return the data directly from the response
    return response.data;
  } catch (error) {
    // Re-throw the error so the calling component (LoginScreen) can handle it
    throw error;
  }
};

// --- 3. Example of another service function (Optional) ---

/**
 * You could add other authentication functions here, like register or logout.
 */
// export const register = async (data: RegisterData): Promise<LoginResponse> => { ... };