import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FuzzyText from './FuzzyText';
import TargetCursor from './TargetCursor';
import './TournamentTemp.css';
import TournamentService from './services/tournamentService';

type TempParticipant = { alias: string; player_slot?: number; is_authenticated?: boolean };

interface TournamentTemp {
  id: string;
  name: string;
  mode: string;
  max_players: number;
  status: string;
  current_players?: number;
}

const BACKEND_URL = 'http://localhost:5001';

export default function JoinTournamentPage() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<TournamentTemp | null>(null);
  const [aliases, setAliases] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [persisted, setPersisted] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    
    void loadTournamentInfo();
  }, [tournamentId]);

  useEffect(() => {
    
    const fetchUser = async () => {
      try {
        let r = await fetch(`${BACKEND_URL}/api/players/me`, { credentials: 'include' });
        if (!r.ok) r = await fetch(`${BACKEND_URL}/api/users/me`, { credentials: 'include' });
        if (r.ok) {
          const data = await r.json();
          const name = data.name || data.username || data.user?.username || null;
          if (name) setCurrentUser(name);
        }
      } catch (e) {
        // ignore
      }
    };
    void fetchUser();
  }, []);

  
  useEffect(() => {
    if (!currentUser) return;
    if (!aliases || aliases.length === 0) return;
    if (persisted && persisted[0]) return;

    setAliases(prev => {
      const copy = [...prev];
      if (copy[0] === currentUser) return prev;
      copy[0] = currentUser;
      return copy;
    });
  }, [currentUser, persisted]);

  const loadTournamentInfo = async () => {
    if (!tournamentId) return;
    setError('');
    try {
      
      const res = await fetch(`${BACKEND_URL}/api/tournament-temp/${tournamentId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          applyTempTournamentData(data.tournament, data.participants || []);
          return;
        }
      }

      try {
        const details = await TournamentService.getTournamentDetails(tournamentId!);
       
        const t: TournamentTemp = {
          id: details.id,
          name: details.name,
          mode: details.mode,
          max_players: details.max_players,
          status: details.status,
          current_players: details.participant_count || 0
        };
        const participants = (details.participants || []).map(p => ({ alias: p.alias } as TempParticipant));
        applyTempTournamentData(t, participants);
        return;
      } catch (e) {
      
      }

      setError('Failed to load tournament (404)');
    } catch (err) {
      console.error('Error loading tournament:', err);
      setError('Failed to load tournament');
    }
  };

  const applyTempTournamentData = (t: TournamentTemp, participants: TempParticipant[]) => {
    setTournament(t);
    const max = t.max_players || 2;
    const arr = Array(max).fill('') as string[];
    const persistedArr = Array(max).fill(false) as boolean[];
    participants.forEach((p, idx) => {
      const slot = (p.player_slot ? p.player_slot - 1 : idx);
      if (slot >= 0 && slot < max) {
        arr[slot] = p.alias || '';
        persistedArr[slot] = true;
        if (p.is_authenticated && !currentUser) setCurrentUser(p.alias || null);
      }
    });
    if (currentUser && !persistedArr[0]) arr[0] = currentUser;
    setAliases(arr);
    setPersisted(persistedArr);
  };

  const handleAliasChange = (index: number, value: string) => {
    const copy = [...aliases];
    copy[index] = value;
    setAliases(copy);
  };

  const joinTournamentWithAliases = async () => {
    if (!tournament) return;
    const trimmed = aliases.map(a => a.trim());
    const missing = trimmed.some((a, i) => !persisted[i] && a === '');
    if (missing) { setError('Fill all empty alias slots'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      for (let i = 0; i < trimmed.length; i++) {
        if (persisted[i]) continue;
        const alias = trimmed[i];
        const resp = await fetch(`${BACKEND_URL}/api/tournament-temp/${tournament.id}/join`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ alias, isTemporary: i === 0 ? !currentUser : true })
        });
        const data = await resp.json();
        if (!data.success) { setError(data.error || 'Failed to join'); return; }
      }
      
      try { await fetch(`${BACKEND_URL}/api/tournament-temp/${tournament.id}/start`, { method: 'POST', credentials: 'include' }); } catch {}
      setSuccess('Players registered successfully! Starting...');
      setTimeout(() => navigate(`/tournament/${tournament.id}/play`), 1000);
    } catch (e) {
      console.error(e); setError('Network error occurred');
    } finally { setLoading(false); }
  };

 

  
  if (!tournament) {
    return (
      <div className="tournament-container"><div className="loading">Loading tournament...</div></div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <TargetCursor hideDefaultCursor={true} spinDuration={2} />

      <div className="max-w-4xl w-full mx-4 p-8">
        <div className="flex items-center justify-between mb-8">
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 className="text-white">
              <div style={{ display: 'inline-block' }}>
                <FuzzyText fontSize="clamp(1.5rem, 3.5vw, 3rem)">Join Tournament</FuzzyText>
              </div>
            </h1>
            <div className="text-gray-400 mt-2">{tournament.mode.replace('_', ' ')} · {tournament.current_players ?? 0}/{tournament.max_players}</div>
          </div>

          {/* <div className="text-right" style={{ width: 180 }}>
            {currentUser ? (
              <div className="text-sm text-green-300">{currentUser}</div>
            ) : (
              <div className="text-sm text-gray-400">Not connected</div>
            )}
            
          </div> */}
        </div>

        <div
          className="group relative cursor-target active:scale-95 overflow-hidden mb-8"
          style={{ background: 'oklch(25.7% 0.09 281.288)', borderRadius: '1rem' }}
        >
          <div className="absolute -inset-1 rounded-2xl blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
          <div className="relative backdrop-blur-sm rounded-2xl p-6 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
            <h3 className="mb-2 text-blue-300 group-hover:text-blue-200 transition-colors duration-300">{tournament.name}</h3>
            <p className="text-gray-300 mb-4">Enter names for players to join this tournament.</p>

            {error && <div className="px-4 py-2 rounded text-sm" style={{ background: 'rgba(255,40,40,0.08)', color: '#ff6b6b' }}>{error}</div>}
            {success && <div className="px-4 py-2 rounded text-sm" style={{ background: 'rgba(0,200,0,0.06)', color: '#7ee787' }}>{success}</div>}

            <div className="grid" style={{ gridTemplateColumns: tournament.max_players <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
              {aliases.map((a, idx) => (
                <div key={idx} className="form-group">
                  <label className="text-sm text-green-300">Player {idx + 1}</label>
                  <input
                    className="px-4 py-3 rounded outline-none cursor-target text-white"
                    style={{ backgroundColor: 'oklch(38% 0.189 293.745)' }}
                    value={a}
                    onChange={(e) => { if (currentUser && idx === 0) return; handleAliasChange(idx, e.target.value); }}
                    disabled={!!currentUser && idx === 0}
                  />
                  {currentUser && idx === 0 && (
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>Connected username locked</div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => {
                  if (tournament) navigate(`/tournament/${tournament.id}/play`);
                  void joinTournamentWithAliases();
                }}
                disabled={loading}
                className="block w-full text-center px-6 py-3 rounded-xl cursor-target border border-purple-500/20 hover:scale-105 active:scale-95 transition-transform bg-green-300 text-white"
              >
                {loading ? 'Joining...' : 'Join Tournament'}
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
