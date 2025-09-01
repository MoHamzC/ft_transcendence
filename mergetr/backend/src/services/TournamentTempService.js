import db from '../config/db.js';

class TournamentTempService {
    constructor() {
        this.tempUsers = new Map(); // Stockage temporaire des utilisateurs
    }

    // Créer un tournoi avec utilisateurs temporaires
    async createTournament({ name, mode, createdBy }) {
	try {
        const maxPlayers = mode === '4_players' ? 4 : 8;

        // Vérifier que l'utilisateur créateur existe réellement sinon mettre NULL pour éviter FK error
        let finalCreatedBy = null;
        let creatorUsername = null;
        if (createdBy) {
            try {
                const checkUser = await db.query('SELECT id, username FROM users WHERE id = $1', [createdBy]);
                if (checkUser.rows.length) {
                    finalCreatedBy = createdBy;
                    creatorUsername = checkUser.rows[0].username;
                } else {
                    console.warn('createTournament: provided createdBy does not exist, using NULL');
                }
            } catch (e) {
                console.warn('createTournament: error checking creator, using NULL', e.message);
            }
        }

        const result = await db.query(
            `INSERT INTO tournaments (name, mode, max_players, created_by, status)
             VALUES ($1, $2, $3, $4, 'registration')
             RETURNING *`,
            [name, mode, maxPlayers, finalCreatedBy]
        );

        // Auto-enregistrer le créateur uniquement si confirmé en DB
        if (finalCreatedBy && creatorUsername) {
            try {
                await this.registerParticipant(result.rows[0].id, {
                    alias: creatorUsername,
                    userId: finalCreatedBy,
                    isTemporary: false
                });
            } catch (e) {
                console.error('Could not auto register creator:', e);
            }
        }

            return {
                success: true,
                tournament: result.rows[0]
            };
        } catch (error) {
            console.error('Error creating tournament:', error);
            return {
                success: false,
                error: 'Failed to create tournament',
                detail: error?.message || null
            };
        }
    }

    // Créer un utilisateur temporaire pour le tournoi
    createTempUser(tournamentId, alias) {
        const tempUserId = `temp_${tournamentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const tempUser = {
            id: tempUserId,
            alias: alias,
            tournamentId: tournamentId,
            isTemporary: true,
            createdAt: new Date()
        };

        this.tempUsers.set(tempUserId, tempUser);
        return tempUser;
    }

    // Inscrire un participant (temporaire ou authentifié)
    async registerParticipant(tournamentId, participantData) {
        const { alias, userId = null, isTemporary = false } = participantData;

        try {
            // Vérifier si le tournoi existe et accepte encore des inscriptions
            const tournamentCheck = await db.query(
                `SELECT id, max_players, status,
                 (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = $1) as current_players
                 FROM tournaments WHERE id = $1`,
                [tournamentId]
            );

            if (tournamentCheck.rows.length === 0) {
                return { success: false, error: 'Tournament not found' };
            }

            const tournament = tournamentCheck.rows[0];

            if (tournament.status !== 'registration') {
                return { success: false, error: 'Tournament registration is closed' };
            }

            if (tournament.current_players >= tournament.max_players) {
                return { success: false, error: 'Tournament is full' };
            }

            // Vérifier si l'alias est déjà pris
            const aliasCheck = await db.query(
                `SELECT id FROM tournament_participants
                 WHERE tournament_id = $1 AND alias = $2`,
                [tournamentId, alias]
            );

            if (aliasCheck.rows.length > 0) {
                return { success: false, error: 'Alias already taken' };
            }

            // Trouver le prochain slot disponible
            const slotsResult = await db.query(
                `SELECT player_slot FROM tournament_participants
                 WHERE tournament_id = $1 ORDER BY player_slot`,
                [tournamentId]
            );

            const usedSlots = slotsResult.rows.map(row => row.player_slot);
            let nextSlot = 1;
            while (usedSlots.includes(nextSlot)) {
                nextSlot++;
            }

            // Insérer le participant
            const registrationOrder = tournament.current_players + 1;

            let finalUserId = userId;
            let guestCreated = null;
            if (isTemporary) {
                // Créer un utilisateur invité en base (username + email alias@pong.local)
                guestCreated = await this.ensureGuestUser(alias);
                finalUserId = guestCreated?.id || null;
            }

            const result = await db.query(
                `INSERT INTO tournament_participants
                 (tournament_id, user_id, alias, player_slot, registration_order, is_authenticated)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [tournamentId, finalUserId, alias, nextSlot, registrationOrder, !isTemporary]
            );

