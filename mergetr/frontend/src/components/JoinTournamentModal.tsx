// components/JoinTournamentModal.tsx
import { useState } from 'react';
import TournamentService, { type Tournament } from '../services/tournamentService';

interface JoinTournamentModalProps {
  isOpen: boolean;
  tournament: Tournament;
  onClose: () => void;
  onJoined: () => void;
}

export default function JoinTournamentModal({ isOpen, tournament, onClose, onJoined }: JoinTournamentModalProps) {
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleAliasChange = async (newAlias: string) => {
    setAlias(newAlias);
    setError('');

    if (newAlias.trim().length >= 2) {
      setChecking(true);
      try {
        const result = await TournamentService.checkAlias(tournament.id, newAlias.trim());
        if (!result.canJoin && result.reason) {
          setError(result.reason);
        }
      } catch (err: any) {
        // Silently ignore check errors to not overwhelm user
      } finally {
        setChecking(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias.trim()) return;

    setLoading(true);
    setError('');

    try {
      await TournamentService.registerToTournament(tournament.id, alias.trim());
      setAlias('');
      onJoined();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAlias('');
    setError('');
    onClose();
  };

  const getModeText = (mode: string) => {
    switch (mode) {
      case '4_players': return '4 joueurs';
      case '8_players': return '8 joueurs';
      default: return mode;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content tournament-modal">
        <h2 className="modal-title">Rejoindre le tournoi</h2>

        {/* Tournament Info */}
        <div className="tournament-info-card">
          <h3>{tournament.name}</h3>
          {tournament.description && (
            <p className="tournament-description">{tournament.description}</p>
          )}
          <div className="tournament-details">
            <div><strong>Mode:</strong> {getModeText(tournament.mode)}</div>
            <div><strong>Participants:</strong> {tournament.participant_count}/{tournament.max_players}</div>
            <div><strong>Places restantes:</strong> {tournament.max_players - tournament.participant_count}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Votre nom dans le tournoi :
            </label>
            <input
              type="text"
              value={alias}
              onChange={(e) => handleAliasChange(e.target.value)}
              placeholder="Entrez votre pseudo"
              className="form-input"
              disabled={loading}
              required
              minLength={2}
              maxLength={50}
            />
            <div className="form-help">
              Ce nom sera affiché dans l'arborescence du tournoi
            </div>
            {checking && (
              <div className="checking-message">
                Vérification...
              </div>
            )}
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="tournament-rules">
            <h4>Règles du tournoi :</h4>
            <ul>
              <li>Tournoi à élimination directe</li>
              <li>Matchs en local uniquement</li>
              <li>Pas de match nul autorisé</li>
              <li>Le gagnant avance au tour suivant</li>
            </ul>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn-cancel"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading || !alias.trim() || checking || !!error}
            >
              {loading ? 'Inscription...' : 'Rejoindre le tournoi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
