
import { useState, useEffect } from 'react';
import InfiniteMenu from './InfiniteMenu.tsx';
import FriendsService, { type Friend, type FriendRequest } from './services/friendsService';
import AddFriendModal from './components/AddFriendModal';
import FriendCard from './components/FriendCard';
import './Friends.css';
import FuzzyText from './FuzzyText.tsx';

export default function Friends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'pending'>('friends');



  const loadFriends = async () => {
    try {
      setLoading(true);
      const [friendsResponse, pendingResponse] = await Promise.all([
        FriendsService.getFriends(),
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

  useEffect(() => {
    loadFriends();
  }, []);

  // No extra derived state needed; use friends.length directly where required

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
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ffd1dc] text-[#23243a] font-bold shadow hover:scale-105 transition-all cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
              </svg>
              Add A Friend
            </button>

            {friends.length > 0 && (
              <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ffd1dc] text-[#23243a] font-bold shadow hover:scale-105 transition-all cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                </svg>
                Remove Friend
              </button>
            )}
          </div>
      <div className="friends-content">
        {/* Tabs */}
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

        {/* Centered action buttons under title */}
        <div className="flex flex-col justify-center items-center w-full mt-8 mb-4">
          {/* <FuzzyText>Friends</FuzzyText> */}
        </div>

        {/* Loading */}
        {loading && (
          <div className="loading-message">Chargement...</div>
        )}

        {/* Friends List */}
        {!loading && activeTab === 'friends' && (
          <div>
            {friends.length === 0 ? (
              <div className="empty-state">
                No friends yet.... yete
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

        {/* Pending Requests */}
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