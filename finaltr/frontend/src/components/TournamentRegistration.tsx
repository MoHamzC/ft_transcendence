import { useState, useEffect } from 'react';
import TournamentService, {
  type Tournament,
  type RegistrationStatus,
  type AuthSupportInfo,
  type AuthData,
  type RegistrationSlot
} from '../services/tournamentService';
import './TournamentRegistration.css';

interface TournamentRegistrationProps {
  tournament: Tournament;
  onRegistrationChange: () => void;
  onClose: () => void;
}

export default function TournamentRegistration({
  tournament,
  onRegistrationChange,
  onClose
}: TournamentRegistrationProps) {
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null);
  const [authModes, setAuthModes] = useState<AuthSupportInfo | null>(null);
  const [detectedAuth, setDetectedAuth] = useState<AuthData | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [selectedMode, setSelectedMode] = useState<string>('auto');
  const [alias, setAlias] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [provider, setProvider] = useState('google');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, [tournament.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les données en parallèle
      const [statusResult, modesResult, authResult] = await Promise.all([
        TournamentService.getRegistrationStatus(tournament.id),
        TournamentService.getAuthModes(),
        TournamentService.testAuthDetection()
      ]);

      setRegistrationStatus(statusResult);
      setAuthModes(modesResult);
      setDetectedAuth(authResult.authData);

      // Auto-sélectionner le premier slot libre
      const freeSlot = statusResult.slots.find(slot => !slot.occupied);
      if (freeSlot) {
        setSelectedSlot(freeSlot.slot);
      }

      setError('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedSlot) {
      setError('Veuillez sélectionner un slot');
      return;
    }

    if (selectedMode === 'anonymous' && !alias.trim()) {
      setError('Veuillez saisir un alias');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      let result;

      switch (selectedMode) {
        case 'oauth':
          if (!accessToken.trim()) {
            setError('Token d\'accès requis pour OAuth');
            return;
          }
          result = await TournamentService.registerWithOAuth(
            tournament.id,
            selectedSlot,
            accessToken,
            provider
          );
          break;

        case 'jwt':
          result = await TournamentService.registerWithJWT(
            tournament.id,
            selectedSlot,
            accessToken.trim() || undefined
          );
          break;

        case 'session':
          result = await TournamentService.registerWithSession(
            tournament.id,
            selectedSlot,
            alias.trim() || undefined
          );
          break;

        case 'anonymous':
          result = await TournamentService.registerAnonymous(
            tournament.id,
            selectedSlot,
            alias
          );
          break;

        case 'auto':
        default:
          result = await TournamentService.registerToTournament(tournament.id, {
            playerSlot: selectedSlot,
            authMode: 'auto',
            alias: alias.trim() || undefined
          });
          break;
      }

      setSuccess(result.message);
      setTimeout(() => {
        onRegistrationChange();
        onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleUnregister = async (slot: number) => {
    if (!confirm('Êtes-vous sûr de vouloir désinscrire ce joueur ?')) {
      return;
    }

    try {
      setLoading(true);
      await TournamentService.unregisterPlayer(tournament.id, slot);
      setSuccess('Joueur désinscrit avec succès');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la désinscription');
    } finally {
      setLoading(false);
    }
  };

  const getSlotStatusIcon = (slot: RegistrationSlot) => {
    if (!slot.occupied) return '🔓';
    return slot.is_authenticated ? '🔐' : '👤';
  };

  const getSlotStatusText = (slot: RegistrationSlot) => {
    if (!slot.occupied) return 'Libre';
    return slot.is_authenticated ? 'Authentifié' : 'Anonyme';
  };

  if (loading && !registrationStatus) {
    return (
      <div className="tournament-registration-modal">
        <div className="modal-content">
          <div className="loading">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tournament-registration-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Inscription au tournoi</h2>
          <h3>{tournament.name}</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        {/* Détection d'authentification automatique */}
        {detectedAuth && (
          <div className="auth-detection">
            <h4>🔍 Authentification détectée</h4>
            <div className="auth-info">
              <p><strong>Utilisateur:</strong> {detectedAuth.userAlias || detectedAuth.username}</p>
              <p><strong>Provider:</strong> {detectedAuth.provider}</p>
              <p><strong>Source:</strong> {detectedAuth.source}</p>
            </div>
          </div>
        )}

        {/* État des slots */}
        {registrationStatus && (
          <div className="slots-section">
            <h4>État des inscriptions ({registrationStatus.occupiedSlots}/{registrationStatus.maxPlayers})</h4>
            <div className="slots-grid">
              {registrationStatus.slots.map((slot) => (
                <div
                  key={slot.slot}
                  className={`slot-card ${slot.occupied ? 'occupied' : 'free'} ${selectedSlot === slot.slot ? 'selected' : ''}`}
                  onClick={() => !slot.occupied && setSelectedSlot(slot.slot)}
                >
                  <div className="slot-header">
                    <span className="slot-number">Slot {slot.slot}</span>
                    <span className="slot-icon">{getSlotStatusIcon(slot)}</span>
                  </div>
                  <div className="slot-content">
                    {slot.occupied ? (
                      <>
                        <div className="slot-alias">{slot.alias}</div>
                        <div className="slot-status">{getSlotStatusText(slot)}</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnregister(slot.slot);
                          }}
                          className="unregister-btn"
                          disabled={loading}
                        >
                          Désinscrire
                        </button>
                      </>
                    ) : (
                      <div className="slot-free">Cliquez pour sélectionner</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulaire d'inscription */}
        {selectedSlot && registrationStatus && !registrationStatus.slots.find(s => s.slot === selectedSlot)?.occupied && (
          <div className="registration-form">
            <h4>Inscription au slot {selectedSlot}</h4>

            {/* Sélection du mode d'authentification */}
            <div className="form-group">
              <label>Mode d'authentification:</label>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="form-select"
              >
                <option value="auto">🤖 Auto-détection</option>
                <option value="anonymous">👤 Anonyme</option>
                <option value="session">🏠 Session utilisateur</option>
                <option value="jwt">🔑 JWT Token</option>
                <option value="oauth">🔐 OAuth</option>
              </select>
            </div>

            {/* Champs conditionnels selon le mode */}
            {(selectedMode === 'anonymous' || selectedMode === 'auto' || selectedMode === 'session') && (
              <div className="form-group">
                <label>Alias:</label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="Votre pseudo dans le tournoi"
                  className="form-input"
                  required={selectedMode === 'anonymous'}
                />
              </div>
            )}

            {(selectedMode === 'oauth' || selectedMode === 'jwt') && (
              <div className="form-group">
                <label>Token d'accès:</label>
                <input
                  type="text"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Votre token d'authentification"
                  className="form-input"
                />
              </div>
            )}

            {selectedMode === 'oauth' && (
              <div className="form-group">
                <label>Provider OAuth:</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="form-select"
                >
                  <option value="google">Google</option>
                  <option value="github">GitHub</option>
                  <option value="42">42</option>
                  <option value="discord">Discord</option>
                </select>
              </div>
            )}

            <div className="form-actions">
              <button
                onClick={handleRegister}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Inscription...' : 'S\'inscrire'}
              </button>
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Informations sur les modes d'authentification */}
        {authModes && (
          <div className="auth-modes-info">
            <details>
              <summary>ℹ️ Modes d'authentification supportés</summary>
              <div className="modes-list">
                {authModes.supported.map((mode) => (
                  <div key={mode.mode} className="mode-info">
                    <strong>{mode.mode}:</strong> {mode.description}
                    <div className="mode-details">
                      Requis: {mode.requires.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
