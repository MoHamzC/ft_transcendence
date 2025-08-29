import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PongCustomizationModal from './PongCustomizationModal';
import ScrollablePage from './ScrollablePage';

interface UserData {
  id: string;
  username: string;
  email: string;
  created_at: string;
  joinDate?: string;
  providers?: string[];
  bio?: string;
  settings?: {
    two_factor_enabled: boolean;
    language: string;
    profile_private: boolean;
    add_friend?: boolean;
    avatar_url?: string;
    pong_color?: string;
    pong_skin_type?: 'color' | 'avatar';
  };
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPongCustomization, setShowPongCustomization] = useState(false);
  const [pongColor, setPongColor] = useState('#FFFFFF');
  const [pongSkinType, setPongSkinType] = useState<'color' | 'avatar'>('color');
  const [savingPongSettings, setSavingPongSettings] = useState(false);
  const navigate = useNavigate();
  const BACKEND_URL = 'http://localhost:5001';

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Vérifier l'authentification
        const authResponse = await fetch(`${BACKEND_URL}/api/users/protected`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!authResponse.ok) {
          navigate('/login');
          return;
        }

        // Charger les données utilisateur
        const userResponse = await fetch(`${BACKEND_URL}/api/users/me`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!userResponse.ok) {
          throw new Error(`Erreur ${userResponse.status}: Impossible de récupérer les données utilisateur`);
        }

        const data = await userResponse.json();

        if (!data.user) {
          throw new Error('Données utilisateur manquantes dans la réponse');
        }
