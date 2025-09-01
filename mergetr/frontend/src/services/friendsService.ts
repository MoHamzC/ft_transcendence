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

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Pour inclure les cookies d'auth
      ...options,
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
    console.log('🔍 Fetching pending requests...');
    const result = await this.request<{ pending: FriendRequest[] }>('/api/user/friends/pending');
    console.log('📥 Pending requests response:', result);
    return result;
  }

  // Envoyer une demande d'ami par nom d'utilisateur
  static async sendFriendRequest(username: string): Promise<{ message: string }> {
    console.log('🚀 Sending friend request to:', username);
    const result = await this.request<{ message: string }>('/api/user/friends', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    console.log('✅ Friend request sent, result:', result);
    return result;
  }

  // Accepter une demande d'ami
  static async acceptFriendRequest(requesterId: string): Promise<{ message: string }> {
    return this.request('/api/user/friends/accept', {
      method: 'POST',
      body: JSON.stringify({ requesterId }),
    });
  }

  // Rejeter une demande d'ami
  static async rejectFriendRequest(requesterId: string): Promise<{ message: string }> {
    return this.request('/api/user/friends/reject', {
      method: 'POST',
      body: JSON.stringify({ requesterId }),
    });
  }

  // Rechercher des utilisateurs par nom d'utilisateur
  static async searchUsers(query: string): Promise<{ users: any[] }> {
    return this.request(`/api/users/search?q=${encodeURIComponent(query)}`);
  }

  // Supprimer un ami - envoie l'ID dans le body
  static async removeFriend(friendId: string): Promise<{ message: string }> {
    return this.request('/api/user/friends/remove', {
      method: 'POST',
      body: JSON.stringify({ friendId }),
    });
  }
}

export default FriendsService;
