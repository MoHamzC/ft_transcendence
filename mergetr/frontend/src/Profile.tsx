import React, { useState, useEffect } from 'react';
import './Profile.css';
import ProfileCard from './ProfileCard';
import EditProfileModal from './EditProfileModal';
import useUserProfile from './hooks/useUserProfile';

interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
  totalScore: number;
  averageScore: number;
  longestWinStreak: number;
  currentWinStreak: number;
}

interface RecentGame {
  id: string;
  opponent: string;
  result: 'win' | 'loss';
  score: string;
  date: string;
  gameMode: string;
}

interface Friend {
  id: string;
  username: string;
  avatarUrl: string;
  status: 'online' | 'offline' | 'playing';
  lastSeen?: string;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  joinDate: string;
  lastLogin: string;
  rank: number;
  level: number;
  experience: number;
  bio?: string;
  location?: string;
  favoriteGame?: string;
  achievements: string[];
}

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'info' | 'stats' | 'friends'>('info');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { profile: userProfile, loading, error, updateProfile } = useUserProfile();

  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      // Mock stats data - replace with real API call
      const statsData: UserStats = {
        gamesPlayed: 127,
        gamesWon: 89,
        gamesLost: 38,
        winRate: 70.1,
        totalScore: 15420,
        averageScore: 121.4,
        longestWinStreak: 12,
        currentWinStreak: 5
      };

      setUserStats(statsData);

      // Mock recent games - replace with real API call
      const gamesData: RecentGame[] = [
        {
          id: '1',
          opponent: 'PlayerX',
          result: 'win',
          score: '11-7',
          date: '2024-08-29',
          gameMode: 'Classic'
        },
        {
          id: '2',
          opponent: 'GameMaster',
          result: 'win',
          score: '11-9',
          date: '2024-08-28',
          gameMode: '3D Pong'
        },
        {
          id: '3',
          opponent: 'ProPlayer',
          result: 'loss',
          score: '8-11',
          date: '2024-08-27',
          gameMode: 'Speed Mode'
        }
      ];

      setRecentGames(gamesData);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Fetch friends list
  const fetchFriends = async () => {
    try {
      // Mock friends data - replace with real API call
      const friendsData: Friend[] = [
        {
          id: '1',
          username: 'Alice',
          avatarUrl: '/uploads/avatars/avatar1.svg',
          status: 'online'
        },
        {
          id: '2',
          username: 'Bob',
          avatarUrl: '/uploads/avatars/avatar2.svg',
          status: 'playing'
        },
        {
          id: '3',
          username: 'Charlie',
          avatarUrl: '/uploads/avatars/avatar3.svg',
          status: 'offline',
          lastSeen: '2 hours ago'
        }
      ];

      setFriends(friendsData);
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!userProfile) return;
      
      try {
        await Promise.all([
          fetchUserStats(),
          fetchFriends()
        ]);
      } catch (err) {
        console.error('Failed to load additional data:', err);
      }
    };

    loadData();
  }, [userProfile]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return '#2ed573';
      case 'playing':
        return '#ffa502';
      case 'offline':
      default:
        return '#747d8c';
    }
  };

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (updatedProfile: UserProfile) => {
    try {
      await updateProfile(updatedProfile);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="profile-container">
        <div className="error-message">
          {error || 'Failed to load profile data'}
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        <div className="profile-header">
          <h1 className="profile-title">Mon Profil</h1>
        </div>

        <div className="profile-main">
          <div className="profile-card-section">
            <ProfileCard
              avatarUrl={userProfile.avatarUrl}
              name={userProfile.username}
              title={`Niveau ${userProfile.level} • Rang #${userProfile.rank}`}
              handle={userProfile.username}
              status="Online"
              contactText="Modifier"
              showUserInfo={true}
              onContactClick={() => setActiveTab('info')}
              className="profile-card-custom"
              enableTilt={true}
            />
          </div>

          <div className="profile-info-section">
            <div className="profile-tabs">
              <button
                className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                Informations
              </button>
              <button
                className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
                onClick={() => setActiveTab('stats')}
              >
                Statistiques
              </button>
              <button
                className={`tab-button ${activeTab === 'friends' ? 'active' : ''}`}
                onClick={() => setActiveTab('friends')}
              >
                Amis
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'info' && (
                <div>
                  <div className="info-grid">
                    <div className="info-card">
                      <h3>Email</h3>
                      <p>{userProfile.email}</p>
                    </div>
                    <div className="info-card">
                      <h3>Membre depuis</h3>
                      <p>{formatDate(userProfile.joinDate)}</p>
                    </div>
                    <div className="info-card">
                      <h3>Dernière connexion</h3>
                      <p>{formatDate(userProfile.lastLogin)}</p>
                    </div>
                    <div className="info-card">
                      <h3>Localisation</h3>
                      <p>{userProfile.location || 'Non spécifiée'}</p>
                    </div>
                    <div className="info-card">
                      <h3>Jeu favori</h3>
                      <p>{userProfile.favoriteGame || 'Aucun'}</p>
                    </div>
                    <div className="info-card">
                      <h3>Niveau / Expérience</h3>
                      <p>Niveau {userProfile.level} ({userProfile.experience} XP)</p>
                    </div>
                  </div>
                  
                  {userProfile.bio && (
                    <div className="info-card">
                      <h3>Bio</h3>
                      <p>{userProfile.bio}</p>
                    </div>
                  )}

                  <div className="info-card">
                    <h3>Achievements</h3>
                    <div className="achievements-container">
                      {userProfile.achievements.map((achievement, index) => (
                        <span key={index} className="achievement-badge">
                          🏆 {achievement}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button className="edit-profile-btn" onClick={handleEditProfile}>
                    Modifier le profil
                  </button>
                </div>
              )}

              {activeTab === 'stats' && userStats && (
                <div>
                  <div className="stats-container">
                    <div className="stat-item">
                      <div className="stat-value">{userStats.gamesPlayed}</div>
                      <div className="stat-label">Parties jouées</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{userStats.gamesWon}</div>
                      <div className="stat-label">Victoires</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{userStats.gamesLost}</div>
                      <div className="stat-label">Défaites</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{userStats.winRate}%</div>
                      <div className="stat-label">Taux de victoire</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{userStats.totalScore.toLocaleString()}</div>
                      <div className="stat-label">Score total</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{userStats.averageScore}</div>
                      <div className="stat-label">Score moyen</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{userStats.longestWinStreak}</div>
                      <div className="stat-label">Plus longue série</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{userStats.currentWinStreak}</div>
                      <div className="stat-label">Série actuelle</div>
                    </div>
                  </div>

                  <div className="recent-games">
                    <h3 style={{ color: '#ff6b9d', marginBottom: '1rem' }}>Parties récentes</h3>
                    {recentGames.map((game) => (
                      <div key={game.id} className="game-item">
                        <div>
                          <strong style={{ color: 'white' }}>vs {game.opponent}</strong>
                          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                            {game.gameMode} • {formatDate(game.date)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: 'white', marginBottom: '0.25rem' }}>{game.score}</div>
                          <span className={`game-result ${game.result}`}>
                            {game.result === 'win' ? 'VICTOIRE' : 'DÉFAITE'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'friends' && (
                <div>
                  <h3 style={{ color: '#ff6b9d', marginBottom: '1rem' }}>
                    Mes amis ({friends.length})
                  </h3>
                  <div className="friends-list">
                    {friends.map((friend) => (
                      <div key={friend.id} className="friend-item">
                        <img
                          src={friend.avatarUrl}
                          alt={friend.username}
                          className="friend-avatar"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/uploads/avatars/default_avatar.svg';
                          }}
                        />
                        <div className="friend-name">{friend.username}</div>
                        <div 
                          className={`friend-status ${friend.status}`}
                          style={{ color: getStatusColor(friend.status) }}
                        >
                          {friend.status === 'online' && '● En ligne'}
                          {friend.status === 'playing' && '🎮 En jeu'}
                          {friend.status === 'offline' && `● ${friend.lastSeen || 'Hors ligne'}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          userProfile={userProfile}
          onSave={handleSaveProfile}
        />
      </div>
    </div>
  );
};

export default Profile;
