// services/friendsService.js (converted from TypeScript)
// Provides friend & presence related API calls.
// Fix: always send a JSON body when using method POST with application/json to avoid
//      backend/body parser errors like: "Body cannot be empty when content-type is set to 'application/json'".

const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL || 'http://localhost:5001';

// JSDoc typedefs to retain editor IntelliSense
/**
 * @typedef {Object} Friend
 * @property {string} id
 * @property {string} email
 * @property {string} username
 * @property {string} status
 * @property {string=} friendship_date
 * @property {string=} request_date
 */

/**
 * @typedef {Object} FriendRequest
 * @property {string} id
 * @property {string} email
 * @property {string} username
 * @property {string} status
 * @property {string} request_date
 */

export class FriendsService {
  static async request(endpoint, options = {}) {
    const url = `${BACKEND_URL}${endpoint}`;

    const isJson = (options.headers && options.headers['Content-Type']) || true;

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    // Ensure POST/PUT/PATCH with json content-type always has a body (at least '{}')
    const method = (options.method || 'GET').toUpperCase();
    let body = options.body;
    if (['POST', 'PUT', 'PATCH'].includes(method) && headers['Content-Type']?.includes('application/json')) {
      if (body === undefined || body === null || body === '') {
        body = '{}';
      } else if (typeof body === 'object' && !(body instanceof FormData)) {
        body = JSON.stringify(body);
      }
    }

    const config = {
      ...options,
      method,
      headers,
      credentials: 'include',
      body
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        let errorData = {};
        try { errorData = await response.json(); } catch (_) {}
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Some heartbeat endpoints may return minimal JSON
      try {
        return await response.json();
      } catch (_) {
        return {};
      }
    } catch (error) {
      console.error('Friends API request failed:', error);
      throw error;
    }
  }

  static async getFriends() {
    return this.request('/api/user/friends');
  }

  static async getPendingRequests() {
    console.log('🔍 Fetching pending requests...');
    const result = await this.request('/api/user/friends/pending');
    console.log('📥 Pending requests response:', result);
    return result;
  }

  static async sendFriendRequest(username) {
    console.log('🚀 Sending friend request to:', username);
    const result = await this.request('/api/user/friends', {
      method: 'POST',
      body: { username }
    });
    console.log('✅ Friend request sent, result:', result);
    return result;
  }

  static async acceptFriendRequest(requesterId) {
    return this.request('/api/user/friends/accept', {
      method: 'POST',
      body: { requesterId }
    });
  }

  static async rejectFriendRequest(requesterId) {
    return this.request('/api/user/friends/reject', {
      method: 'POST',
      body: { requesterId }
    });
  }

  static async searchUsers(query) {
    return this.request(`/api/users/search?q=${encodeURIComponent(query)}`);
  }

  static async removeFriend(friendId) {
    return this.request('/api/user/friends/remove', {
      method: 'POST',
      body: { friendId }
    });
  }

  static async getFriendsWithStatus() {
    return this.request('/api/user/friends/status');
  }

  static async sendHeartbeat() {
    // Always send a body to satisfy backend JSON body parser
    return this.request('/api/user/heartbeat', { method: 'POST', body: {} });
  }

  static async setOfflineStatus() {
    return this.request('/api/user/logout-status', { method: 'POST', body: {} });
  }

  static async cleanupInactiveUsers() {
    return this.request('/api/user/cleanup-inactive', { method: 'POST', body: {} });
  }
}

export default FriendsService;
