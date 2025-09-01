// PongGames.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TargetCursor from './TargetCursor.tsx';
import FuzzyText from './FuzzyText.tsx';
import Join1v1 from './components/Join1v1';
import Join1v13d from './components/Join1v13d';
// removed unused imports logo, ElasticSlider
import MyToggle from './MyToggle';
import axios from 'axios';

interface PlayerData {
  id: string;
  name: string;
  pong_color: string;
}

const PongGames: React.FC = () => {
	const [AIopponent, setAIopponent] = useState(false);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [showJoin1v1, setShowJoin1v1] = useState(false);
	const [showJoin1v13d, setShowJoin1v13d] = useState(false);

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        // Backend route is /api/users/me returning { message, user: { ... } }
        const response = await axios.get('/api/users/me', { withCredentials: true });
        const user = response.data?.user;
        if (user) {
          setPlayerData({
            id: user.id,
            name: user.username || '',
            pong_color: user.settings?.pong_color || user.pong_color || 'white'
          });
        }
      } catch (e) {
        // Not logged in => keep null
      }
    };
    fetchPlayerData();
  }, []);

  const sanitizeUsername = (raw: string) => raw.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_\-]/g, '');

  const createGuest = async (username: string) => {
    const clean = sanitizeUsername(username);
    if (!clean || clean.length < 3) throw new Error('Username trop court');
    const res = await fetch('/api/users/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: clean })
    });
    if (!res.ok) {
      let detail: any = null;
      try { detail = await res.json(); } catch {}
      throw new Error(detail?.error || 'Guest creation failed');
    }
    return await res.json(); // { id, username }
  };

  // (Ancienne fonction handlePlay3D remplacée par logique dans Join1v13d onStartMatch)

const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />
      <div className="max-w-4xl w-full mx-4 p-8">
        <h1 className="text-center mb-12 text-white cursor-target flex justify-center items-center">

          <FuzzyText
            fontSize="clamp(2rem, 4.5vw, 4.5rem)"
          >
            Pongz
          </FuzzyText>
        </h1>

        <div className="grid md:grid-cols-2 gap-8">

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
              <div className="flex flex-col gap-4">
                <div className="relative w-full">
                  <Link
                    to="/pong/play"
                    className="block w-full text-center px-6 py-3 rounded-xl cursor-target border border-purple-500/20"
                    style={{ background: 'oklch(38% 0.189 293.745)', color: 'white' }}
                  >
                    Play now
                  </Link>
                </div>
              </div>
            </div>
          </div>


          <div
            className="group relative cursor-target active:scale-95 overflow-hidden"
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
              <div className="flex flex-col gap-4">
                <div className="relative w-full">
                  <button
                    onClick={() => setShowJoin1v13d(true)}
                    className="block w-full text-center px-6 py-3 rounded-xl cursor-target border border-purple-500/20"
                    style={{ background: 'oklch(38% 0.189 293.745)', color: 'white' }}
					disabled={isLoading}
                  >
					{isLoading ? 'Loading...' : 'Play NOW'}
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-sm text-gray-400">Play against an IA</span>
                  <MyToggle
                    onChange={(checked: boolean) => setAIopponent(checked)}
                    defaultChecked={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-10">
          <div className="grid md:grid-cols-2 gap-8 text-gray-400 w-full">

          <div className="flex flex-col items-center">
            <h4 className="mb-4 text-green-300">Player 1</h4>
            <div className="flex gap-2 mb-2">
              <kbd className="px-2 py-1 bg-gray-800 rounded text-white hover:scale-150">W</kbd>
              <span>up</span>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-white hover:scale-150">S</kbd>
              <span>down</span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <h4 className="mb-4 text-green-300">Player 2</h4>
            <div className="flex gap-2 mb-2">
              <kbd className="px-2 py-1 bg-gray-800 rounded text-white hover:scale-150">↑</kbd>
              <kbd className="px-2 py-1 bg-gray-800 rounded text-white hover:scale-150">↓</kbd>
            </div>
          </div>
          <div className="col-span-2 flex justify-center mt-4">
            <p className="text-sm">5 points = win</p>
          </div>
          </div>
        </div>


        <div className="mt-8 text-center hover:scale-105 active:scale-95">

          <Link to="/">← Back Home</Link>
        </div>
        {showJoin1v1 && (
          <Join1v1
            isOpen={showJoin1v1}
            onClose={() => setShowJoin1v1(false)}
            onStartMatch={(p1: string, p2: string) => {
              setShowJoin1v1(false);
              navigate('/pong/play', { state: { player1: p1, player2: p2 } });
            }}
          />
        )}
        {showJoin1v13d && (
          <Join1v13d
            isOpen={showJoin1v13d}
            onClose={() => setShowJoin1v13d(false)}
            ai={AIopponent}
            onStartMatch={(p1: string, p2: string) => {
              // Asynchronous creation & redirect
              (async () => {
                try {
                  setIsLoading(true);
                  let playerId: string; let playerName: string; let playerColor: string;
                  if (playerData) {
                    playerId = playerData.id;
                    playerName = playerData.name;
                    playerColor = playerData.pong_color || 'white';
                  } else {
                    const g1 = await createGuest(p1);
                    playerId = g1.id;
                    playerName = g1.username;
                    playerColor = 'white';
                  }

                  // Opponent (guest or AI)
                  let opponentId = '';
                  let opponentName = '';
                  let opponentColor = 'white';
                  if (AIopponent) {
                    try {
                      const aiRes = await axios.get('/api/ia', { withCredentials: true });
                      opponentId = aiRes.data.id;
                      opponentName = aiRes.data.name;
                      opponentColor = aiRes.data.pong_color || 'white';
                    } catch (e) {
                      console.error('Erreur récupération IA', e);
                    }
                  } else {
                    const g2 = await createGuest(p2);
                    opponentId = g2.id;
                    opponentName = g2.username;
                  }

                  const url = `/export_pong3D/index.html?ia=${AIopponent}` +
                    `&playerId=${encodeURIComponent(playerId)}` +
                    `&playerName=${encodeURIComponent(playerName)}` +
                    `&playerColor=${encodeURIComponent(playerColor)}` +
                    `&opponentId=${encodeURIComponent(opponentId)}` +
                    `&opponentName=${encodeURIComponent(opponentName)}` +
                    `&opponentColor=${encodeURIComponent(opponentColor)}` +
                    `&tournamentId=false`;
                  console.log('[3D Redirect]', url);
                  window.location.href = url;
                } catch (err: any) {
                  console.error('Erreur préparation match 3D', err);
                  alert(err?.message || 'Erreur préparation match 3D');
                } finally {
                  setIsLoading(false);
                  setShowJoin1v13d(false);
                }
              })();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PongGames;
