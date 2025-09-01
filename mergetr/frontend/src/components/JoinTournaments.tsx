import React, { useEffect, useState } from 'react';
import TargetCursor from '../TargetCursor';

interface JoinProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMatch: (player1: string, player2: string) => void;
}

const BACKEND_URL = 'http://localhost:5001';

export default function Join({ isOpen, onClose, onStartMatch }: JoinProps) {
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    async function fetchUser() {
      try {
        setError('');
        const authRes = await fetch(`${BACKEND_URL}/api/users/protected`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!authRes.ok) {
          if (mounted) {
            setLogged(false);
            setPlayer1('');
          }
          return;
        }
        const meRes = await fetch(`${BACKEND_URL}/api/users/me`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!meRes.ok) {
          if (mounted) setLogged(false);
          return;
        }
        const data = await meRes.json();
        if (mounted && data?.user?.username) {
          setLogged(true);
          setPlayer1(data.user.username);
        }
      } catch (err) {
        if (mounted) setError('Erreur récupération user');
      }
    }
    void fetchUser();
    return () => { mounted = false; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPlayer2('');
      if (!logged) setPlayer1('');
      setError('');
      setLoading(false);
    }
  }, [isOpen, logged]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    if (!player1.trim() || !player2.trim()) {
      setError('You need to fill in both player names.');
      return;
    }
    if (player1.trim() === player2.trim()) {
      setError('Les deux joueurs doivent être différents.');
      return;
    }
    setLoading(true);
    try {
      onStartMatch(player1.trim(), player2.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error starting match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      aria-modal="true"
      role="dialog"
    >
      <TargetCursor hideDefaultCursor={true} />
      <div
        className="w-full max-w-md mx-4 rounded-xl cursor-target shadow-2xl overflow-hidden hover:scale-102 active:scale-98 transition-transform"
        style={{ background: '#0f1720', border: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
          <div className="flex-1 flex justify-center">
            <h2 className="text-xl font-extrabold text-white text-center">Start Match</h2>
          </div>
          <button
            onClick={() => { setPlayer2(''); onClose(); }}
            aria-label="Close"
            className="text-white rounded-full p-2 hover:opacity-80 transition-opacity cursor-pointer"
            style={{ background: 'transparent' }}
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="text-sm text-white-300">Player 1</label>
            <input
              type="text"
              value={player1}
              onChange={(e) => setPlayer1(e.target.value)}
              placeholder="player1"
              className={
                "px-4 py-3 rounded outline-none cursor-target transition-colors " +
                (logged ? "text-gray-300 cursor-not-allowed" : "text-white")
              }
              style={{
                backgroundColor: logged ? "rgba(255,255,255,0.03)" : "oklch(38% 0.189 293.745)",
                color: logged ? "#9ca3af" : undefined,
                border: logged ? "1px solid rgba(255,255,255,0.03)" : undefined,
                boxShadow: logged ? "inset 0 0 0 1px rgba(0,0,0,0.2)" : undefined,
              }}
              disabled={logged}
            />
            <small style={{ color: logged ? 'rgba(156,163,175,1)' : 'rgba(255,255,255,0.6)' }}>
              {logged ? 'logged in - locked username' : 'If you are logged in, the field will be pre-filled.'}
            </small>

            <label className="text-sm text-white-300">Player 2</label>
            <input
              type="text"
              value={player2}
              onChange={(e) => setPlayer2(e.target.value)}
              placeholder="player2"
              className="px-4 py-3 rounded text-white outline-none cursor-target"
              style={{ backgroundColor: 'oklch(38% 0.189 293.745)' }}
              disabled={loading}
            />

            {error && (
              <div className="px-4 py-2 rounded text-sm" style={{ background: 'rgba(255,40,40,0.08)', color: '#ff6b6b' }}>
                {error}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 mt-2">
             

              <button
                type="submit"
                className="px-5 py-2 rounded-full text-white font-semibold hover:scale-103 active:scale-95 cursor-target transition-transform shadow-xl"
                style={{ backgroundColor: 'oklch(25.7% 0.09 281.288)' }}
                disabled={loading || !player1.trim() || !player2.trim()}
              >
                {loading ? 'Démarrage...' : 'Start Match'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}