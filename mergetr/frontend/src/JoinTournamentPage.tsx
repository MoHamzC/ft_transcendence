import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FuzzyText from './FuzzyText';
import TargetCursor from './TargetCursor';
import './TournamentTemp.css';

interface Tournament {
  id: string;
  name: string;
  mode: string;
  max_players: number;
  status: string;
  current_players: number;
}

const BACKEND_URL = 'http://localhost:5001';

export default function JoinTournamentPage() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [aliases, setAliases] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [persisted, setPersisted] = useState<boolean[]>([]); // slots already in DB
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadTournamentInfo();
  }, [tournamentId]);

  // Fetch current logged-in user (username) and prefill first alias
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Try /api/players/me first (lightweight)
        let r = await fetch(`${BACKEND_URL}/api/players/me`, { credentials: 'include' });
        if (!r.ok) {
          // Fallback to /api/users/me (full user route)
          r = await fetch(`${BACKEND_URL}/api/users/me`, { credentials: 'include' });
        }
        if (r.ok) {
          const data = await r.json();
          const name = data.name || data.username || data.user?.username || null;
          if (name) {
            setCurrentUser(name);
            // Prefill first alias only if not already filled
            setAliases(prev => {
              if (prev.length === 0) return prev; // wait tournament load
              if (prev[0]) return prev; // don't overwrite manual input
              const copy = [...prev];
              copy[0] = name;
              return copy;
            });
          }
        }
      } catch {/* silently ignore */}
    };
    fetchUser();
  }, []);

  const loadTournamentInfo = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tournament-temp/${tournamentId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTournament(data.tournament);
          const max = data.tournament.max_players;
          const arr = Array(max).fill('') as string[];
          const persistedArr = Array(max).fill(false) as boolean[];
          if (data.participants && Array.isArray(data.participants)) {
            // Positionner chaque participant déjà inscrit
            data.participants.forEach((p:any, idx:number) => {
              const slotIndex = (p.player_slot ? p.player_slot - 1 : idx);
              if (slotIndex >=0 && slotIndex < max) {
                arr[slotIndex] = p.alias;
                persistedArr[slotIndex] = true;
                // Si c'est l'utilisateur authentifié on retient son alias
                if (p.is_authenticated && !currentUser) {
                  setCurrentUser(p.alias);
                }
              }
            });
          }
          // Si aucun participant authentifié encore détecté mais currentUser existe, préremplir slot 0
          if (currentUser && !persistedArr[0]) {
            arr[0] = currentUser;
          }
          setAliases(arr);
          setPersisted(persistedArr);
        }
      }
    } catch (err) {
      console.error('Error loading tournament:', err);
      setError('Failed to load tournament');
    }
  };

  const handleAliasChange = (index: number, value: string) => {
    const newAliases = [...aliases];
    newAliases[index] = value;
    setAliases(newAliases);
  };

  const joinTournamentWithAliases = async () => {
    const trimmed = aliases.map(a => a.trim());
    // Vérifier uniquement les slots non persistés
    const missing = trimmed.some((a, i) => !persisted[i] && a === '');

    if (!tournament) return;
    if (missing) {
      setError('Fill all empty alias slots');
      return;
    }

    // Ensure first alias matches logged-in user if available
    if (currentUser && trimmed[0] && trimmed[0] !== currentUser) {
      // Accept difference, but still treat first as permanent if user is logged and wants custom alias
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      for (let i = 0; i < trimmed.length; i++) {
        if (persisted[i]) continue; // déjà en DB
        const alias = trimmed[i];
        const response = await fetch(`${BACKEND_URL}/api/tournament-temp/${tournamentId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            alias,
            // First slot: if user logged -> permanent (isTemporary false); else true
            isTemporary: i === 0 ? !currentUser : true
          })
        });

        const data = await response.json();
        if (!data.success) {
          setError(data.error || `Failed to join with alias: ${alias}`);
          return;
        }
      }

      // Démarrer automatiquement le tournoi puis rediriger vers l'écran de jeu
      try {
        await fetch(`${BACKEND_URL}/api/tournament-temp/${tournamentId}/start`, { method:'POST', credentials:'include' });
      } catch {}
      setSuccess('Players registered successfully! Starting...');
      setTimeout(() => {
        navigate(`/tournament/${tournamentId}/play`);
      }, 1200);

    } catch (err) {
      console.error('Error joining tournament:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  if (!tournament) {
    return (
      <div className="tournament-container">
        <div className="loading">Loading tournament...</div>
      </div>
    );
  }

  return (
    <div className="tournament-container" style={{ justifySelf: 'stretch', alignSelf: 'stretch' }}>
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />

      <div className="tournament-header">
        <h1><FuzzyText>Join Tournament</FuzzyText></h1>
        <p>Enter aliases for players to join: {tournament.name}</p>
      </div>

      {error && (
        <div className="message error-message">
          {error}
          <button onClick={clearMessages} className="close-btn">×</button>
        </div>
      )}

      {success && (
        <div className="message success-message">
          {success}
          <button onClick={clearMessages} className="close-btn">×</button>
        </div>
      )}

      <div className="main-content">
        <div className="section" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="section-header">
            <h2>{tournament.name}</h2>
            <span className={`status ${tournament.status}`}>
              {tournament.status}
            </span>
          </div>

          <div className="tournament-details">
            <div className="detail-item">
              <strong>Mode:</strong> {tournament.mode.replace('_', ' ')}
            </div>
            <div className="detail-item">
              <strong>Max Players:</strong> {tournament.max_players}
            </div>
            <div className="detail-item">
              <strong>Current Players:</strong> {tournament.current_players}
            </div>
          </div>

          <div className="aliases-form">
            <h3>Enter Player Aliases</h3>
            <p>Fill in the aliases for players you want to add to the tournament:</p>

            <div className="aliases-grid" style={{
              display: 'grid',
              gridTemplateColumns: tournament.max_players <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: '15px',
              marginTop: '20px'
            }}>
              {aliases.map((alias, index) => (
                <div key={index} className="form-group">
                  <label>Player {index + 1}:</label>
                  <input
                    type="text"
                    value={alias}
                    onChange={(e) => {
                      // Empêcher modification du pseudo de l'utilisateur connecté (slot 1)
                      if (currentUser && index === 0) return;
                      handleAliasChange(index, e.target.value);
                    }}
                    placeholder={`Alias for player ${index + 1}`}
                    className="form-input"
                    maxLength={50}
                    disabled={!!currentUser && index === 0}
                    style={currentUser && index === 0 ? { background:'#2a2a2a', color:'#888', cursor:'not-allowed' } : undefined}
                  />
                  {currentUser && index === 0 && (
                    <div style={{ fontSize:'0.65rem', opacity:0.6, marginTop:'4px' }}>
                      Connected username locked
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="form-actions" style={{ marginTop: '30px', textAlign: 'center' }}>
              <button
                onClick={joinTournamentWithAliases}
                className="action-btn join-btn"
                disabled={loading || aliases.some((a,i)=> !persisted[i] && a.trim()==='')}
                style={{ marginRight: '15px' }}
              >
                {loading ? 'Joining...' : 'Join Tournament'}
              </button>
              <button
                onClick={() => navigate('/tournament')}
                className="action-btn cancel-btn"
              >
                ← Back to Tournaments
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
