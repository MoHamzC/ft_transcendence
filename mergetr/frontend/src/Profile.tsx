import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FuzzyText from './FuzzyText';
import TargetCursor from './TargetCursor';
interface UserData {
  id: string;
  username: string;
  email: string;
  created_at: string;
  providers?: string[];
  bio?: string;
  settings?: {
    two_factor_enabled: boolean;
    language: string;
    profile_private: boolean;
    avatar_url?: string;
  };
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const navigate = useNavigate();
  const BACKEND_URL = 'http://localhost:5001';
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        
        const authResponse = await fetch(`${BACKEND_URL}/api/users/protected`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!authResponse.ok) {
          navigate('/login');
          return;
        }

        
        const userResponse = await fetch(`${BACKEND_URL}/api/users/me`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!userResponse.ok) {
          throw new Error(`Erreur ${userResponse.status}: Can't get user data`);
        }

        const data = await userResponse.json();

        if (!data.user) {
          throw new Error('Données utilisateur manquantes dans la réponse');
        }
        setUser(data.user);

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

   
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, GIF, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File too big. Maximum size is 5MB');
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

      if (user) {
        setUser({
          ...user,
          settings: {
            two_factor_enabled: user.settings?.two_factor_enabled || false,
            language: user.settings?.language || 'en',
            profile_private: user.settings?.profile_private || false,
            avatar_url: data.avatar_url
          }
        });
      }

  
      event.target.value = '';

    } catch (err) {
      console.error('❌ Error while uploading avatar:', err);
      setError(err instanceof Error ? err.message : 'Error while uploading avatar');
    } finally {
      setUploadingAvatar(false);
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
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      color: 'white',
      minHeight: '100vh'
    }}>
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        marginBottom: '40px',
        borderRadius: '20px',
        padding: '60px'
      }}>
        <FuzzyText fontSize="clamp(2rem, 4.5vw, 4.5rem)">Profile</FuzzyText>
      </div>

      {/* Avatar et infos principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '10px',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '10px',
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
              className={`cursor-target px-6 py-3 rounded-xl font-semibold text-white shadow-md border border-purple-500/20 bg-[oklch(25.7%_0.09_281.288)] hover:scale-105 active:scale-105 transition flex items-center gap-2 text-sm ${uploadingAvatar ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              {uploadingAvatar ? '📤 Upload...' : (
                <span className="inline-flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg"
                       viewBox="0 0 24 24"
                       fill="currentColor"
                       width="18"
                       height="18"
                       aria-hidden="true">
                    <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
                    <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                  </svg>
                  Change profile picture
                </span>
              )}
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
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
              <path d="M19.5 22.5a3 3 0 0 0 3-3v-8.174l-6.879 4.022 3.485 1.876a.75.75 0 1 1-.712 1.321l-5.683-3.06a1.5 1.5 0 0 0-1.422 0l-5.683 3.06a.75.75 0 0 1-.712-1.32l3.485-1.877L1.5 11.326V19.5a3 3 0 0 0 3 3h15Z" />
              <path d="M1.5 9.589v-.745a3 3 0 0 1 1.578-2.642l7.5-4.038a3 3 0 0 1 2.844 0l7.5 4.038A3 3 0 0 1 22.5 8.844v.745l-8.426 4.926-.652-.351a3 3 0 0 0-2.844 0l-.652.351L1.5 9.589Z" />
            </svg>
            {user.email}
          </p>
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
              <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" />
            </svg>
            Membre depuis le {formatDate(user.created_at)}
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
       <div className="cursor-target bg-[oklch(25.7%_0.09_281.288/.35)] backdrop-blur-xl border border-white/10 rounded-[15px] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_4px_18px_-4px_rgba(201,66,255,0.35)] transition hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_6px_22px_-4px_rgba(201,66,255,0.5)]">
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
        {(user.settings) ? (
          <div className="cursor-target bg-[oklch(25.7%_0.09_281.288/.35)] backdrop-blur-xl border border-white/10 rounded-[15px] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_4px_18px_-4px_rgba(201,66,255,0.35)] transition hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_6px_22px_-4px_rgba(201,66,255,0.5)]">
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
                <span style={{ color: '#ff6b9d', fontSize: '1.1rem' }}>🌍</span>
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Langue: {user.settings.language || 'Non définie'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-[15px] p-6 text-sm text-white/70 italic">Paramètres indisponibles</div>
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
        {/* Bouton Accueil supprimé – BackHome gère le retour */}
        <button
          onClick={() => navigate('/settings')}
          className="cursor-target bg-[oklch(25.7%_0.09_281.288)] text-white border-none px-6 py-3 rounded-[14px] active:scale-95 cursor-pointer text-[16px] font-bold transition-transform duration-200 shadow-[0_6px_18px_-4px_rgba(201,66,255,0.45)] hover:scale-105 flex items-center gap-2"
        >
          <span style={{ display:'inline-flex', alignItems:'center', gap:'8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg"
                 viewBox="0 0 24 24"
                 fill="currentColor"
                 width="22"
                 height="22"
                 aria-hidden="true">
              <path d="M6 12a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 1 1 1.5 0v7.5A.75.75 0 0 1 6 12ZM18 12a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 1.5 0v7.5A.75.75 0 0 1 18 12ZM6.75 20.25v-1.5a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0ZM18.75 18.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 1.5 0ZM12.75 5.25v-1.5a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0ZM12 21a.75.75 0 0 1-.75-.75v-7.5a.75.75 0 0 1 1.5 0v7.5A.75.75 0 0 1 12 21ZM3.75 15a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0ZM12 11.25a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5ZM15.75 15a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0Z" />
            </svg>
            Paramètres
          </span>
        </button>

        <button
          onClick={() => navigate('/stats')}
          className="cursor-target bg-[oklch(25.7%_0.09_281.288)] text-white border-none hover:scale-105 active:scale-95 px-6 py-3 rounded-[14px] cursor-pointer text-[16px] font-bold transition-transform duration-200 shadow-[0_6px_18px_-4px_rgba(201,66,255,0.45)] hover:scale-105 flex items-center gap-2"
        >
          <span style={{ display:'inline-flex', alignItems:'center', gap:'8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg"
                 viewBox="0 0 24 24"
                 fill="currentColor"
                 width="22"
                 height="22"
                 aria-hidden="true">
              <path fillRule="evenodd" d="M15.22 6.268a.75.75 0 0 1 .968-.431l5.942 2.28a.75.75 0 0 1 .431.97l-2.28 5.94a.75.75 0 1 1-1.4-.537l1.63-4.251-1.086.484a11.2 11.2 0 0 0-5.45 5.173.75.75 0 0 1-1.199.19L9 12.312l-6.22 6.22a.75.75 0 0 1-1.06-1.061l6.75-6.75a.75.75 0 0 1 1.06 0l3.606 3.606a12.695 12.695 0 0 1 5.68-4.974l1.086-.483-4.251-1.632a.75.75 0 0 1-.432-.97Z" clipRule="evenodd" />
            </svg>
            Statistiques
          </span>
        </button>
      </div>

      {/* Animation CSS pour le spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Profile;
