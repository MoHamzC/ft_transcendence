import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  created_at: string;
  creator_username?: string;
}

interface Participant {
  id: string;
  alias: string;
  player_slot: number;
  is_authenticated: boolean;
  is_temporary?: boolean;
  user_username?: string;
}

interface Match {
  id: string;
  round_number: number;
  match_number: number;
  player1_alias: string;
  player2_alias: string;
  winner_alias?: string;
  status: string;
}

const BACKEND_URL = 'http://localhost:5001';

export default function TournamentTemp() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Formulaires
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTournamentName, setNewTournamentName] = useState('');
  const [newTournamentMode, setNewTournamentMode] = useState('4_players');
  const [joinAlias, setJoinAlias] = useState('');

  useEffect(() => {
    loadActiveTournaments();
  }, []);

  const loadActiveTournaments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/tournament/active`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTournaments(data.tournaments);
        }
      }
    } catch (err) {
      console.error('Error loading tournaments:', err);
      setError('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const joinTournament = async (tournamentId: string) => {
    if (!joinAlias.trim()) {
      setError('Alias is required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/tournament/${tournamentId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          alias: joinAlias.trim(),
          isTemporary: true
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Joined tournament as ${joinAlias}!`);
        setJoinAlias('');
        loadTournamentDetails(tournamentId);
        loadActiveTournaments();
      } else {
        setError(data.error || 'Failed to join tournament');
      }
    } catch (err) {
      console.error('Error joining tournament:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadTournamentDetails = async (tournamentId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tournament/${tournamentId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentTournament(data.tournament);
          setParticipants(data.participants);

          // Charger aussi les matchs
          loadTournamentMatches(tournamentId);
        }
      }
    } catch (err) {
      console.error('Error loading tournament details:', err);
    }
  };

  const loadTournamentMatches = async (tournamentId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tournament/${tournamentId}/matches`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMatches(data.matches);
        }
      }
    } catch (err) {
      console.error('Error loading matches:', err);
    }
  };

  const startTournament = async (tournamentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/tournament/${tournamentId}/start`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Tournament started!');
        loadTournamentDetails(tournamentId);
        loadActiveTournaments();
      } else {
        setError(data.error || 'Failed to start tournament');
      }
    } catch (err) {
      console.error('Error starting tournament:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const renderSlots = (tournament: Tournament, participantsList: Participant[]) => {
    const slots = [];
    for (let i = 1; i <= tournament.max_players; i++) {
      const participant = participantsList.find(p => p.player_slot === i);
      slots.push(
        <div key={i} className={`slot ${participant ? 'filled' : 'empty'}`}>
          <div className="slot-number">#{i}</div>
          <div className="slot-content">
            {participant ? (
              <>
                <span className="player-alias">{participant.alias}</span>
                <span className={`player-type ${participant.is_authenticated ? 'auth' : 'temp'}`}>
                  {participant.is_authenticated ? '👤' : '👻'}
                </span>
              </>
            ) : (
              <span className="empty-text">Empty</span>
            )}
          </div>
        </div>
      );
    }
    return slots;
  };

  return (
    <div className="tournament-container" style={{ justifySelf: 'stretch', alignSelf: 'stretch' }}>
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />

      <div className="tournament-header">
        <h1><FuzzyText>Tournament System</FuzzyText></h1>
        <p>Create and join tournaments with temporary users</p>
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
        <div className="left-panel">
          <div className="section">
            <div className="section-header">
              <h2>Quick Actions</h2>
            </div>
            <div className="quick-actions">
              <button
                onClick={() => navigate('/createtournament')}
                className="action-btn create-btn"
              >
                ➕ Create Tournament
              </button>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="section">
            <div className="empty-state">
              <h3>Tournament Management</h3>
              <p>Use the Quick Actions to create new tournaments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-actions">
        <button
          onClick={() => navigate('/selectplayers')}
          className="action-btn back-btn"
        >
          ← Back to Player Selection
        </button>
        <button
          onClick={() => navigate('/pong')}
          className="action-btn pong-btn"
        >
          🏓 Go to Pong Games
        </button>
      </div>
    </div>
  );
}
