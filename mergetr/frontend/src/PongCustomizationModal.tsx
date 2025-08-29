// PongCustomizationModal.tsx - Modal pour personnaliser l'apparence de Pong
import React from 'react';

interface PongCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pongColor: string;
  setPongColor: (color: string) => void;
  pongSkinType: 'color' | 'avatar';
  setPongSkinType: (type: 'color' | 'avatar') => void;
  onSave: () => void;
  saving: boolean;
  userAvatarUrl?: string;
  backendUrl: string;
}

const PongCustomizationModal: React.FC<PongCustomizationModalProps> = ({
  isOpen,
  onClose,
  pongColor,
  setPongColor,
  pongSkinType,
  setPongSkinType,
  onSave,
  saving,
  userAvatarUrl,
  backendUrl
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        padding: '30px',
        maxWidth: '500px',
        width: '100%',
        color: 'white',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
      }}>
        <h2 style={{
          color: '#ff6b9d',
          marginBottom: '20px',
          fontSize: '1.5rem',
          textAlign: 'center'
        }}>
          🏓 Personnalisation Pong
        </h2>

        <div style={{ marginBottom: '25px' }}>
          <h3 style={{
            color: '#4c9aff',
            marginBottom: '15px',
            fontSize: '1.2rem'
          }}>
            Type de personnalisation
          </h3>
          
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <button
              onClick={() => setPongSkinType('color')}
              style={{
                background: pongSkinType === 'color' 
                  ? 'linear-gradient(135deg, #ff6b9d, #c942ff)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: pongSkinType === 'color' ? '2px solid #ff6b9d' : '2px solid rgba(255, 255, 255, 0.3)',
                padding: '10px 20px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                flex: 1,
                transition: 'all 0.2s ease'
              }}
            >
              🎨 Couleur
            </button>

            <button
              onClick={() => setPongSkinType('avatar')}
              style={{
                background: pongSkinType === 'avatar' 
                  ? 'linear-gradient(135deg, #ff6b9d, #c942ff)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: pongSkinType === 'avatar' ? '2px solid #ff6b9d' : '2px solid rgba(255, 255, 255, 0.3)',
                padding: '10px 20px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                flex: 1,
                transition: 'all 0.2s ease'
              }}
            >
              🖼️ Avatar
            </button>
          </div>
        </div>

        {pongSkinType === 'color' && (
          <div style={{ marginBottom: '25px' }}>
            <h4 style={{
              color: '#4c9aff',
              marginBottom: '10px',
              fontSize: '1rem'
            }}>
              Couleur de la raquette
            </h4>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <input
                type="color"
                value={pongColor}
                onChange={(e) => setPongColor(e.target.value)}
                style={{
                  width: '60px',
                  height: '40px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: 'transparent'
                }}
              />
              
              <div style={{
                flex: 1,
                padding: '10px 15px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}>
                {pongColor.toUpperCase()}
              </div>
            </div>

            {/* Aperçu de la couleur */}
            <div style={{
              marginTop: '15px',
              padding: '15px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>
                Aperçu de votre raquette :
              </p>
              <div style={{
                width: '80px',
                height: '20px',
                background: pongColor,
                margin: '0 auto',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}></div>
            </div>
          </div>
        )}

        {pongSkinType === 'avatar' && (
          <div style={{ marginBottom: '25px' }}>
            <div style={{
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <p style={{ margin: '0 0 15px 0', color: 'rgba(255, 255, 255, 0.9)' }}>
                🖼️ Votre avatar actuel sera utilisé comme texture pour la raquette
              </p>
              
              {userAvatarUrl && (
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  margin: '0 auto',
                  border: '2px solid #ff6b9d'
                }}>
                  <img
                    src={userAvatarUrl.startsWith('http') 
                      ? userAvatarUrl 
                      : `${backendUrl}${userAvatarUrl}`
                    }
                    alt="Avatar preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `${backendUrl}/uploads/avatars/default_avatar.jpg`;
                    }}
                  />
                </div>
              )}
              
              <p style={{ margin: '15px 0 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                Pour changer d'avatar, utilisez le bouton "Changer photo" sur votre profil
              </p>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            ❌ Annuler
          </button>

          <button
            onClick={onSave}
            disabled={saving}
            style={{
              background: saving
                ? 'rgba(255, 255, 255, 0.1)'
                : 'linear-gradient(135deg, #2ed573, #4c9aff)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? '💾 Sauvegarde...' : '✅ Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PongCustomizationModal;
