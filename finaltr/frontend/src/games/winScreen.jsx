export default function WinScreen({ winner, onRestart, reporting = false, error = null }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        fontSize: '48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '640px', padding: '0 16px' }}>
        <div style={{ fontWeight: '700', marginBottom: '12px' }}>🏆 VICTOIRE {winner?.toUpperCase()} 🏆</div>
        {reporting && (
          <div style={{ fontSize: '16px', marginBottom: '8px', opacity: 0.8 }}>
            Enregistrement du match...
          </div>
        )}
        {error && (
          <div style={{ fontSize: '14px', color: '#f87171', marginBottom: '8px' }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={onRestart}
            style={{
              marginTop: '12px',
              padding: '12px 24px',
              fontSize: '20px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: 'black',
              cursor: 'pointer',
            }}
          >
            🔁 Rejouer
          </button>
          <button
            onClick={() => { window.location.href = '/'; }}
            style={{
              marginTop: '12px',
              padding: '12px 24px',
              fontSize: '20px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#6366f1',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            🏠 Home
          </button>
        </div>
      </div>
    </div>
  );
}

