// services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export class ApiService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Pour inclure les cookies
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Health check
  static async healthCheck(): Promise<{ ok: boolean; ts: number }> {
    return this.request('/healthz');
  }

  // Auth endpoints
  static async login(credentials: { email: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  static async register(userData: { 
    username: string; 
    email: string; 
    password: string 
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  static async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  static async getCurrentUser() {
    return this.request('/auth/me');
  }

  // User endpoints
  static async getUsers() {
    return this.request('/api/users');
  }

  static async getUserById(id: string) {
    return this.request(`/api/users/${id}`);
  }

  // Game stats endpoints
  static async getGameStats(userId?: string) {
    const endpoint = userId ? `/api/stats/${userId}` : '/api/stats';
    return this.request(endpoint);
  }

  static async getLeaderboard() {
    return this.request('/api/leaderboard');
  }

  // Friends endpoints
  static async getFriends() {
    return this.request('/api/friends');
  }

  static async addFriend(username: string) {
    return this.request('/api/friends', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }
}

export default ApiService;
