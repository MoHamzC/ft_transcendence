import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FuzzyText from './FuzzyText';
import TargetCursor from './TargetCursor';
import './TournamentTemp.css';

// Interfaces removed (simplified view)

export default function TournamentTemp() {
  const navigate = useNavigate();
  // (Simplified view — detailed tournament listing removed for now)
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Formulaires
  // const [joinAlias, setJoinAlias] = useState('');

  useEffect(() => { /* future: fetch active tournaments */ }, []);

  // joinTournament removed (simplified component)

  // Removed detailed tournament loading for now

  // startTournament removed (will be triggered elsewhere)

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // renderSlots removed (UI simplified)

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
