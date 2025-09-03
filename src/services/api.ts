const API_BASE_URL = 'http://localhost:3001/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Dashboard stats
  async getStats() {
    return this.request('/stats');
  }

  // Users
  async getUsers() {
    return this.request('/users');
  }

  async createUser(userData: FormData) {
    return fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      body: userData, // Don't set Content-Type for FormData
    }).then(res => res.json());
  }

  // Attendance
  async getAttendance(filters?: { date?: string; user_id?: number }) {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.user_id) params.append('user_id', filters.user_id.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/attendance${query}`);
  }

  async markAttendance(userId: number, status: string = 'present') {
    return this.request('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, status }),
    });
  }

  // Face recognition
  async startRecognition() {
    return this.request('/recognition/start', {
      method: 'POST',
    });
  }

  // Weekly data for charts
  async getWeeklyData() {
    return this.request('/attendance/weekly');
  }
}

export const apiService = new ApiService();