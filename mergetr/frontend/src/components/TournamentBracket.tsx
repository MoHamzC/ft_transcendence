// components/TournamentBracket.tsx
import { useState, useEffect } from 'react';
import TournamentService, { type Tournament, type TournamentDetails, type TournamentMatch } from '../services/tournamentService';

interface TournamentBracketProps {
  tournament: Tournament;
  onBack: () => void;
}

export default function TournamentBracket({ tournament, onBack }: TournamentBracketProps) {
  const [details, setDetails] = useState<TournamentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);

  const loadTournamentDetails = async () => {
    try {
      setLoading(true);
      const tournamentDetails = await TournamentService.getTournamentDetails(tournament.id);
      setDetails(tournamentDetails);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des détails');
      console.error('Error loading tournament details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournamentDetails();
  }, [tournament.id]);

  const organizeMatchesByRound = (matches: TournamentMatch[]) => {
    const rounds: { [key: number]: TournamentMatch[] } = {};
    matches.forEach(match => {
      if (!rounds[match.round_number]) {
        rounds[match.round_number] = [];
      }
      rounds[match.round_number].push(match);
    });

    // Sort matches within each round by match_number
    Object.keys(rounds).forEach(round => {
      rounds[parseInt(round)].sort((a, b) => a.match_number - b.match_number);
    });

    return rounds;
  };

  const handleMatchClick = (match: TournamentMatch) => {
    if (match.status === 'pending' && tournament.status === 'in_progress') {
      setSelectedMatch(match);
      setShowScoreModal(true);
    }
  };

  const handleScoreSubmit = async (winnerId: string, player1Score: number, player2Score: number) => {
    if (!selectedMatch) return;

    try {
      await TournamentService.recordMatchResult(selectedMatch.id, winnerId, player1Score, player2Score);
      setShowScoreModal(false);
      setSelectedMatch(null);
      await loadTournamentDetails(); // Reload to see updates
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement du score');
    }
  };

  const getRoundName = (roundNumber: number, maxRounds: number) => {
    if (roundNumber === maxRounds) return 'Finale';
    if (roundNumber === maxRounds - 1) return 'Demi-finale';
    if (roundNumber === maxRounds - 2) return 'Quart de finale';
    return `Tour ${roundNumber}`;
  };

  const getMatchStatusClass = (match: TournamentMatch) => {
    switch (match.status) {
      case 'pending': return 'match-pending';
      case 'in_progress': return 'match-in-progress';
      case 'finished': return 'match-finished';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="tournament-bracket-container">
        <div className="loading-message">Chargement de l'arborescence...</div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="tournament-bracket-container">
        <div className="error-message">
          {error || 'Impossible de charger les détails du tournoi'}
          <button onClick={onBack} className="btn-secondary">Retour</button>
        </div>
      </div>
    );
  }

  const matchesByRound = organizeMatchesByRound(details.matches);
  const maxRounds = Math.max(...Object.keys(matchesByRound).map(Number));

  return (
    <div className="tournament-bracket-container">
      {/* Header */}
      <div className="bracket-header">
        <button onClick={onBack} className="btn-back">← Retour</button>
        <div className="bracket-title">
          <h1>{details.name}</h1>
          <div className="bracket-status">
            {tournament.status === 'finished' && details.winner_alias ? (
              <span className="winner-announcement">🏆 Gagnant: {details.winner_alias}</span>
            ) : (
              <span className={`status-badge status-${tournament.status}`}>
                {tournament.status === 'in_progress' ? 'En cours' : 
                 tournament.status === 'finished' ? 'Terminé' : 'Inscriptions'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="participants-section">
        <h3>Participants ({details.participants.length}/{details.max_players})</h3>
        <div className="participants-list">
          {details.participants.map(participant => (
            <div 
              key={participant.id} 
              className={`participant-card ${participant.is_eliminated ? 'eliminated' : ''}`}
            >
              <span className="participant-alias">{participant.alias}</span>
              {participant.is_eliminated && <span className="eliminated-badge">Éliminé</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Bracket */}
      {Object.keys(matchesByRound).length > 0 && (
        <div className="bracket-section">
          <h3>Arborescence</h3>
          <div className="bracket-rounds">
            {Object.keys(matchesByRound)
              .map(Number)
              .sort((a, b) => a - b)
              .map(roundNumber => (
                <div key={roundNumber} className="bracket-round">
                  <h4 className="round-title">
                    {getRoundName(roundNumber, maxRounds)}
                  </h4>
                  <div className="round-matches">
                    {matchesByRound[roundNumber].map(match => (
                      <div 
                        key={match.id} 
                        className={`match-card ${getMatchStatusClass(match)} ${match.status === 'pending' && tournament.status === 'in_progress' ? 'clickable' : ''}`}
                        onClick={() => handleMatchClick(match)}
                      >
                        <div className="match-header">
                          <span className="match-number">Match #{match.match_number}</span>
                          <span className={`match-status ${match.status}`}>
                            {match.status === 'pending' ? 'À jouer' :
                             match.status === 'in_progress' ? 'En cours' : 'Terminé'}
                          </span>
                        </div>
                        
                        <div className="match-players">
                          <div className={`player ${match.winner_id === match.player1_id ? 'winner' : ''}`}>
                            <span className="player-name">{match.player1_alias || 'À déterminer'}</span>
                            {match.status === 'finished' && (
                              <span className="player-score">{match.player1_score}</span>
                            )}
                          </div>
                          
                          <div className="vs-divider">VS</div>
                          
                          <div className={`player ${match.winner_id === match.player2_id ? 'winner' : ''}`}>
                            <span className="player-name">{match.player2_alias || 'À déterminer'}</span>
                            {match.status === 'finished' && (
                              <span className="player-score">{match.player2_score}</span>
                            )}
                          </div>
                        </div>

                        {match.status === 'finished' && match.winner_alias && (
                          <div className="match-winner">
                            Gagnant: {match.winner_alias}
                          </div>
                        )}

                        {match.status === 'pending' && tournament.status === 'in_progress' && (
                          <div className="match-action">
                            Cliquer pour saisir le score
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Score Input Modal */}
      {showScoreModal && selectedMatch && (
        <ScoreInputModal
          match={selectedMatch}
          onSubmit={handleScoreSubmit}
          onClose={() => {
            setShowScoreModal(false);
            setSelectedMatch(null);
          }}
        />
      )}
    </div>
  );
}

// Score Input Modal Component
interface ScoreInputModalProps {
  match: TournamentMatch;
  onSubmit: (winnerId: string, player1Score: number, player2Score: number) => void;
  onClose: () => void;
}

function ScoreInputModal({ match, onSubmit, onClose }: ScoreInputModalProps) {
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (player1Score === player2Score) {
      setError('Match nul non autorisé dans un tournoi à élimination');
      return;
    }

    if (player1Score < 0 || player2Score < 0) {
      setError('Les scores ne peuvent pas être négatifs');
      return;
    }

    const winnerId = player1Score > player2Score ? match.player1_id : match.player2_id;
    onSubmit(winnerId, player1Score, player2Score);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content score-modal">
        <h2 className="modal-title">Saisir le résultat du match</h2>
        
        <div className="match-info">
          <div className="players">
            <span>{match.player1_alias}</span>
            <span className="vs">VS</span>
            <span>{match.player2_alias}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="score-inputs">
            <div className="score-input-group">
              <label>{match.player1_alias}</label>
              <input
                type="number"
                min="0"
                value={player1Score}
                onChange={(e) => setPlayer1Score(parseInt(e.target.value) || 0)}
                className="score-input"
                required
              />
            </div>
            
            <div className="score-input-group">
              <label>{match.player2_alias}</label>
              <input
                type="number"
                min="0"
                value={player2Score}
                onChange={(e) => setPlayer2Score(parseInt(e.target.value) || 0)}
                className="score-input"
                required
              />
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Annuler
            </button>
            <button type="submit" className="btn-submit">
              Valider le résultat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
