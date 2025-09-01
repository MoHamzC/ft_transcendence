import React from 'react';
import { useFriendsStatus } from '../hooks/useFriendsStatus';
import './FriendsOnline.css';

/**
 * Component to display friends' online status
 */
const StatusBadge = ({ status, lastSeen, formatLastSeen }) => {
    const getStatusInfo = () => {
        switch (status) {
            case 'online':
                return { 
                    color: 'green', 
                    text: 'En ligne',
                    icon: '🟢'
                };
            case 'away':
                return { 
                    color: 'orange', 
                    text: 'Absent',
                    icon: '🟠'
                };
            default:
                return { 
                    color: 'gray', 
                    text: formatLastSeen(lastSeen),
                    icon: '⚪'
                };
        }
    };

    const { color, text, icon } = getStatusInfo();

    return (
        <div className={`status-badge status-${color}`}>
            <span className="status-icon">{icon}</span>
            <span className="status-text">{text}</span>
        </div>
    );
};

const FriendCard = ({ friend, formatLastSeen }) => {
    return (
        <div className="friend-card">
            <div className="friend-avatar">
                {friend.name ? friend.name.charAt(0).toUpperCase() : friend.username.charAt(0).toUpperCase()}
            </div>
            
            <div className="friend-info">
                <h4 className="friend-name">
                    {friend.name || friend.username}
                </h4>
                <p className="friend-username">@{friend.username}</p>
                {friend.email && (
                    <p className="friend-email">{friend.email}</p>
                )}
            </div>
            
            <div className="friend-status">
                <StatusBadge 
                    status={friend.online_status} 
                    lastSeen={friend.last_seen}
                    formatLastSeen={formatLastSeen}
                />
            </div>
        </div>
    );
};

export const FriendsOnline = () => {
    const { 
        friends, 
        loading, 
        error, 
        refreshStatus, 
        formatLastSeen,
        isMonitoring 
    } = useFriendsStatus();

    if (loading && friends.length === 0) {
        return (
            <div className="friends-online-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading friends...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="friends-online-container">
                <div className="error-message">
                    <h3>❌ Error</h3>
                    <p>{error}</p>
                    <button onClick={refreshStatus} className="retry-button">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const onlineFriends = friends.filter(f => f.online_status === 'online');
    const awayFriends = friends.filter(f => f.online_status === 'away');
    const offlineFriends = friends.filter(f => f.online_status === 'offline');

    return (
        <div className="friends-online-container">
            <div className="friends-header">
                <div className="header-title">
                    <h2>My Friends</h2>
                    <span className="friends-count">({friends.length})</span>
                </div>
                
                <div className="header-actions">
                    <div className="monitoring-status">
                        {isMonitoring ? (
                            <span className="monitoring-active">🔄 Active</span>
                        ) : (
                            <span className="monitoring-inactive">⏸️ Paused</span>
                        )}
                    </div>
                    
                    <button 
                        onClick={refreshStatus} 
                        className="refresh-button"
                        disabled={loading}
                    >
                        {loading ? '⏳' : '🔄'}
                    </button>
                </div>
            </div>

            {friends.length === 0 ? (
                <div className="no-friends">
                    <h3>👥 No friends</h3>
                    <p>You don't have any friends yet. Start adding friends to see their online status!</p>
                </div>
            ) : (
                <div className="friends-sections">
                    
                    {/* Online friends */}
                    {onlineFriends.length > 0 && (
                        <div className="friends-section">
                            <h3 className="section-title">
                                🟢 Online ({onlineFriends.length})
                            </h3>
                            <div className="friends-list">
                                {onlineFriends.map(friend => (
                                    <FriendCard 
                                        key={friend.id} 
                                        friend={friend} 
                                        formatLastSeen={formatLastSeen}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Away friends */}
                    {awayFriends.length > 0 && (
                        <div className="friends-section">
                            <h3 className="section-title">
                                🟠 Away ({awayFriends.length})
                            </h3>
                            <div className="friends-list">
                                {awayFriends.map(friend => (
                                    <FriendCard 
                                        key={friend.id} 
                                        friend={friend} 
                                        formatLastSeen={formatLastSeen}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Offline friends */}
                    {offlineFriends.length > 0 && (
                        <div className="friends-section">
                            <h3 className="section-title">
                                ⚪ Offline ({offlineFriends.length})
                            </h3>
                            <div className="friends-list">
                                {offlineFriends.map(friend => (
                                    <FriendCard 
                                        key={friend.id} 
                                        friend={friend} 
                                        formatLastSeen={formatLastSeen}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Petit indicateur de dernière mise à jour */}
            <div className="last-update">
                <small>Mis à jour automatiquement toutes les 30 secondes</small>
            </div>
        </div>
    );
};

export default FriendsOnline;