console.log('✅ Avatar uploadé avec succès:', data);console.log('✅ Avatar uploadé avec succès:', data);
        setUser(data.user);

        // Initialiser les paramètres Pong
        if (data.user.settings) {
          setPongColor(data.user.settings.pong_color || '#FFFFFF');
          setPongSkinType(data.user.settings.pong_skin_type || 'color');
        }

      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDefaultAvatar = () => {
    return `${BACKEND_URL}/uploads/avatars/default_avatar.jpg`;
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image valide (JPG, PNG, GIF, etc.)');
      return;
    }

    // Vérifier la taille du fichier (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier est trop volumineux. Taille maximale : 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BACKEND_URL}/api/users/avatar`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'upload de l\'avatar');
      }

      const data = await response.json();
      console.log('✅ Avatar uploadé avec succès:', data);

      // Mettre à jour l'avatar dans l'état local
      if (user) {
        setUser({
          ...user,
          settings: {
            two_factor_enabled: user.settings?.two_factor_enabled || false,
            language: user.settings?.language || 'en',
            profile_private: user.settings?.profile_private || false,
            add_friend: user.settings?.add_friend !== false,
            avatar_url: data.avatar_url
          }
        });
      }

      // Réinitialiser l'input file
      event.target.value = '';

    } catch (err) {
      console.error('❌ Erreur upload avatar:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload de l\'avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const savePongSettings = async () => {
    try {
      setSavingPongSettings(true);
      setError(null);

      const response = await fetch(`${BACKEND_URL}/api/users/settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pong_color: pongColor,
          pong_skin_type: pongSkinType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      const data = await response.json();
      console.log('✅ Paramètres Pong sauvegardés:', data);

      // Mettre à jour les settings dans l'état local
      if (user && user.settings) {
        setUser({
          ...user,
          settings: {
            ...user.settings,
            pong_color: pongColor,
            pong_skin_type: pongSkinType,
          }
        });
      }

      setShowPongCustomization(false);

    } catch (err) {
      console.error('❌ Erreur sauvegarde paramètres Pong:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde des paramètres Pong');
    } finally {
      setSavingPongSettings(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid #ff6b9d',
          borderTop: '3px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <h2>🔄 Chargement du profil...</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>Récupération de vos informations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        color: 'white',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h2 style={{ color: '#ff4757', marginBottom: '20px' }}>❌ Erreur de chargement</h2>
        <p style={{ color: '#ffb3c9', marginBottom: '30px', maxWidth: '500px' }}>
          {error}
        </p>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg, #ff4757, #ff6b9d)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            🔄 Réessayer
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'linear-gradient(135deg, #4c9aff, #ff6b9d)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            🏠 Accueil
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        color: 'white',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#ffa502' }}>❌ Aucune donnée</h2>
        <p style={{ color: 'rgba(255,255,255,0.8)' }}>
          Impossible de charger vos données utilisateur.
        </p>
      </div>
    );
  }

  return (
    <ScrollablePage>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        color: 'white',
        minHeight: '100%',
        paddingBottom: '80px',
        paddingTop: '20px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '30px'
      }}>
        <h1 style={{
          color: '#2ed573',
          marginBottom: '10px',
          fontSize: '2.5rem',
          fontWeight: 'bold'
        }}>
          ✅ Mon Profil
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: '1.1rem'
        }}>
          Bienvenue sur votre espace personnel
        </p>
      </div>

      {/* Avatar et infos principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '30px',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '30px',
        marginBottom: '30px'
      }}>
        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid #ff6b9d',
            boxShadow: '0 10px 30px rgba(255, 107, 157, 0.3)',
            flexShrink: 0,
            position: 'relative'
          }}>
            <img
              src={user.settings?.avatar_url || getDefaultAvatar()}
              alt={`${user.username} avatar`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = getDefaultAvatar();
              }}
            />

            {/* Overlay de chargement */}
            {uploadingAvatar && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%'
              }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  border: '3px solid #ff6b9d',
                  borderTop: '3px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              </div>
            )}
          </div>

          {/* Bouton de changement d'avatar */}
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
            <label
              htmlFor="avatar-upload"
              style={{
                background: uploadingAvatar
                  ? 'linear-gradient(135deg, #666, #888)'
                  : 'linear-gradient(135deg, #ff6b9d, #c942ff)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'inline-block',
                transition: 'all 0.2s ease',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                if (!uploadingAvatar) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {uploadingAvatar ? '📤 Upload...' : '📸 Changer photo'}
            </label>
          </div>
        </div>

        {/* Infos principales */}
        <div>
          <h2 style={{
            color: '#ff6b9d',
            fontSize: '2rem',
            marginBottom: '5px'
          }}>
            {user.username}
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '1.1rem',
            marginBottom: '10px'
          }}>
            📧 {user.email}
          </p>
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '1rem'
          }}>
            📅 Membre depuis le {formatDate(user.joinDate || user.created_at)}
          </p>
        </div>
      </div>

      {/* Détails du profil */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Informations générales */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '25px'
        }}>
          <h3 style={{
            color: '#4c9aff',
            marginBottom: '20px',
            fontSize: '1.3rem'
          }}>
            📋 Informations générales
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#ff6b9d', fontSize: '1.1rem' }}>🆔</span>
              <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                ID: {user.id}
              </span>
            </div>

            {user.bio && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ color: '#ff6b9d', fontSize: '1.1rem' }}>📝</span>
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                  {user.bio}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Paramètres */}
        {user.settings && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '25px'
          }}>
            <h3 style={{
              color: '#4c9aff',
              marginBottom: '20px',
              fontSize: '1.3rem'
            }}>
              ⚙️ Paramètres
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  color: user.settings.two_factor_enabled ? '#2ed573' : '#ff4757',
                  fontSize: '1.1rem'
                }}>
                  {user.settings.two_factor_enabled ? '✅' : '❌'}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Authentification à deux facteurs
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  color: user.settings.profile_private ? '#ff6b9d' : '#4c9aff',
                  fontSize: '1.1rem'
                }}>
                  {user.settings.profile_private ? '🔒' : '🌐'}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Profil {user.settings.profile_private ? 'privé' : 'public'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  color: (user.settings.add_friend !== false) ? '#2ed573' : '#ff4757',
                  fontSize: '1.1rem'
                }}>
                  {(user.settings.add_friend !== false) ? '✅' : '❌'}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Accepte les demandes d'amis
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#ff6b9d', fontSize: '1.1rem' }}>🌍</span>
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Langue: {user.settings.language || 'Non définie'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#ffa502', fontSize: '1.1rem' }}>🏓</span>
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Pong: {user.settings.pong_skin_type === 'avatar' ? 'Avatar' : 'Couleur'}
                  {user.settings.pong_skin_type === 'color' && user.settings.pong_color && (
                    <span style={{
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
                      backgroundColor: user.settings.pong_color,
                      borderRadius: '3px',
                      marginLeft: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      verticalAlign: 'middle'
                    }}></span>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comptes liés */}
      {user.providers && user.providers.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '30px'
        }}>
          <h3 style={{
            color: '#4c9aff',
            marginBottom: '20px',
            fontSize: '1.3rem'
          }}>
            🔗 Comptes liés
          </h3>

          <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            {user.providers.map((provider: string, index: number) => (
              <span
                key={index}
                style={{
                  background: 'linear-gradient(135deg, #4c9aff, #ff6b9d)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {provider === '42' && '🎓'}
                {provider === 'google' && '🔍'}
                {provider === 'github' && '💻'}
                {provider === '42' ? '42 École' :
                 provider === 'google' ? 'Google' :
                 provider === 'github' ? 'GitHub' : provider}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'linear-gradient(135deg, #4c9aff, #ff6b9d)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          🏠 Accueil
        </button>

        <button
          onClick={() => navigate('/settings')}
          style={{
            background: 'linear-gradient(135deg, #ff6b9d, #c942ff)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ⚙️ Paramètres
        </button>

        <button
          onClick={() => navigate('/stats')}
          style={{
            background: 'linear-gradient(135deg, #2ed573, #ff6b9d)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          📊 Statistiques
        </button>

        <button
          onClick={() => setShowPongCustomization(true)}
          style={{
            background: 'linear-gradient(135deg, #ffa502, #ff6b9d)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          🏓 Personnaliser Pong
        </button>
      </div>

      {/* Modal de personnalisation Pong */}
      <PongCustomizationModal
        isOpen={showPongCustomization}
        onClose={() => setShowPongCustomization(false)}
        pongColor={pongColor}
        setPongColor={setPongColor}
        pongSkinType={pongSkinType}
        setPongSkinType={setPongSkinType}
        onSave={savePongSettings}
        saving={savingPongSettings}
        userAvatarUrl={user?.settings?.avatar_url}
        backendUrl={BACKEND_URL}
      />

      {/* Animation CSS pour le spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      </div>
    </ScrollablePage>
  );
};

export default Profile;
