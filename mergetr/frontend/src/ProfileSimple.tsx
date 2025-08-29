import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import ProfileCard from './ProfileCard';

const ProfileSimple: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'info' | 'stats' | 'friends'>('info');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const BACKEND_URL = 'http://localhost:5001';

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Tentative de récupération de l\'utilisateur connecté...');
      
      // Récupérer les informations de l'utilisateur connecté
      const userResponse = await fetch(`${BACKEND_URL}/api/users/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Réponse du serveur:', userResponse.status, userResponse.statusText);

      if (!userResponse.ok) {
        console.log('❌ Utilisateur non connecté, status:', userResponse.status);
        const errorText = await userResponse.text();
        console.log('❌ Erreur:', errorText);
        setUser(null);
        setLoading(false);
        // Rediriger vers la page de login après un court délai
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1000);
        return;
      }

      const userData = await userResponse.json();
      const userInfo = userData.user;

      console.log('✅ Données utilisateur reçues:', userInfo);

      // S'assurer que l'URL de l'avatar est complète
      let avatarUrl = userInfo.avatarUrl;
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        // Si l'URL ne commence pas par http, ajouter l'URL du backend
        avatarUrl = avatarUrl.startsWith('/') ? 
          `${BACKEND_URL}${avatarUrl}` : 
          `${BACKEND_URL}/${avatarUrl}`;
      }

      console.log('✅ Avatar URL finale:', avatarUrl);

      // Utiliser les vraies données de l'utilisateur
      setUser({
        id: userInfo.id,
        username: userInfo.username,
        email: userInfo.email,
        avatarUrl: avatarUrl || `${BACKEND_URL}/uploads/avatars/default_avatar.svg`,
        joinDate: userInfo.joinDate,
        providers: userInfo.providers || []
      });

    } catch (error) {
      console.error('💥 Erreur lors de la récupération des données utilisateur:', error);
      setUser(null);
      setLoading(false);
      // Rediriger vers la page de login en cas d'erreur
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Mock data pour les stats (en attendant les vraies données)
  const userProfile = {
    id: user?.id || '1',
    username: user?.username || 'Player1',
    email: user?.email || 'player@example.com',
    avatarUrl: user?.avatarUrl || `${BACKEND_URL}/uploads/avatars/default_avatar.svg`,
    joinDate: user?.joinDate || '2024-01-15',
    lastLogin: new Date().toISOString(),
    bio: 'Passionate gamer and developer', // Mock
    location: 'Paris, France', // Mock
    favoriteGame: 'Pong 3D', // Mock
    achievements: ['First Win', 'Speed Demon', 'Perfect Game', 'Social Butterfly'], // Mock
    providers: user?.providers || []
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="profile-container">
        <div className="profile-content">
          <div className="error-message">
            <h2>Accès restreint</h2>
            <p>Vous devez être connecté pour accéder à votre profil.</p>
            <p>Redirection en cours...</p>
            <button 
              onClick={() => {
                console.log('🔄 Test de reconnexion...');
                fetchCurrentUser();
              }}
              style={{
                background: 'linear-gradient(135deg, #ff6b9d, #c942ff)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              Tester la connexion
            </button>
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          </div>
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
              title=""
              handle={userProfile.username}
              status="Online"
              contactText="Modifier"
              showUserInfo={false}
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
                    {userProfile.providers.length > 0 && (
                      <div className="info-card">
                        <h3>Comptes liés</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {userProfile.providers.map((provider: string, index: number) => (
                            <span 
                              key={index} 
                              style={{
                                background: 'linear-gradient(135deg, #4c9aff, #ff6b9d)',
                                color: 'white',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '15px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                              }}
                            >
                              {provider === '42' ? '42 École' : 
                               provider === 'google' ? 'Google' : 
                               provider === 'github' ? 'GitHub' : provider}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {userProfile.bio && (
                    <div className="info-card">
                      <h3>Bio</h3>
                      <p>{userProfile.bio}</p>
                    </div>
                  )}

                  <button 
                    className="edit-profile-btn"
                    onClick={() => alert('Fonctionnalité d\'édition à venir!')}
                  >
                    Modifier la bio
                  </button>
                </div>
              )}

              {activeTab === 'stats' && (
                <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    padding: '2rem',
                    margin: '1rem 0'
                  }}>
                    <h3 style={{ color: '#ff6b9d', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      📊 Statistiques
                    </h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem', marginBottom: '1rem' }}>
                      Les statistiques de jeu ne sont pas encore disponibles.
                    </p>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>
                      Cette fonctionnalité sera bientôt implémentée pour suivre vos performances !
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'friends' && (
                <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    padding: '2rem',
                    margin: '1rem 0'
                  }}>
                    <h3 style={{ color: '#ff6b9d', marginBottom: '1rem', fontSize: '1.5rem' }}>
                      👥 Amis
                    </h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.1rem', marginBottom: '1rem' }}>
                      Le système d'amis n'est pas encore disponible.
                    </p>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>
                      Vous pourrez bientôt ajouter des amis et voir leur statut en ligne !
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSimple;
