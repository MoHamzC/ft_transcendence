import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FuzzyText from './FuzzyText';
import TargetCursor from './TargetCursor';
import './TournamentTemp.css';

const BACKEND_URL = 'http://localhost:5001';

export default function CreateTournamentPage() {
  const navigate = useNavigate();
  const [newTournamentName, setNewTournamentName] = useState('');
  const [newTournamentMode, setNewTournamentMode] = useState('4_players');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const createTournament = async () => {
    if (!newTournamentName.trim()) {
      setError('Tournament name is required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/tournament/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newTournamentName.trim(),
          mode: newTournamentMode
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Tournament created successfully!');
        setNewTournamentName('');
        setTimeout(() => {
          navigate(`/jointournament/${data.tournament.id}`);
        }, 2000);
      } else {
        setError(data.error || 'Failed to create tournament');
      }
    } catch (err) {
      console.error('Error creating tournament:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="tournament-container" style={{ justifySelf: 'stretch', alignSelf: 'stretch' }}>
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />

      <div className="tournament-header">
        <h1><FuzzyText>Create Tournament</FuzzyText></h1>
        <p>Set up a new tournament for players to join</p>
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
            <h2>Tournament Details</h2>
          </div>

          <div className="form-group">
            <label>Tournament Name:</label>
            <input
              type="text"
              value={newTournamentName}
              onChange={(e) => setNewTournamentName(e.target.value)}
              placeholder="Enter tournament name"
              className="form-input"
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label>Tournament Mode:</label>
            <select
              value={newTournamentMode}
              onChange={(e) => setNewTournamentMode(e.target.value)}
              className="form-select"
            >
              <option value="4_players">4 Players</option>
              <option value="8_players">8 Players</option>
              <option value="16_players">16 Players</option>
            </select>
          </div>

          <div className="tournament-preview">
            <h3>Tournament Preview</h3>
            <div className="preview-details">
              <div className="detail-item">
                <strong>Name:</strong> {newTournamentName || 'Unnamed Tournament'}
              </div>
              <div className="detail-item">
                <strong>Max Players:</strong> {newTournamentMode.replace('_players', '')}
              </div>
              <div className="detail-item">
                <strong>Mode:</strong> {newTournamentMode.replace('_', ' ')}
              </div>
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '30px', textAlign: 'center' }}>
            <button
              onClick={createTournament}
              className="action-btn create-confirm-btn"
              disabled={loading || !newTournamentName.trim()}
              style={{ marginRight: '15px' }}
            >
              {loading ? 'Creating...' : 'Create Tournament'}
            </button>
            <button
              onClick={() => navigate('/join')}
              className="action-btn cancel-btn"
            >
              ← Back to Tournaments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
