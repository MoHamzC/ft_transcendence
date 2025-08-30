import FuzzyText from "./FuzzyText";
import React from 'react';
import TargetCursor from './TargetCursor';

export default function SelectPlayers() {
  const handleChoose = (n: number) => {
    console.log('Chosen players:', n);
  
  };

  const buttonStyle: React.CSSProperties = {
    background: 'oklch(38% 0.189 293.745)',
    color: 'white',
    width: '220px',
    height: '120px',
    fontSize: '2rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '18px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.15s',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />
      <FuzzyText
        fontSize="clamp(2rem, 4.5vw, 4.5rem)"
      >
        Number of players
      </FuzzyText>

      <div className="mt-8 flex gap-6">
        <button
          onClick={() => handleChoose(4)}
          className="rounded-xl active:scale-95 hover:scale-105 cursor-pointer cursor-target"
          style={buttonStyle}
        >
            <img src="/src/assets/icon_table_preserved.png" alt="Table Icon" style={{ width: '64px', height: '64px' }} />
            4 Players
        </button>

        <button
          onClick={() => handleChoose(8)}
          className="rounded-xl active:scale-95 hover:scale-105 cursor-pointer cursor-target"
          style={buttonStyle}
        >
            <img src="/src/assets/pong_multi.png" alt="Pong Multi Icon" style={{ width: '64px', height: '64px' }} />
            8 Players
        </button>
      </div>
    </div>
  );
}
