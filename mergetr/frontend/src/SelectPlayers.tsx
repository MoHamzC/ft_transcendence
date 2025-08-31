import FuzzyText from "./FuzzyText";
import React, { useEffect, useState } from 'react';
import TargetCursor from './TargetCursor';
import { useNavigate } from 'react-router-dom';

export default function SelectPlayers() {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur vient de se connecter
    const urlParams = new URLSearchParams(window.location.search);
    const loginSuccess = urlParams.get('login');

    if (loginSuccess === 'success') {
      setShowWelcome(true);
      // Nettoyer l'URL après 3 secondes
      setTimeout(() => {
        setShowWelcome(false);
        window.history.replaceState({}, '', '/selectplayers');
      }, 3000);
    }
  }, []);

  const handleChoose = (n: number) => {
    console.log('Chosen players:', n);
    // Ici vous pouvez ajouter la logique pour démarrer le jeu avec n joueurs
    // Par exemple : navigate('/pong/game', { state: { players: n } });
  };

  const buttonStyle: React.CSSProperties = {
    background: 'oklch(38% 0.189 293.745)',
    color: 'white'
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />

      {showWelcome && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
          color: '#1a1a2e',
          padding: '1rem 2rem',
          borderRadius: '10px',
          fontWeight: 'bold',
          zIndex: 1000,
          animation: 'fadeInOut 3s ease-in-out'
        }}>
          🎉 Connexion réussie ! Bienvenue !
        </div>
      )}

      <div style={{ display: "block", margin: "0 auto", textAlign: "center" }}>
        <FuzzyText fontSize="clamp(2rem, 4.5vw, 4.5rem)">
          Number of players
        </FuzzyText>
      </div>

      <div className="mt-8 flex gap-6">
        <button
          onClick={() => handleChoose(4)}
          className="block w-44 h-12 text-center cursor-target rounded-xl active:scale-95 hover:scale-105 cursor-pointer flex items-center justify-center transition-all duration-200"
          style={buttonStyle}
        >
          4 Players
        </button>

        <button
          onClick={() => handleChoose(8)}
          className="block w-44 h-12 text-center cursor-target rounded-xl active:scale-95 cursor-pointer hover:scale-105 flex items-center justify-center transition-all duration-200"
          style={buttonStyle}
        >
          8 Players
        </button>
      </div>

      <div className="mt-6">
        <button
          onClick={() => navigate('/tournament')}
          className="px-6 py-3 text-white cursor-target rounded-lg active:scale-95 hover:scale-105 transition-all duration-200 mr-4"
          style={{
            background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
            color: '#1a1a2e',
            fontWeight: 'bold'
          }}
        >
          🏆 Tournament Mode
        </button>
        <button
          onClick={() => navigate('/pong')}
          className="px-6 py-3 text-white cursor-target rounded-lg active:scale-95 hover:scale-105 transition-all duration-200"
          style={{
            background: 'oklch(25.7% 0.09 281.288)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          Retour aux jeux
        </button>
      </div>

      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          10% { opacity: 1; transform: translateX(-50%) translateY(0); }
          90% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
