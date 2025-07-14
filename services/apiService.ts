import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

// Storage keys
const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface Booking {
  id: string;
  propertyId: string;
  propertyName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  checkIn: string;
  checkOut: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  tasks: Task[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  bookingId: string;
  title: string;
  description: string;
  type: 'cleaning' | 'maintenance' | 'inspection' | 'setup' | 'other';
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  estimatedDuration: number; // in minutes
  completedAt?: string;
  notes?: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  type: 'apartment' | 'house' | 'condo' | 'other';
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  instructions?: string;
  keyLocation?: string;
  wifiPassword?: string;
  emergencyContacts: Array<{
    name: string;
    phone: string;
    role: string;
  }>;
}

class ApiService {
  private authToken: string | null = null;

  constructor() {
    this.loadAuthToken();
  }

  // Load stored auth token
  private async loadAuthToken(): Promise<void> {
    try {
      this.authToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  // Store auth token
  private async storeAuthToken(token: string): Promise<void> {
    try {
      this.authToken = token;
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to store auth token:', error);
    }
  }

  // Remove auth token
  private async removeAuthToken(): Promise<void> {
    try {
      this.authToken = null;
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove auth token:', error);
    }
  }

  // Generic API request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Add API key if available
      if (API_KEY) {
        headers['X-API-Key'] = API_KEY;
      }

      // Add auth token if available
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data?.token) {
      await this.storeAuthToken(response.data.token);
      if (response.data.refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
      }
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      await this.removeAuthToken();
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return false;

      const response = await this.request<{ token: string }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      if (response.success && response.data?.token) {
        await this.storeAuthToken(response.data.token);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    return false;
  }

  // Booking methods
  async getBookings(filters?: {
    status?: string;
    date?: string;
    propertyId?: string;
  }): Promise<ApiResponse<Booking[]>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.propertyId) params.append('propertyId', filters.propertyId);

    const queryString = params.toString();
    const endpoint = `/bookings${queryString ? `?${queryString}` : ''}`;

    return this.request<Booking[]>(endpoint);
  }

  async getBooking(id: string): Promise<ApiResponse<Booking>> {
    return this.request<Booking>(`/bookings/${id}`);
  }

  async updateBookingStatus(
    id: string,
    status: Booking['status'],
    notes?: string
  ): Promise<ApiResponse<Booking>> {
    return this.request<Booking>(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  // Task methods
  async getTasks(bookingId?: string): Promise<ApiResponse<Task[]>> {
    const endpoint = bookingId ? `/tasks?bookingId=${bookingId}` : '/tasks';
    return this.request<Task[]>(endpoint);
  }

  async updateTaskStatus(
    id: string,
    status: Task['status'],
    notes?: string
  ): Promise<ApiResponse<Task>> {
    return this.request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ 
        status, 
        notes,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined
      }),
    });
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Task>> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  // Property methods
  async getProperties(): Promise<ApiResponse<Property[]>> {
    return this.request<Property[]>('/properties');
  }

  async getProperty(id: string): Promise<ApiResponse<Property>> {
    return this.request<Property>(`/properties/${id}`);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  // Get current auth token
  getAuthToken(): string | null {
    return this.authToken;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;

// Export types for use in components
export type {
  ApiResponse,
  LoginCredentials,
  AuthResponse,
  Booking,
  Task,
  Property,
};
