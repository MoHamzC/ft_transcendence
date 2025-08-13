export default function WinScreen({ winner, onRestart }) {
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
      🏆 VICTOIRE {winner.toUpperCase()} 🏆
      <button
        onClick={onRestart}
        style={{
          marginTop: '20px',
          padding: '12px 24px',
          fontSize: '24px',
          border: 'none',
          borderRadius: '8px',
          backgroundColor: 'white',
          color: 'black',
          cursor: 'pointer',
        }}
      >
        🔁 Rejouer
      </button>
    </div>
  );
}

