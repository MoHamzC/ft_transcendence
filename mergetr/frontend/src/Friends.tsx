import { useState, useEffect, useRef } from 'react';
import FriendsService from './services/friendsService';
// Local TS interfaces now that service converted to JS
interface Friend { id: string; email: string; username: string; status: string; friendship_date?: string; request_date?: string }
interface FriendRequest { id: string; email: string; username: string; status: string; request_date: string }
import AddFriendModal from './components/AddFriendModal';
import FriendCard from './components/FriendCard';
import './Friends.css';
import FuzzyText from './FuzzyText.tsx';

export default function Friends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // error displayed below if non-empty
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'pending'>('friends');

  // Intervalles pour heartbeat et polling statut
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusPollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const [friendsResponse, pendingResponse] = await Promise.all([
        FriendsService.getFriendsWithStatus(), // Utilise la nouvelle méthode avec statut
        FriendsService.getPendingRequests()
      ]);
      setFriends(friendsResponse.friends);
      setPendingRequests(pendingResponse.pending);
      setError('');
    } catch (err: any) {
      setError(err.message || 'error loading friends');
      console.error('Error loading friends:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour envoyer le heartbeat
  const sendHeartbeat = async () => {
    try {
      await FriendsService.sendHeartbeat();
      // Nettoyer les utilisateurs inactifs
      await FriendsService.cleanupInactiveUsers();
      // Recharger la liste des amis pour mettre à jour les statuts
      const friendsResponse = await FriendsService.getFriendsWithStatus();
      setFriends(friendsResponse.friends);
    } catch (err) {
      console.error('Error sending heartbeat:', err);
    }
  };

  const pollStatus = async () => {
    try {
      const friendsResponse = await FriendsService.getFriendsWithStatus();
  setFriends(friendsResponse.friends);
    } catch (err) {
      console.error('Error polling status:', err);
    }
  };

  useEffect(() => {
    loadFriends();

  // Heartbeat toutes les 30 secondes (suffisant pour présence)
  heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30 * 1000);
  // Poll statut toutes les 5 secondes pour réactivité UI
  statusPollIntervalRef.current = setInterval(pollStatus, 5 * 1000);

    // Envoyer un heartbeat initial
    sendHeartbeat();

    // Marquer comme offline lors de la fermeture du navigateur
    const handleBeforeUnload = () => {
      FriendsService.setOfflineStatus().catch(console.error);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
  if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
  if (statusPollIntervalRef.current) clearInterval(statusPollIntervalRef.current);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Marquer comme offline lors du démontage du composant
      FriendsService.setOfflineStatus().catch(console.error);
    };
  }, []);


  const handleAcceptFriend = async (requesterId: string) => {
    try {
      await FriendsService.acceptFriendRequest(requesterId);
      await loadFriends();
    } catch (err: any) {
      setError(err.message || 'Error accepting friend request');
    }
  };

  const handleRejectFriend = async (requesterId: string) => {
    try {
      await FriendsService.rejectFriendRequest(requesterId);
      await loadFriends();
    } catch (err: any) {
      setError(err.message || 'Error rejecting friend request');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await FriendsService.removeFriend(friendId);
      await loadFriends();
    } catch (err: any) {
      setError(err.message || 'Error removing friend');
    }
  };


  return (
    <div>
      <div>
        <div className="flex justify-center items-center w-full mt-8 mb-8">
          <FuzzyText>Friends</FuzzyText>
        </div>
      </div>

          <div className="flex justify-center items-center w-full mt-4 gap-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold shadow hover:scale-105 transition-all cursor-pointer"
              style={{ backgroundColor: 'oklch(25.7% 0.09 281.288)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
              </svg>
              Add A Friend
            </button>

          </div>
      <div className="friends-content">

        <div className="friends-tabs">
          <button
            onClick={() => setActiveTab('friends')}
            className={`tab-button ${activeTab === 'friends' ? 'active' : ''}`}
          >
            My friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`tab-button pending ${activeTab === 'pending' ? 'active' : ''}`}
          >
            Friends request ({pendingRequests.length})
          </button>
        </div>


        <div className="flex flex-col justify-center items-center w-full mt-8 mb-4">

        </div>


        {loading && (
          <div className="loading-message">Chargement...</div>
        )}
        {!loading && error && (
          <div className="error-message" style={{color:'red', textAlign:'center', marginTop:'1rem'}}>{error}</div>
        )}


        {!loading && activeTab === 'friends' && (
          <div>
            {friends.length === 0 ? (
              <div className="empty-state">
                No friends yet...
                <br />
                <div className="flex justify-center items-center w-full mb-8 gap-4 mt-4">

                </div>
              </div>
            ) : (
              <div className="friends-grid">
                {friends.map((friend) => (
                  <FriendCard
                    key={friend.id}
                    friend={friend}
                    type="friend"
                    onRemove={handleRemoveFriend}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'pending' && (
          <div>
            {pendingRequests.length === 0 ? (
              <div className="empty-state">No friends request...</div>
            ) : (
              <div className="friends-grid">
                {pendingRequests.map((request) => (
                  <FriendCard
                    key={request.id}
                    friend={request}
                    type="pending"
                    onRemove={() => {}}
                    onAccept={handleAcceptFriend}
                    onReject={handleRejectFriend}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      <AddFriendModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onFriendAdded={loadFriends} />
    </div>
  );
}
