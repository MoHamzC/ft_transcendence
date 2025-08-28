// components/FriendCard.tsx
import type { Friend } from '../services/friendsService';

interface FriendCardProps {
  friend: Friend;
  onRemove: (friendId: string) => void;
  type: 'friend' | 'pending' | 'sent';
  onAccept?: (friendId: string) => void;
  onReject?: (friendId: string) => void;
}

export default function FriendCard({ friend, onRemove, type, onAccept, onReject }: FriendCardProps) {
  const getStatusText = () => {
    switch (type) {
      case 'friend':
        return 'Ami';
      case 'pending':
        return 'Demande reçue';
      case 'sent':
        return 'Demande envoyée';
      default:
        return '';
    }
  };

  return (
    <div className="friend-card">
      <div className="friend-card-content">
        <div className="friend-info">
          <div className="friend-avatar">
            {friend.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="friend-details">
              <h3>{friend.username}</h3>
              <p>{friend.email}</p>
            </div>
            
            <div className="friend-status">
              <span className={`status-badge ${type}`}>
                {getStatusText()}
              </span>
              {(friend.friendship_date || friend.request_date) && (
                <span className="friend-date">
                  {new Date(friend.friendship_date || friend.request_date || '').toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="friend-actions">
          {type === 'pending' && onAccept && onReject && (
            <>
              <button
                onClick={() => onAccept(friend.id)}
                className="btn-small btn-accept"
              >
                Accepter
              </button>
              <button
                onClick={() => onReject(friend.id)}
                className="btn-small btn-reject"
              >
                Rejeter
              </button>
            </>
          )}
          
          {type === 'friend' && (
            <button
              onClick={() => onRemove(friend.id)}
              className="btn-small btn-remove"
            >
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
