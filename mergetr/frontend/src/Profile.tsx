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
    pong_color?: string;
    pong_skin_type?: string;
  };
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const navigate = useNavigate();
  const BACKEND_URL = 'http://localhost:5001';
  const PONG_COLORS = ['blue','red','green','yellow','brown','black','white','pink','orange','purple','gray'];
  const [savingColor, setSavingColor] = useState(false);
  const [colorMsg, setColorMsg] = useState<string | null>(null);

  const updatePongColor = async (newColor: string) => {
    if (!user || savingColor) return;
    setSavingColor(true);
    setColorMsg(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ pong_color: newColor })
      });
      if (!res.ok){
        const data = await res.json().catch(()=>({}));
        throw new Error(data.error || 'Erreur mise à jour');
      }
      const data = await res.json();
      setUser(prev => prev ? ({ ...prev, settings: { ...prev.settings, ...(data.settings || {}), pong_color: data.settings?.pong_color || newColor }}) : prev);
      setColorMsg('Couleur mise à jour');
      setTimeout(()=> setColorMsg(null), 2500);
    } catch(e:any){
      setColorMsg(e.message || 'Erreur');
    } finally {
      setSavingColor(false);
    }
  };

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
          throw new Error(`Error ${userResponse.status}: Can't get user data`);
        }

        const data = await userResponse.json();

        if (!data.user) {
          throw new Error('Missing user data');
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'unknown';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'unknown';
    try {
      return d.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return d.toISOString().split('T')[0];
    }
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
      console.log('uploaded with succes', data);

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
      console.error('error while uploading avatar', err);
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
          border: '3px solid #5b614aff',
          borderTop: '3px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <h2>Loading profile...</h2>
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
            Try again
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
          Cant get your data
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


  <div className="grid grid-cols-[auto_1fr] active:scale-96 hover:scale-102 cursor-target gap-4 items-center bg-[#161b3d] border border-white/10 rounded-2xl p-6 mb-10 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_12px_32px_-12px_rgba(0,0,0,0.7)]">

        <div className="relative flex flex-col items-center">
          <div className="w-[120px] h-[120px] rounded-full hover:scale-105 transition-transform  overflow-hidden border-4 border-blue-400  relative">
        <img
          src={user.settings?.avatar_url || getDefaultAvatar()}
          alt={`${user.username} avatar`}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getDefaultAvatar();
          }}
        />
        {/*loading overlay */}
        {uploadingAvatar && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-full">
            <div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
          </div>

          <div className="mt-4 text-center">
        <input
          type="file"
          id="avatar-upload"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="hidden"
        />
        <label
          htmlFor="avatar-upload"
          className={`cursor-target px-6 py-3 rounded-xl font-semibold text-white shadow-md border border-purple-500/20 bg-[oklch(25.7%_0.09_281.288)] hover:scale-105 active:scale-105 transition flex items-center gap-2 text-sm ${uploadingAvatar ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
        >
          {uploadingAvatar ? ' Upload...' : (
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

        <div>
          <h2 className="text-blue-400 text-3xl mb-1">{user.username}</h2>
          <p className="text-white/90 text-lg mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
              <path d="M19.5 22.5a3 3 0 0 0 3-3v-8.174l-6.879 4.022 3.485 1.876a.75.75 0 1 1-.712 1.321l-5.683-3.06a1.5 1.5 0 0 0-1.422 0l-5.683 3.06a.75.75 0 0 1-.712-1.32l3.485-1.877L1.5 11.326V19.5a3 3 0 0 0 3 3h15Z" />
              <path d="M1.5 9.589v-.745a3 3 0 0 1 1.578-2.642l7.5-4.038a3 3 0 0 1 2.844 0l7.5 4.038A3 3 0 0 1 22.5 8.844v.745l-8.426 4.926-.652-.351a3 3 0 0 0-2.844 0l-.652.351L1.5 9.589Z" />
            </svg>
            {user.email}
          </p>
          <p className="text-white/70 text-base flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
              <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd" />
            </svg>
            {`Member since ${formatDate(user.created_at)}`}
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
  <div className="cursor-target bg-[#161b3d] active:scale-96 hover:scale-102 border border-white/10 rounded-[15px] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_28px_-10px_rgba(0,0,0,0.65)] transition hover:shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_10px_34px_-10px_rgba(0,0,0,0.7)]"
    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
      <svg xmlns="http://www.w3.org/2000/svg"
        fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
        stroke="currentColor" className="size-6">
        <path strokeLinecap="round"
          strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
      </svg>
      <h3 style={{
        color: '#4c9aff',
        fontSize: '1.3rem',
        margin: 0
      }}>
        Infos
      </h3>
    </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#ff6b9d', fontSize: '1.1rem' }}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
</svg>
</span>
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


        {(user.settings) ? (
          <div className="cursor-target hover:scale-102 active:scale-96 bg-[#161b3d] border border-white/10 rounded-[15px] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_28px_-10px_rgba(0,0,0,0.65)] transition hover:shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_10px_34px_-10px_rgba(0,0,0,0.7)]"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h3 style={{
              color: '#4c9aff',
              marginBottom: '20px',
              fontSize: '1.3rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              justifyContent: 'center',
              textAlign: 'center',
              width: '100%'
            }}>
               <h3 style={{
        color: '#4c9aff',
        fontSize: '1.3rem',
        margin: 0
      }}>
        Settings
      </h3>
              <svg xmlns="http://www.w3.org/2000/svg"
             viewBox="0 0 24 24"
             fill="currentColor"
             width="22"
             height="22"
             aria-hidden="true">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  color: user.settings.two_factor_enabled ? '#2ed573' : '#ff4757',
                  fontSize: '1.1rem'
                }}>
                  {user.settings.two_factor_enabled ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  )}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Double Auth
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  color: user.settings.profile_private ? '#ff6b9d' : '#4c9aff',
                  fontSize: '1.1rem'
                }}>
                  {user.settings.profile_private ? '🔒' : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6" style={{ display: 'inline', verticalAlign: 'middle', color: '#4c9aff', width: '1.3em', height: '1.3em' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m6.115 5.19.319 1.913A6 6 0 0 0 8.11 10.36L9.75 12l-.387.775c-.217.433-.132.956.21 1.298l1.348 1.348c.21.21.329.497.329.795v1.089c0 .426.24.815.622 1.006l.153.076c.433.217.956.132 1.298-.21l.723-.723a8.7 8.7 0 0 0 2.288-4.042 1.087 1.087 0 0 0-.358-1.099l-1.33-1.108c-.251-.21-.582-.299-.905-.245l-1.17.195a1.125 1.125 0 0 1-.98-.314l-.295-.295a1.125 1.125 0 0 1 0-1.591l.13-.132a1.125 1.125 0 0 1 1.3-.21l.603.302a.809.809 0 0 0 1.086-1.086L14.25 7.5l1.256-.837a4.5 4.5 0 0 0 1.528-1.732l.146-.292M6.115 5.19A9 9 0 1 0 17.18 4.64M6.115 5.19A8.965 8.965 0 0 1 12 3c1.929 0 3.716.607 5.18 1.64" />
                    </svg>
                  )}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Profil {user.settings.profile_private ? 'privé' : 'public'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6" style={{ color: '#ff6b9d', width: '1.3em', height: '1.3em' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Language : {user.settings.language || 'Non définie'}
                </span>
              </div>

              {/* Sélecteur couleur Pong */}
              <div style={{ marginTop: '6px' }}>
                <div style={{ fontSize:'0.9rem', color:'#4c9aff', fontWeight:600, marginBottom:'6px' }}>
                  🏓 Couleur Pong: <span style={{ color:'rgba(255,255,255,0.85)' }}>{user.settings.pong_color || 'white'}</span>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                  {PONG_COLORS.map(c => {
                    const selected = (user.settings?.pong_color || 'white') === c;
                    return (
                      <button
                        key={c}
                        onClick={() => updatePongColor(c)}
                        disabled={savingColor}
                        style={{
                          width:'34px', height:'34px',
                          borderRadius:'8px',
                          border: selected ? '3px solid #ffffff' : '2px solid rgba(255,255,255,0.35)',
                          background: c,
                          cursor: savingColor ? 'not-allowed' : 'pointer',
                          position:'relative',
                          boxShadow: selected ? '0 0 0 3px rgba(76,154,255,0.55)' : 'none',
                          transition:'all .18s'
                        }}
                        title={c}
                      >
                        {selected && <span style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontWeight:700, fontSize:'14px', color: (c==='yellow'||c==='white') ? '#000':'#fff' }}>✓</span>}
                      </button>
                    )
                  })}
                </div>
                <div style={{ minHeight:'18px', marginTop:'4px', fontSize:'0.7rem' }}>
                  {savingColor && <span style={{ color:'#ffa502' }}>Sauvegarde...</span>}
                  {!savingColor && colorMsg && <span style={{ color:'#2ed573' }}>{colorMsg}</span>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-[15px] p-6 text-sm text-white/70 italic">Paramètres indisponibles</div>
        )}
      </div>

      {/* linked accounts */}
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
            Linked account
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
                {provider === '42' ? '42' :
                 provider === 'google' ? 'Google' :
                 provider === 'github' ? 'GitHub' : provider}
              </span>
            ))}
          </div>
        </div>
      )}


      <div style={{
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>

        <button
          onClick={() => navigate('/settings')}
          className="cursor-target bg-[oklch(25.7%_0.09_281.288)] text-white border-none px-6 py-3 rounded-[14px] active:scale-95 cursor-pointer text-[16px] font-bold transition-transform duration-200hover:scale-105 flex items-center gap-2"
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
            Settings
          </span>
        </button>

        <button
          onClick={() => navigate('/stats')}
          className="cursor-target bg-[oklch(25.7%_0.09_281.288)] text-white border-none hover:scale-105 active:scale-95 px-6 py-3 rounded-[14px] cursor-pointer text-[16px] font-bold transition-transform duration-200  hover:scale-105 flex items-center gap-2"
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
            Stats
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
