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

  const statusClasses = {
    friend: 'bg-[#7eeaff] text-[#060010]',
    pending: 'bg-[#ffd1dc] text-[#231f2b]',
    sent: 'bg-[#2b2b3a] text-[#aab0c3]',
  } as const;

  return (
    <div className="friend-card bg-[linear-gradient(180deg,#0b0b12,rgba(11,9,20,0.6))] border border-[#272733] rounded-2xl p-4 shadow-md">
      <div className="friend-card-content flex items-start gap-4">
        <div className="friend-info flex items-center gap-4">
          <div className="friend-avatar w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-[#7eeaff] bg-[#0f1220] border-2 border-[#23243a]">
            {friend.username ? friend.username.charAt(0).toUpperCase() : '?'}
          </div>

          <div className="min-w-0">
            <div className="friend-details">
              <h3 className="text-lg font-semibold text-[#cfeaff] truncate">{friend.username}</h3>
              <p className="text-sm text-[#9aa0b3] truncate">{friend.email}</p>
            </div>

            <div className="friend-status mt-2 flex items-center gap-3">
              <span
                className={`status-badge inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusClasses[type]}`}
                aria-hidden
              >
                {getStatusText()}
              </span>

              {(friend.friendship_date || friend.request_date) && (
                <span className="friend-date text-xs text-[#7f8596]">
                  {new Date(friend.friendship_date || friend.request_date || '').toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="friend-actions ml-auto flex items-start gap-3">
          {type === 'pending' && onAccept && onReject && (
            <>
              <button
                onClick={() => onAccept(friend.id)}
                className="btn-small px-3 py-1 rounded-lg bg-[#7eeaff] text-[#060010] text-sm font-semibold shadow-sm hover:brightness-95"
                aria-label={`Accepter ${friend.username}`}
                type="button"
              >
                Accepter
              </button>
              <button
                onClick={() => onReject(friend.id)}
                className="btn-small px-3 py-1 rounded-lg bg-[#ffd1dc] text-[#231f2b] text-sm font-semibold shadow-sm hover:brightness-95"
                aria-label={`Rejeter ${friend.username}`}
                type="button"
              >
                Rejeter
              </button>
            </>
          )}

          {type === 'friend' && (
            <button
              onClick={() => onRemove(friend.id)}
              className="btn-small px-3 py-1 rounded-lg bg-[#ffd1dc] text-[#231f2b] text-sm font-semibold shadow-sm hover:brightness-95"
              aria-label={`Supprimer ${friend.username}`}
              type="button"
            >
              Supprimer
            </button>
          )}

          {type === 'sent' && (
            <span className="text-xs text-[#7f8596] py-1 px-2">En attente</span>
          )}
        </div>
      </div>
    </div>
  );
}
