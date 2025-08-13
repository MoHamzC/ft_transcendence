// PongGames.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const PongGames: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800">
      <div className="max-w-4xl w-full mx-4 p-8">
        <h1 className="text-4xl font-bold text-center mb-12 text-white">
          🏓 Jeux Pong
        </h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Pong Classique */}
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 group-hover:border-gray-500 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
              <h3 className="text-2xl font-semibold mb-6 text-blue-300 group-hover:text-blue-200 transition-colors duration-300">
                🎮 Pong Classique
              </h3>
              <p className="text-gray-400 mb-6 group-hover:text-gray-300 transition-colors duration-300">
                Le jeu original qui a tout commencé. Simple, addictif et intemporel.
              </p>
              <Link 
                to="/pong/play"
                className="block w-full text-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl transition-all duration-300 font-medium transform hover:scale-105 hover:shadow-lg"
              >
                Jouer maintenant
              </Link>
            </div>
          </div>

          {/* Pong 3D */}
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 group-hover:border-gray-500 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
              <h3 className="text-2xl font-semibold mb-6 text-purple-300 group-hover:text-purple-200 transition-colors duration-300">
                🌟 Pong 3D
              </h3>
              <p className="text-gray-400 mb-6 group-hover:text-gray-300 transition-colors duration-300">
                Une expérience Pong révolutionnaire dans un environnement 3D immersif.
              </p>
              <button 
                disabled
                className="block w-full text-center px-6 py-3 bg-gray-600 cursor-not-allowed text-gray-400 rounded-xl font-medium opacity-60"
              >
                Bientôt disponible
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
          <div className="relative bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 group-hover:border-gray-500 transition-all duration-300">
            <h4 className="text-lg font-semibold mb-4 text-green-300 group-hover:text-green-200 transition-colors duration-300">
              📋 Comment jouer
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
              <div>
                <p>• <strong className="text-white">Flèches ↑/↓</strong> : Déplacer votre raquette</p>
                <p>• <strong className="text-white">Espace</strong> : Commencer une partie</p>
              </div>
              <div>
                <p>• <strong className="text-white">ESC</strong> : Mettre en pause</p>
                <p>• <strong className="text-white">Objectif</strong> : Premier à 5 points gagne !</p>
              </div>
            </div>
          </div>
        </div>

        {/* Retour */}
        <div className="mt-8 text-center">
          <Link 
            to="/"
            className="inline-flex items-center px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all duration-300 font-medium transform hover:scale-105 hover:shadow-lg border border-gray-600 hover:border-gray-500"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PongGames;
