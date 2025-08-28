
import { useState, useEffect } from 'react';
import InfiniteMenu from './InfiniteMenu.tsx';
import FriendsService, { type Friend, type FriendRequest } from './services/friendsService';
import AddFriendModal from './components/AddFriendModal';
import FriendCard from './components/FriendCard';
import './Friends.css';

export default function Friends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'pending'>('friends');
  const [showInfiniteMenu, setShowInfiniteMenu] = useState(false);

  // Items pour le menu infini (gardés de l'ancienne version)
  const items = [
    {
      image: 'https://fbi.cults3d.com/uploaders/22757503/illustration-file/d2db82d1-47c1-4e13-9302-af32fe7648b6/sheikah_eye.png',
      link: 'https://google.com/',
      title: 'DinoMalinovski',
      description: 'This is pretty cool, right?'
    },
    {
      image: 'https://images.steamusercontent.com/ugc/867364351724766220/EEC0115AD646C400334078C4BE30BA2565EE8550/?imw=512&&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=false',
      link: 'https://google.com/',
      title: 'DinoMalinstava',
      description: 'This is pretty cool, right?'
    },
    {
      image: 'https://ik.imagekit.io/yynn3ntzglc/cms/Image_principale_chat_poil_long_c091891e9e_BWJBpJXFm.jpg?tr=w-1068&v=632652015',
      link: 'https://google.com/',
      title: 'DinoMalynx',
      description: 'This is pretty cool, right?'
    },
    {
      image: 'https://static.actu.fr/uploads/2018/08/25584-180830161125775-0-960x640.jpg',
      link: 'https://google.com/',
      title: 'Item 4',
      description: 'This is pretty cool, right?'
    }
  ];

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
      setError(err.message || 'Erreur lors du chargement des amis');
      console.error('Error loading friends:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  const handleAcceptFriend = async (requesterId: string) => {
    try {
      await FriendsService.acceptFriendRequest(requesterId);
      await loadFriends(); // Recharger les listes
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'acceptation');
    }
  };

  const handleRejectFriend = async (requesterId: string) => {
    try {
      await FriendsService.rejectFriendRequest(requesterId);
      await loadFriends(); // Recharger les listes
    } catch (err: any) {
      setError(err.message || 'Erreur lors du rejet');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await FriendsService.removeFriend(friendId);
      await loadFriends(); // Recharger les listes
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    }
  };

  if (showInfiniteMenu) {
    return (
      <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
        <InfiniteMenu items={items}/>
      </div>
    );
  }

  return (
    <div className="friends-container">
      {/* Header */}
      <div className="friends-header">
        <div className="friends-header-content">
          <h1 className="friends-title">AMIS</h1>
          <div className="friends-actions">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              + Ajouter un ami
            </button>
            <button
              onClick={() => setShowInfiniteMenu(true)}
              className="btn-secondary"
            >
              Vue carrousel
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="friends-content">
        {/* Tabs */}
        <div className="friends-tabs">
          <button
            onClick={() => setActiveTab('friends')}
            className={`tab-button ${activeTab === 'friends' ? 'active' : ''}`}
          >
            Mes amis ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`tab-button pending ${activeTab === 'pending' ? 'active' : ''}`}
          >
            Demandes reçues ({pendingRequests.length})
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="error-message">
            {error}
            <button
              onClick={() => setError('')}
              className="error-close"
            >
              ×
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="loading-message">
            Chargement...
          </div>
        )}

        {/* Friends List */}
        {!loading && activeTab === 'friends' && (
          <div>
            {friends.length === 0 ? (
              <div className="empty-state">
                Aucun ami pour le moment.
                <br />
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary"
                  style={{ marginTop: '1rem' }}
                >
                  Ajouter votre premier ami
                </button>
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
              <div className="empty-state">
                Aucune demande d'ami en attente.
              </div>
            ) : (
              <div className="friends-grid">
                {pendingRequests.map((request) => (
                  <FriendCard
                    key={request.id}
                    friend={request}
                    type="pending"
                    onRemove={() => {}} // Not used for pending requests
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
      <AddFriendModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onFriendAdded={loadFriends}
      />
    </div>
  );
} 