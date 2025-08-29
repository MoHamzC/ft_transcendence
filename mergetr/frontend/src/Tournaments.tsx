import React, { useState, useEffect } from 'react';
import TournamentService, { type Tournament } from './services/tournamentService';
import CreateTournamentModal from './components/CreateTournamentModal';
import JoinTournamentModal from './components/JoinTournamentModal';
import TournamentBracket from './components/TournamentBracket';
import './Tournaments.css';

export default function Tournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showBracket, setShowBracket] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const status = filterStatus === 'all' ? undefined : filterStatus;
      const response = await TournamentService.getTournaments(status);
      setTournaments(response.tournaments);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des tournois');
      console.error('Error loading tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, [filterStatus]);

  const handleJoinTournament = (tournament: Tournament) => {
    if (tournament.status !== 'registration') {
      setError('Ce tournoi n\'accepte plus d\'inscriptions');
      return;
    }
    setSelectedTournament(tournament);
    setShowJoinModal(true);
  };

  const handleViewBracket = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setShowBracket(true);
  };

  const handleStartTournament = async (tournament: Tournament) => {
    try {
      await TournamentService.startTournament(tournament.id);
      await loadTournaments(); // Recharger pour voir le changement de statut
      setError('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors du démarrage du tournoi');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration': return 'status-registration';
      case 'in_progress': return 'status-in-progress';
      case 'finished': return 'status-finished';
      case 'cancelled': return 'status-cancelled';
      default: return '';
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

  const getModeText = (mode: string) => {
    switch (mode) {
      case '4_players': return '4 joueurs';
      case '8_players': return '8 joueurs';
      default: return mode;
    }
  };

  if (showBracket && selectedTournament) {
    return (
      <TournamentBracket
        tournament={selectedTournament}
        onBack={() => {
          setShowBracket(false);
          setSelectedTournament(null);
          loadTournaments();
        }}
      />
    );
  }

  return (
    <div className="tournaments-container">
      {/* Header */}
      <div className="tournaments-header">
        <div className="tournaments-header-content">
          <h1 className="tournaments-title">TOURNOIS</h1>
          <div className="tournaments-actions">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              + Créer un tournoi
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="tournaments-filters">
        <div className="filter-buttons">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'registration', label: 'Inscriptions ouvertes' },
            { key: 'in_progress', label: 'En cours' },
            { key: 'finished', label: 'Terminés' }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setFilterStatus(filter.key)}
              className={`filter-btn ${filterStatus === filter.key ? 'active' : ''}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="tournaments-content">
        {/* Error message */}
        {error && (
          <div className="error-message">
            {error}
            <button
              onClick={() => setError('')}
              className="error-close"
            >
              ×
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="loading-message">
            Chargement des tournois...
          </div>
        )}

        {/* Tournaments List */}
        {!loading && (
          <div>
            {tournaments.length === 0 ? (
              <div className="empty-state">
                Aucun tournoi trouvé.
                <br />
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                  style={{ marginTop: '1rem' }}
                >
                  Créer le premier tournoi
                </button>
              </div>
            ) : (
              <div className="tournaments-grid">
                {tournaments.map((tournament) => (
                  <div key={tournament.id} className="tournament-card">
                    <div className="tournament-card-header">
                      <h3 className="tournament-name">{tournament.name}</h3>
                      <span className={`tournament-status ${getStatusColor(tournament.status)}`}>
                        {getStatusText(tournament.status)}
                      </span>
                    </div>

                    {tournament.description && (
                      <p className="tournament-description">{tournament.description}</p>
                    )}

                    <div className="tournament-info">
                      <div className="tournament-mode">
                        <strong>Mode:</strong> {getModeText(tournament.mode)}
                      </div>
                      <div className="tournament-participants">
                        <strong>Participants:</strong> {tournament.participant_count}/{tournament.max_players}
                      </div>
                      {tournament.winner_alias && (
                        <div className="tournament-winner">
                          <strong>Gagnant:</strong> {tournament.winner_alias}
                        </div>
                      )}
                    </div>

                    <div className="tournament-actions">
                      {tournament.status === 'registration' && (
                        <>
                          <button
                            onClick={() => handleJoinTournament(tournament)}
                            className="btn-secondary"
                          >
                            Rejoindre
                          </button>
                          {tournament.participant_count >= 2 && (
                            <button
                              onClick={() => handleStartTournament(tournament)}
                              className="btn-primary"
                            >
                              Démarrer
                            </button>
                          )}
                        </>
                      )}
                      
                      {(tournament.status === 'in_progress' || tournament.status === 'finished') && (
                        <button
                          onClick={() => handleViewBracket(tournament)}
                          className="btn-primary"
                        >
                          Voir l'arborescence
                        </button>
                      )}
                    </div>

                    <div className="tournament-date">
                      Créé le {new Date(tournament.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Tournament Modal */}
      <CreateTournamentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTournamentCreated={loadTournaments}
      />

      {/* Join Tournament Modal */}
      {selectedTournament && (
        <JoinTournamentModal
          isOpen={showJoinModal}
          tournament={selectedTournament}
          onClose={() => {
            setShowJoinModal(false);
            setSelectedTournament(null);
          }}
          onJoined={loadTournaments}
        />
      )}
    </div>
  );
}
