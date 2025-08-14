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
          <div className="group relative cursor-target">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 group-hover:border-gray-500 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
              <h3 className="mb-6 text-blue-300 group-hover:text-blue-200 transition-colors duration-300 cursor-target">
                 Pong
              </h3>
              <p className="text-gray-400 mb-6 group-hover:text-gray-300 transition-colors duration-300 cursor-target">
                A classic game of pong. 
              </p>
              <Link 
                to="/pong/play"
                className="block w-full text-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg cursor-target"
              >
                Play now
              </Link>
            </div>
          </div>

          {/* Pong 3D */}
          <div className="group relative cursor-target">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 group-hover:border-gray-500 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
              <h3 className="mb-6 text-purple-300 group-hover:text-purple-200 transition-colors duration-300 cursor-target">
                 Pong 3D
              </h3>
              <p className="text-gray-400 mb-6 group-hover:text-gray-300 transition-colors duration-300">
                Pong, but with a whole new dimension!
              </p>
              <button 
                disabled
                className="block w-full text-center px-6 py-3 bg-gray-600 cursor-not-allowed text-gray-400 rounded-xl opacity-60 cursor-target"
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
        <div className="mt-8 text-center cursor-target">
          <Link 
            to="/"
            className="inline-flex items-center px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-gray-600 hover:border-gray-500 cursor-target"
          >
            ← Back Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PongGames;
