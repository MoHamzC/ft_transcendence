import { useState, useEffect } from 'react';
import TournamentService, {
  type Tournament,
  type TournamentDetails,
  type RegistrationStatus,
  type AuthData
} from '../services/tournamentService';
import TournamentRegistration from './TournamentRegistration';
import TournamentBracket from './TournamentBracket';
import './TournamentManager.css';

interface TournamentManagerProps {
  tournament: Tournament;
  onBack: () => void;
  onTournamentUpdate: () => void;
}

export default function TournamentManager({
  tournament,
  onBack,
  onTournamentUpdate
}: TournamentManagerProps) {
  const [currentTournament, setCurrentTournament] = useState<TournamentDetails>(tournament as TournamentDetails);
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null);
  const [detectedAuth, setDetectedAuth] = useState<AuthData | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showBracket, setShowBracket] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadTournamentData();
    testAuthDetection();
  }, [tournament.id]);

  const loadTournamentData = async () => {
    try {
      setLoading(true);

      const [tournamentDetails, regStatus] = await Promise.all([
        TournamentService.getTournamentDetails(tournament.id),
        TournamentService.getRegistrationStatus(tournament.id)
      ]);

      setCurrentTournament(tournamentDetails);
      setRegistrationStatus(regStatus);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const testAuthDetection = async () => {
    try {
      const authResult = await TournamentService.testAuthDetection();
      setDetectedAuth(authResult.authData);
    } catch (err) {
      // Pas grave si la détection échoue
      console.warn('Auth detection failed:', err);
    }
  };

  const handleStartTournament = async () => {
    if (!confirm('Êtes-vous sûr de vouloir démarrer ce tournoi ?')) {
      return;
    }

    try {
      setLoading(true);
      const result = await TournamentService.startTournament(tournament.id);
      setSuccess(result.message);
      await loadTournamentData();
      onTournamentUpdate();
    } catch (err: any) {
      setError(err.message || 'Erreur lors du démarrage du tournoi');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRegister = async () => {
    if (!registrationStatus) return;

    const freeSlot = registrationStatus.slots.find(slot => !slot.occupied);
    if (!freeSlot) {
      setError('Aucun slot libre disponible');
      return;
    }

    try {
      setLoading(true);
      setError('');

      let result;
      if (detectedAuth) {
        // Inscription automatique avec authentification détectée
        result = await TournamentService.registerToTournament(tournament.id, {
          playerSlot: freeSlot.slot,
          authMode: 'auto'
        });
      } else {
        // Inscription anonyme rapide
        const alias = prompt('Entrez votre alias:');
        if (!alias?.trim()) {
          setError('Alias requis pour l\'inscription anonyme');
          return;
        }
        result = await TournamentService.registerAnonymous(tournament.id, freeSlot.slot, alias);
      }

      setSuccess(result.message);
      await loadTournamentData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration': return '#00ff88';
      case 'in_progress': return '#ffa500';
      case 'finished': return '#6c5ce7';
      case 'cancelled': return '#ff4757';
      default: return '#ffffff';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'registration': return 'Inscriptions ouvertes';
      case 'in_progress': return 'En cours';
      case 'finished': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  if (showBracket) {
    return (
      <TournamentBracket
        tournament={currentTournament}
        onBack={() => setShowBracket(false)}
      />
    );
  }

  return (
    <div className="tournament-manager">
      <div className="tournament-header">
        <button onClick={onBack} className="back-btn">
          ← Retour
        </button>
        <div className="tournament-title">
          <h1>{currentTournament.name}</h1>
          <div
            className="tournament-status"
            style={{ color: getStatusColor(currentTournament.status) }}
          >
            {getStatusText(currentTournament.status)}
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
          <button onClick={() => setSuccess('')} className="close-success">×</button>
        </div>
      )}

      {/* Détection d'authentification */}
      {detectedAuth && (
        <div className="auth-status">
          <div className="auth-detected">
            <h3>🔐 Utilisateur connecté</h3>
            <div className="auth-details">
              <span className="username">{detectedAuth.userAlias || detectedAuth.username}</span>
              <span className="provider">via {detectedAuth.provider}</span>
            </div>
          </div>
        </div>
      )}

      {/* Informations du tournoi */}
      <div className="tournament-info">
        <div className="info-card">
          <h3>Informations</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Mode:</label>
              <span>{currentTournament.mode === '4_players' ? '4 joueurs' : '8 joueurs'}</span>
            </div>
            <div className="info-item">
              <label>Participants:</label>
              <span>{registrationStatus?.occupiedSlots || 0}/{currentTournament.max_players}</span>
            </div>
            {currentTournament.winner_alias && (
              <div className="info-item">
                <label>Gagnant:</label>
                <span className="winner">{currentTournament.winner_alias}</span>
              </div>
            )}
            <div className="info-item">
              <label>Créé le:</label>
              <span>{new Date(currentTournament.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* État des inscriptions */}
      {registrationStatus && (
        <div className="registration-overview">
          <div className="slots-preview">
            <h3>État des inscriptions</h3>
            <div className="slots-bar">
              {registrationStatus.slots.map((slot) => (
                <div
                  key={slot.slot}
                  className={`slot-indicator ${slot.occupied ? 'occupied' : 'free'} ${slot.is_authenticated ? 'authenticated' : 'anonymous'}`}
                  title={slot.occupied ? `${slot.alias} (${slot.is_authenticated ? 'Authentifié' : 'Anonyme'})` : 'Slot libre'}
                >
                  {slot.slot}
                </div>
              ))}
            </div>
            <div className="slots-legend">
              <div className="legend-item">
                <div className="legend-indicator free"></div>
                <span>Libre</span>
              </div>
              <div className="legend-item">
                <div className="legend-indicator occupied anonymous"></div>
                <span>Anonyme</span>
              </div>
              <div className="legend-item">
                <div className="legend-indicator occupied authenticated"></div>
                <span>Authentifié</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions du tournoi */}
      <div className="tournament-actions">
        {currentTournament.status === 'registration' && (
          <>
            <div className="primary-actions">
              <button
                onClick={handleQuickRegister}
                disabled={loading || registrationStatus?.occupiedSlots === currentTournament.max_players}
                className="btn-primary quick-register"
              >
                {detectedAuth ?
                  '⚡ Inscription rapide (Auto)' :
                  '👤 Inscription rapide (Anonyme)'
                }
              </button>

              <button
                onClick={() => setShowRegistration(true)}
                disabled={loading || registrationStatus?.occupiedSlots === currentTournament.max_players}
                className="btn-secondary"
              >
                🎯 Inscription avancée
              </button>
            </div>

            {registrationStatus && registrationStatus.occupiedSlots >= 2 && (
              <div className="admin-actions">
                <button
                  onClick={handleStartTournament}
                  disabled={loading}
                  className="btn-primary start-tournament"
                >
                  🚀 Démarrer le tournoi
                </button>
              </div>
            )}
          </>
        )}

        {(currentTournament.status === 'in_progress' || currentTournament.status === 'finished') && (
          <div className="view-actions">
            <button
              onClick={() => setShowBracket(true)}
              className="btn-primary"
            >
              📊 Voir l'arborescence
            </button>
          </div>
        )}
      </div>

      {/* Participants list */}
      {currentTournament.participants && currentTournament.participants.length > 0 && (
        <div className="participants-section">
          <h3>Participants inscrits</h3>
          <div className="participants-list">
            {currentTournament.participants
              .sort((a, b) => a.registration_order - b.registration_order)
              .map((participant) => (
                <div key={participant.id} className="participant-card">
                  <div className="participant-info">
                    <span className="participant-alias">{participant.alias}</span>
                    <span className="participant-slot">Slot {participant.player_slot}</span>
                  </div>
                  <div className="participant-status">
                    {participant.is_authenticated ? (
                      <span className="auth-badge authenticated">🔐 Authentifié</span>
                    ) : (
                      <span className="auth-badge anonymous">👤 Anonyme</span>
                    )}
                    {participant.is_eliminated && (
                      <span className="eliminated-badge">❌ Éliminé</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modal d'inscription avancée */}
      {showRegistration && (
        <TournamentRegistration
          tournament={currentTournament}
          onRegistrationChange={() => {
            loadTournamentData();
            onTournamentUpdate();
          }}
          onClose={() => setShowRegistration(false)}
        />
      )}
    </div>
  );
}
