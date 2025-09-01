import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TargetCursor from '../TargetCursor';
import TournamentService from '../services/tournamentService';

interface JoinProps {
  isOpen: boolean;
  onClose: () => void;
  onTournamentCreated: () => void;
}

export default function Join({ isOpen, onClose, onTournamentCreated }: JoinProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'4_players' | '8_players'>('4_players');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      setError('Please provide a tournament name.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await TournamentService.createTournament(name.trim(), description.trim(), mode);
      const createdId = res?.tournament?.id;
      setName('');
      setDescription('');
      setMode('4_players');
      onTournamentCreated();
      onClose();
      if (createdId) {
        navigate(`/tournament/${createdId}/join`);
      }
    } catch (err: any) {
      setError(err?.message || 'Error creating tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setMode('4_players');
    setError('');
    onClose();
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
            <h2 className="text-xl font-extrabold text-white text-center">Create Tournament</h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="text-white rounded-full p-2 hover:opacity-80 transition-opacity cursor-pointer"
            style={{ background: 'transparent' }}
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm text-green-300">Tournament Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter tournament name"
                className="px-4 py-3 rounded outline-none cursor-target text-white"
                style={{ backgroundColor: 'oklch(38% 0.189 293.745)' }}
                disabled={loading}
                required
                minLength={3}
                maxLength={255}
              />
            </div>

            {/* <div>
              <label className="text-sm text-green-300">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tournament description"
                className="form-input form-textarea px-4 py-3 rounded outline-none cursor-target text-white"
                style={{ backgroundColor: 'oklch(38% 0.189 293.745)' }}
                disabled={loading}
                maxLength={1000}
                rows={3}
              />
            </div> */}

            <div>
              <label className="text-sm text-green-300">Mode</label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <label className="mode-label">
                  <input
                    type="radio"
                    name="mode"
                    value="4_players"
                    checked={mode === '4_players'}
                    onChange={() => setMode('4_players')}
                    disabled={loading}
                  />
                  <div className="mode-card px-3 py-2 rounded mt-1" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="mode-title text-white">4 Players</div>
                    <div className="mode-description text-gray-300 text-sm">2 rounds</div>
                  </div>
                </label>

                <label className="mode-label">
                  <input
                    type="radio"
                    name="mode"
                    value="8_players"
                    checked={mode === '8_players'}
                    onChange={() => setMode('8_players')}
                    disabled={loading}
                  />
                  <div className="mode-card px-3 py-2 rounded mt-1" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="mode-title text-white">8 Players</div>
                    <div className="mode-description text-gray-300 text-sm">3 rounds </div>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div className="px-4 py-2 rounded text-sm" style={{ background: 'rgba(255,40,40,0.08)', color: '#ff6b6b' }}>
                {error}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 mt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 rounded-full text-white font-semibold hover:scale-103 active:scale-95 cursor-target transition-transform shadow-xl"
                style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.04)' }}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-full text-white font-semibold hover:scale-103 active:scale-95 cursor-target transition-transform shadow-xl"
                style={{ backgroundColor: 'oklch(25.7% 0.09 281.288)' }}
                disabled={loading || !name.trim()}
              >
                {loading ? 'Creating...' : 'Create Tournament'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}