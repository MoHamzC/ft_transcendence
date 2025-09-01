// components/FriendCard.tsx
// Local Friend interface (service file now JS)
export interface Friend {
  id: string;
  email: string;
  username: string;
  status?: string; // friendship status
  friendship_date?: string;
  request_date?: string;
  is_online?: boolean;
  last_seen?: string;
  online_status?: 'online' | 'away' | 'offline';
}

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

  const statusClasses = {
    friend: 'bg-[#7eeaff] text-[#060010]',
    pending: 'bg-[#ffd1dc] text-[#231f2b]',
    sent: 'bg-[#2b2b3a] text-[#aab0c3]',
  } as const;

  const presence = friend.online_status || (friend.is_online ? 'online' : 'offline');

  const presenceColor =
    presence === 'online' ? '#2ed573' : presence === 'away' ? '#ffa502' : '#666';

  const formatLastSeen = (ts?: string) => {
    if (!ts) return '';
    const date = new Date(ts);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d ago`;
  };

  return (
    <div className="friend-card bg-[linear-gradient(180deg,#0b0b12,rgba(11,9,20,0.6))] border border-[#272733] rounded-2xl p-4 shadow-md">
      <div className="friend-card-content flex items-start gap-4">
        <div className="friend-info flex items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="friend-avatar w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-[#7eeaff] bg-[#0f1220] border-2 border-[#23243a]">
              {friend.username ? friend.username.charAt(0).toUpperCase() : '?'}
            </div>
            <span
              className="status-indicator"
              style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: presenceColor,
                boxShadow: '0 0 6px rgba(0,0,0,0.4)',
                border: '2px solid #0f1220'
              }}
              title={presence}
            />
          </div>

          <div className="min-w-0">
            <div className="friend-details">
              <h3 className="text-lg font-semibold text-[#cfeaff] truncate">{friend.username}</h3>
              <p className="text-sm text-[#9aa0b3] truncate">{friend.email}</p>
            </div>

            <div className="friend-status mt-2 flex items-center gap-3 flex-wrap">
              {type !== 'friend' && (
                <span
                  className={`status-badge inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusClasses[type]}`}
                  aria-hidden
                >
                  {getStatusText()}
                </span>
              )}
              {presence && (
                <span className="text-xs text-[#9aa0b3]">
                  {presence === 'online' ? 'Online' : presence === 'away' ? 'Away' : 'Offline'}
                  {friend.last_seen && presence !== 'online' && ` • ${formatLastSeen(friend.last_seen)}`}
                </span>
              )}
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
