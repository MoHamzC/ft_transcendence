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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadTournamentInfo();
  }, [tournamentId]);

  const loadTournamentInfo = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tournament/${tournamentId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTournament(data.tournament);
          setAliases(Array(data.tournament.max_players).fill(''));
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
    const filledAliases = aliases.filter(alias => alias.trim() !== '');

    if (filledAliases.length !== 4) {
      setError('Exactly four aliases are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      for (const alias of filledAliases) {
        const response = await fetch(`${BACKEND_URL}/api/tournament/${tournamentId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            alias: alias.trim(),
            isTemporary: true
          })
        });

        const data = await response.json();
        if (!data.success) {
          setError(data.error || `Failed to join with alias: ${alias}`);
          return;
        }
      }

      setSuccess(`Successfully joined ${filledAliases.length} players to the tournament!`);
      setTimeout(() => {
        navigate('/tournament');
      }, 2000);

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
                    onChange={(e) => handleAliasChange(index, e.target.value)}
                    placeholder={`Alias for player ${index + 1}`}
                    className="form-input"
                    maxLength={50}
                  />
                </div>
              ))}
            </div>

            <div className="form-actions" style={{ marginTop: '30px', textAlign: 'center' }}>
              <button
                onClick={joinTournamentWithAliases}
                className="action-btn join-btn"
                disabled={loading || aliases.filter(alias => alias.trim() !== '').length !== 4}
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
