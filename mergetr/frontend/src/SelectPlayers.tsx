import FuzzyText from "./FuzzyText";
import React from 'react';
import TargetCursor from './TargetCursor';

export default function SelectPlayers() {
  const handleChoose = (n: number) => {
    console.log('Chosen players:', n);
  
  };

  const buttonStyle: React.CSSProperties = {
    background: 'oklch(38% 0.189 293.745)',
    color: 'white'
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />
      <FuzzyText
        fontSize="clamp(2rem, 4.5vw, 4.5rem)"
        style={{ display: "block", margin: "0 auto" }}
      >
        Number of players
      </FuzzyText>

      <div className="mt-8 flex gap-6">
        <button
          onClick={() => handleChoose(4)}
          className="block w-44 h-12 text-center cursor-target rounded-xl active:scale-95  hover:scale-105 cursor-pointer flex items-center justify-center"
          style={buttonStyle}
        >
          4 Players
        </button>

        <button
          onClick={() => handleChoose(8)}
          className="block w-44 h-12 text-center cursor-target rounded-xl active:scale-95 cursor-pointer hover:scale-105 flex items-center justify-center"
          style={buttonStyle}
        >
          8 Players
        </button>
      </div>
    </div>
  );
}