            return {
                success: true,
                participant: result.rows[0],
                slot: nextSlot,
                guest: guestCreated
            };

        } catch (error) {
            console.error('Error registering participant:', error);
            return {
                success: false,
                error: 'Failed to register participant'
            };
        }
    }

    // Obtenir les détails d'un tournoi avec ses participants
    async getTournamentDetails(tournamentId) {
        try {
            const tournamentResult = await db.query(
                `SELECT * FROM tournaments WHERE id = $1`,
                [tournamentId]
            );

            if (tournamentResult.rows.length === 0) {
                return { success: false, error: 'Tournament not found' };
            }

            const participantsResult = await db.query(
                `SELECT tp.*, u.username as user_username, u.email as user_email
                 FROM tournament_participants tp
                 LEFT JOIN users u ON tp.user_id = u.id
                 WHERE tp.tournament_id = $1
                 ORDER BY tp.player_slot`,
                [tournamentId]
            );

            // Enrichir avec les données des utilisateurs temporaires
            const participants = participantsResult.rows.map(participant => {
                if (!participant.is_authenticated) {
                    // Chercher dans les utilisateurs temporaires
                    const tempUser = Array.from(this.tempUsers.values()).find(
                        temp => temp.tournamentId === tournamentId && temp.alias === participant.alias
                    );
                    if (tempUser) {
                        participant.temp_user_id = tempUser.id;
                        participant.is_temporary = true;
                    }
                }
                return participant;
            });

            return {
                success: true,
                tournament: tournamentResult.rows[0],
                participants: participants
            };

        } catch (error) {
            console.error('Error getting tournament details:', error);
            return {
                success: false,
                error: 'Failed to get tournament details'
            };
        }
    }

    // Lister tous les tournois actifs
    async getActiveTournaments() {
        try {
            const result = await db.query(
                `SELECT t.*,
                 COUNT(tp.id) as current_players,
                 u.username as creator_username
                 FROM tournaments t
                 LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
                 LEFT JOIN users u ON t.created_by = u.id
                 WHERE t.status IN ('registration', 'in_progress')
                 GROUP BY t.id, u.username
                 ORDER BY t.created_at DESC`
            );

            return {
                success: true,
                tournaments: result.rows
            };

        } catch (error) {
            console.error('Error getting active tournaments:', error);
            return {
                success: false,
                error: 'Failed to get tournaments'
            };
        }
    }

    // Démarrer un tournoi (générer les matchs)
    async startTournament(tournamentId) {
        try {
            // Vérifier que le tournoi est prêt à démarrer
            const check = await db.query(
                `SELECT t.*, COUNT(tp.id) as current_players
                 FROM tournaments t
                 LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
                 WHERE t.id = $1 AND t.status = 'registration'
                 GROUP BY t.id`,
                [tournamentId]
            );

            if (check.rows.length === 0) {
                return { success: false, error: 'Tournament not found or not in registration' };
            }

            const tournament = check.rows[0];
            if (tournament.current_players < tournament.max_players) {
                return { success: false, error: 'Tournament is not full yet' };
            }

            // Mettre à jour le statut du tournoi
            await db.query(
                `UPDATE tournaments
                 SET status = 'in_progress', started_at = CURRENT_TIMESTAMP
                 WHERE id = $1`,
                [tournamentId]
            );

            // Générer les matchs du premier tour
            await this.generateFirstRoundMatches(tournamentId);

            return {
                success: true,
                message: 'Tournament started successfully'
            };

        } catch (error) {
            console.error('Error starting tournament:', error);
            return {
                success: false,
                error: 'Failed to start tournament'
            };
        }
    }

    // Générer les matchs du premier tour
    async generateFirstRoundMatches(tournamentId) {
        try {
            const participants = await db.query(
                `SELECT * FROM tournament_participants
                 WHERE tournament_id = $1
                 ORDER BY player_slot`,
                [tournamentId]
            );

            const players = participants.rows;
            const matchNumber = 1;

            // Générer les paires pour le premier tour
            for (let i = 0; i < players.length; i += 2) {
                const player1 = players[i];
                const player2 = players[i + 1];

                await db.query(
                    `INSERT INTO tournament_matches
                     (tournament_id, round_number, match_number, player1_id, player2_id, status)
                     VALUES ($1, 1, $2, $3, $4, 'pending')`,
                    [tournamentId, Math.floor(i/2) + 1, player1.id, player2.id]
                );
            }

            return true;
        } catch (error) {
            console.error('Error generating matches:', error);
            return false;
        }
    }

    // Obtenir les matchs d'un tournoi
    async getTournamentMatches(tournamentId) {
        try {
            const result = await db.query(
                `SELECT tm.*,
                 p1.alias as player1_alias, p1.is_authenticated as player1_auth,
                 p2.alias as player2_alias, p2.is_authenticated as player2_auth,
                 w.alias as winner_alias
                 FROM tournament_matches tm
                 LEFT JOIN tournament_participants p1 ON tm.player1_id = p1.id
                 LEFT JOIN tournament_participants p2 ON tm.player2_id = p2.id
                 LEFT JOIN tournament_participants w ON tm.winner_id = w.id
                 WHERE tm.tournament_id = $1
                 ORDER BY tm.round_number, tm.match_number`,
                [tournamentId]
            );

            return {
                success: true,
                matches: result.rows
            };

        } catch (error) {
            console.error('Error getting tournament matches:', error);
            return {
                success: false,
                error: 'Failed to get matches'
            };
        }
    }

    // Nettoyer les utilisateurs temporaires expirés (plus de 24h)
    cleanupExpiredTempUsers() {
        const now = new Date();
        const expiredUsers = [];

        for (const [id, user] of this.tempUsers) {
            const timeDiff = now - user.createdAt;
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            if (hoursDiff > 24) {
                expiredUsers.push(id);
            }
        }

        expiredUsers.forEach(id => this.tempUsers.delete(id));

        return expiredUsers.length;
    }

    // Obtenir un utilisateur temporaire
    getTempUser(tempUserId) {
        return this.tempUsers.get(tempUserId);
    }

    // Obtenir tous les utilisateurs temporaires d'un tournoi
    getTempUsersByTournament(tournamentId) {
        return Array.from(this.tempUsers.values()).filter(
            user => user.tournamentId === tournamentId
        );
    }

    // S'assure qu'un user "guest" existe, sinon le crée
    async ensureGuestUser(alias) {
        const baseEmail = `${alias.toLowerCase()}@pong.local`;
        let email = baseEmail;
        let counter = 1;
        while (true) {
            const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
            if (existing.rows.length === 0) break;
            email = `${alias.toLowerCase()}+${counter}@pong.local`;
            counter++;
        }
        // Créer l'utilisateur invité
        const insert = await db.query(
            `INSERT INTO users (email, username, name, is_registered)
             VALUES ($1, $2, $3, false) RETURNING id, username, email`,
            [email, alias, alias]
        );
        return insert.rows[0];
    }

    // Enregistrer le résultat d'un match de tournoi et générer le tour suivant si nécessaire
    async recordMatchResult({ tournamentId, matchId, playerWinner, playerLoser, playerWinnerScore, playerLoserScore }) {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Forcer types numériques pour éviter les problèmes de type (text vs integer)
            const winScore = parseInt(playerWinnerScore, 10) || 0;
            const loseScore = parseInt(playerLoserScore, 10) || 0;

            // Récupérer le match
            const matchRes = await client.query(
                `SELECT * FROM tournament_matches WHERE id = $1 AND tournament_id = $2 FOR UPDATE`,
                [matchId, tournamentId]
            );
            if (matchRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return { success: false, error: 'Match not found' };
            }
            const match = matchRes.rows[0];
            if (match.status === 'finished') {
                await client.query('ROLLBACK');
                return { success: false, error: 'Match already finished' };
            }

            // Validation de cohérence
            if (![match.player1_id, match.player2_id].includes(playerWinner) || ![match.player1_id, match.player2_id].includes(playerLoser)) {
                await client.query('ROLLBACK');
                return { success: false, error: 'Players do not belong to this match' };
            }
            if (playerWinner === playerLoser) {
                await client.query('ROLLBACK');
                return { success: false, error: 'Winner and loser must be different' };
            }

            // Mettre à jour le match
            await client.query(
                `UPDATE tournament_matches
                 SET winner_id = $1,
                     player1_score = CASE WHEN player1_id = $1 THEN $2::int ELSE $3::int END,
                     player2_score = CASE WHEN player2_id = $1 THEN $2::int ELSE $3::int END,
                     status = 'finished', finished_at = CURRENT_TIMESTAMP
                 WHERE id = $4`,
                [playerWinner, winScore, loseScore, matchId]
            );

            // Vérifier si tous les matchs de ce round sont terminés
            const roundMatchesRes = await client.query(
                `SELECT id, winner_id FROM tournament_matches
                 WHERE tournament_id = $1 AND round_number = $2`,
                [tournamentId, match.round_number]
            );
            const allFinishedRes = await client.query(
                `SELECT COUNT(*) AS remaining FROM tournament_matches
                 WHERE tournament_id = $1 AND round_number = $2 AND status != 'finished'`,
                [tournamentId, match.round_number]
            );

            const remaining = parseInt(allFinishedRes.rows[0].remaining, 10);

            // Si le round est terminé, générer le suivant ou clôturer le tournoi
            if (remaining === 0) {
                const winners = roundMatchesRes.rows.map(r => r.winner_id).filter(Boolean);
                console.log(`Round ${match.round_number} terminé pour tournoi ${tournamentId}. Gagnants:`, winners);
                if (winners.length === 1) {
                    // Tournoi terminé
                    console.log(`Tournoi ${tournamentId} terminé. Gagnant: ${winners[0]}`);
                    await client.query(
                        `UPDATE tournaments SET status = 'finished', winner_id = $1, finished_at = CURRENT_TIMESTAMP WHERE id = $2`,
                        [winners[0], tournamentId]
                    );
                } else if (winners.length > 1) {
                    // Générer le prochain round
                    const nextRound = match.round_number + 1;
                    console.log(`Génération du round ${nextRound} avec ${winners.length} joueurs:`, winners);
                    let matchesCreated = 0;
                    for (let i = 0; i < winners.length; i += 2) {
                        const p1 = winners[i];
                        const p2 = winners[i + 1];
                        if (p2) {
                            // Les deux joueurs sont disponibles - créer un match
                            console.log(`Création match ${matchesCreated + 1}: ${p1} vs ${p2}`);
                            await client.query(
                                `INSERT INTO tournament_matches (tournament_id, round_number, match_number, player1_id, player2_id, status)
                                 VALUES ($1, $2, $3, $4, $5, 'pending')`,
                                [tournamentId, nextRound, matchesCreated + 1, p1, p2]
                            );
                            matchesCreated++;
                        } else {
                            // Dernier joueur (nombre impair) - il gagne automatiquement
                            console.log(`Joueur ${p1} gagne automatiquement le tournoi (dernier joueur restant)`);
                            await client.query(
                                `UPDATE tournaments SET status = 'finished', winner_id = $1, finished_at = CURRENT_TIMESTAMP WHERE id = $2`,
                                [p1, tournamentId]
                            );
                        }
                    }
                    console.log(`Round ${nextRound} généré avec ${matchesCreated} matches`);
                } else {
                    console.log(`Aucun gagnant trouvé pour le round ${match.round_number}`);
                }
            }

            await client.query('COMMIT');
            return { success: true };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error recording match result:', error?.message, error?.stack);
            return { success: false, error: 'Failed to record match result' };
        } finally {
            client.release();
        }
    }
}

export default new TournamentTempService();
