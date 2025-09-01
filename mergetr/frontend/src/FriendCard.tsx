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
        return 'Friend';
      case 'pending':
        return 'Request received';
      case 'sent':
        return 'Request sent';
      default:
        return '';
    }
  };

  const getOnlineStatusDisplay = () => {
    if (type !== 'friend' || !friend.online_status) return null;

    const statusConfig = {
      online: { text: 'En ligne', color: '#22c55e', bgColor: '#22c55e20' },
      away: { text: 'Hors ligne', color: '#6b7280', bgColor: '#6b728020' },
      offline: { text: 'Hors ligne', color: '#6b7280', bgColor: '#6b728020' },
    };

    const config = statusConfig[friend.online_status] || statusConfig.offline;

    return (
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        <span
          className="text-xs px-2 py-1 rounded-full font-medium"
          style={{
            color: config.color,
            backgroundColor: config.bgColor,
          }}
        >
          {config.text}
        </span>
      </div>
    );
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
              <h3 className="text-lg font-semibold text-[#cfeaff] truncate">
                {friend.username}
              </h3>
              <p className="text-sm text-[#9aa0b3] truncate">{friend.email}</p>
            </div>

            <div className="friend-status mt-2 flex items-center gap-3">
              {/* Statut d'amitié */}
              {type !== 'friend' && (
                <span
                  className={`status-badge inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusClasses[type]}`}
                  aria-hidden
                >
                  {getStatusText()}
                </span>
              )}

              {/* Statut en ligne pour les amis */}
              {getOnlineStatusDisplay()}

              {(friend.friendship_date || friend.request_date) && (
                <span className="friend-date text-xs text-[#7f8596]">
                  {new Date(
                    friend.friendship_date || friend.request_date || ''
                  ).toLocaleDateString()}
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
                className="btn-small px-3 py-1 rounded-lg bg-[#7eeaff] text-[#060010] text-sm font-semibold shadow-sm hover:scale-105 active:scale-95"
                aria-label={`Accept ${friend.username}`}
                type="button"
              >
                Accept
              </button>
              <button
                onClick={() => onReject(friend.id)}
                className="btn-small px-3 py-1 rounded-lg bg-[#7eeaff] text-[#060010] text-sm font-semibold shadow-sm hover:scale-105 active:scale-95"
                aria-label={`Reject ${friend.username}`}
                type="button"
              >
                Reject
              </button>
            </>
          )}

          {type === 'friend' && (
            <button
              onClick={() => onRemove(friend.id)}
              className="btn-small px-3 py-1 rounded-lg bg-[#7eeaff] text-[#060010] text-sm hover:scale-105 active:scale-95"
              aria-label={`Remove ${friend.username}`}
              type="button"
            >
              Remove
            </button>
          )}

          {type === 'sent' && (
            <span className="text-xs text-[#7f8596] py-1 px-2">Pending</span>
          )}
        </div>
      </div>
    </div>
  );
}
