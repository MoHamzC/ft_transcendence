// ProfileDebugOverlay.tsx - Composant de débogage pour le profil en mode développement
import React, { useState } from 'react';

const ProfileDebugOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: '1px solid #ff6b9d',
          padding: '8px',
          borderRadius: '50%',
          cursor: 'pointer',
          width: '40px',
          height: '40px',
          fontSize: '16px',
          zIndex: 1000
        }}
      >
        🐛
      </button>

      {isVisible && (
        <div style={{
          position: 'fixed',
          bottom: '70px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          border: '1px solid #ff6b9d',
          borderRadius: '10px',
          padding: '15px',
          maxWidth: '300px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#ff6b9d' }}>
            🐛 Profile Debug Info
          </h4>
          <p style={{ margin: '5px 0' }}>
            Mode: {import.meta.env.DEV ? 'Development' : 'Production'}
          </p>
          <p style={{ margin: '5px 0' }}>
            URL: {window.location.pathname}
          </p>
          <p style={{ margin: '5px 0' }}>
            Timestamp: {new Date().toLocaleTimeString()}
          </p>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              background: '#ff6b9d',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px',
              marginTop: '10px'
            }}
          >
            Fermer
          </button>
        </div>
      )}
    </>
  );
};

export default ProfileDebugOverlay;
