// PongGames.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import TargetCursor from './TargetCursor.tsx'; // Ajout de l'import

const PongGames: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />
      <div className="max-w-4xl w-full mx-4 p-8">
        <h1 className="text-center mb-12 text-white cursor-target">
          Logo
        </h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Pong Classique */}
          <div
            className="group relative cursor-target active:scale-95"
            style={{ background: 'oklch(25.7% 0.09 281.288)', borderRadius: '1rem' }}
          >
            <div className="absolute -inset-1 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative backdrop-blur-sm rounded-2xl p-8 border border-gray-700 group-hover:border-gray-500 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
              <h3 className="mb-6 text-blue-300 group-hover:text-blue-200 transition-colors duration-300">
                 Pong
              </h3>
              <p className="text-gray-400 mb-6 group-hover:text-gray-300 transition-colors duration-300">
                A classic game of pong. 
              </p>
              <Link 
                to="/pong/play"
                className="block w-full text-center px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg cursor-target"
                style={{ background: 'oklch(38% 0.189 293.745)', color: 'white' }}
              >
                Play now
              </Link>
            </div>
          </div>

          {/* Pong 3D */}
          <div
            className="group relative cursor-target active:scale-95"
            style={{ background: 'oklch(25.7% 0.09 281.288)', borderRadius: '1rem' }}
          >
            <div className="absolute -inset-1 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative backdrop-blur-sm rounded-2xl p-8 border border-gray-700 group-hover:border-gray-500 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
              <h3 className="mb-6 text-purple-300 group-hover:text-purple-200 transition-colors duration-300">
                 Pong 3D
              </h3>
              <p className="text-gray-400 mb-6 group-hover:text-gray-300 transition-colors duration-300">
                Pong, but with a whole new dimension!
              </p>
              <button 
                disabled
                className="block w-full text-center px-6 py-3 rounded-xl opacity-60 cursor-target"
                style={{ background: 'oklch(38% 0.189 293.745)', color: 'white' }}
              >
                Available soon
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h4 className="mb-4 text-green-300">
            How To Play
          </h4>
          <div className="grid md:grid-cols-2 gap-4 text-gray-400">
            <div>
              <p>• <strong className="text-white">↑/↓</strong> : Move your raquet</p>
              <p>• <strong className="text-white">Espace</strong> : Start game</p>
            </div>
            <div>
              <p>• <strong className="text-white">ESC</strong> : Pause the game</p>
              <p>• <strong className="text-white">Goal</strong> : First to 5 points win !</p>
            </div>
          </div>
        </div>

        {/* Retour */}
        <div className="mt-8 text-center hover:scale-105 active:scale-95">
          <Link 
            to="/"
          >
            ← Back Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PongGames;
