// components/CreateTournamentModal.tsx
import { useState } from 'react';
import TournamentService from '../services/tournamentService';

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTournamentCreated: () => void;
}

export default function CreateTournamentModal({ isOpen, onClose, onTournamentCreated }: CreateTournamentModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'4_players' | '8_players'>('4_players');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      await TournamentService.createTournament(name.trim(), description.trim(), mode);
      setName('');
      setDescription('');
      setMode('4_players');
      onTournamentCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du tournoi');
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content tournament-modal">
        <h2 className="modal-title">Créer un nouveau tournoi</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Nom du tournoi :
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Entrez le nom du tournoi"
              className="form-input"
              disabled={loading}
              required
              minLength={3}
              maxLength={255}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Description (optionnelle) :
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du tournoi"
              className="form-input form-textarea"
              disabled={loading}
              maxLength={1000}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Mode de jeu :
            </label>
            <div className="mode-selection">
              <div className="mode-option">
                <input
                  type="radio"
                  id="mode-4"
                  name="mode"
                  value="4_players"
                  checked={mode === '4_players'}
                  onChange={(e) => setMode(e.target.value as '4_players' | '8_players')}
                  disabled={loading}
                />
                <label htmlFor="mode-4" className="mode-label">
                  <div className="mode-card">
                    <div className="mode-title">4 Joueurs</div>
                    <div className="mode-description">
                      Tournoi rapide<br />
                      2 tours maximum<br />
                      Idéal pour débuter
                    </div>
                  </div>
                </label>
              </div>

              <div className="mode-option">
                <input
                  type="radio"
                  id="mode-8"
                  name="mode"
                  value="8_players"
                  checked={mode === '8_players'}
                  onChange={(e) => setMode(e.target.value as '4_players' | '8_players')}
                  disabled={loading}
                />
                <label htmlFor="mode-8" className="mode-label">
                  <div className="mode-card">
                    <div className="mode-title">8 Joueurs</div>
                    <div className="mode-description">
                      Tournoi complet<br />
                      3 tours maximum<br />
                      Plus de compétition
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

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
              disabled={loading || !name.trim()}
            >
              {loading ? 'Création...' : 'Créer le tournoi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
