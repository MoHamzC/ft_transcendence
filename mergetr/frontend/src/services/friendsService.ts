// services/friendsService.ts
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

export interface Friend {
  id: string;
  email: string;
  username: string;
  status: string;
  friendship_date?: string;
  request_date?: string;
}

export interface FriendRequest {
  id: string;
  email: string;
  username: string;
  status: string;
  request_date: string;
}

export class FriendsService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BACKEND_URL}${endpoint}`;
    // Build headers conditionally: only set Content-Type when a body exists
    const headers: Record<string, string> = {
      ...((options && options.headers) as Record<string, string>),
    };

    // If a body is provided and it's not a FormData, ensure JSON content-type
    if (options && (options as any).body !== undefined && !(options as any).body instanceof FormData) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    // Spread options first so our computed headers take precedence
    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Pour inclure les cookies d'auth
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Friends API request failed:', error);
      throw error;
    }
  }

  // Récupérer la liste des amis
  static async getFriends(): Promise<{ friends: Friend[] }> {
    return this.request('/api/user/friends');
  }

  // Récupérer les demandes d'amis en attente
  static async getPendingRequests(): Promise<{ pending: FriendRequest[] }> {
    return this.request('/api/user/friends/pending');
  }

  // Envoyer une demande d'ami par nom d'utilisateur
  static async sendFriendRequest(username: string): Promise<{ message: string }> {
    return this.request('/api/user/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
  }

  // Accepter une demande d'ami
  static async acceptFriendRequest(requesterId: string): Promise<{ message: string }> {
    return this.request('/api/user/friends/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId }),
    });
  }

  // Rejeter une demande d'ami
  static async rejectFriendRequest(requesterId: string): Promise<{ message: string }> {
    return this.request('/api/user/friends/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId }),
    });
  }

  // Rechercher des utilisateurs par nom d'utilisateur
  static async searchUsers(query: string): Promise<{ users: any[] }> {
    return this.request(`/api/users/search?q=${encodeURIComponent(query)}`);
  }

  // Supprimer un ami (non implémenté dans le backend actuel)
  static async removeFriend(friendId: string): Promise<{ message: string }> {
    return this.request(`/api/user/friends/${friendId}`, {
      method: 'DELETE',
    });
  }
}

export default FriendsService;
