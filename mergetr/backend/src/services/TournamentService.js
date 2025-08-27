// src/services/TournamentService.js

/* TournamentService.js — Service pour gérer les tournois LOCAL
    - Création et gestion des tournois
    - Inscription des joueurs
    - Génération des matchs
    - Gestion de la progression du tournoi
    - VERSION SIMPLIFIÉE POUR TOURNOI LOCAL (SANS WEBSOCKET/NOTIFICATIONS)
*/

import pool from '../config/db.js';

export class TournamentService {
    
    // Créer un nouveau tournoi
    static async createTournament(name, description, maxPlayers = 8, type = 'elimination', createdBy = null) {
        const query = `
            INSERT INTO tournaments (name, description, max_players, type, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const { rows } = await pool.query(query, [name, description, maxPlayers, type, createdBy]);
        return rows[0];
    }

    // Inscrire un joueur au tournoi (avec ou sans compte utilisateur)
    static async registerPlayer(tournamentId, userId = null, alias) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Vérifier que le tournoi accepte encore les inscriptions
            const tournamentQuery = 'SELECT status, max_players FROM tournaments WHERE id = $1';
            const { rows: tournamentRows } = await client.query(tournamentQuery, [tournamentId]);
            
            if (!tournamentRows.length) {
                throw new Error('Tournoi introuvable');
            }
            
            const tournament = tournamentRows[0];
            if (tournament.status !== 'registration') {
                throw new Error('Les inscriptions sont fermées pour ce tournoi');
            }

            // Vérifier l'unicité de l'alias dans ce tournoi
            const aliasCheckQuery = 'SELECT id FROM tournament_participants WHERE tournament_id = $1 AND alias = $2';
            const { rows: aliasRows } = await client.query(aliasCheckQuery, [tournamentId, alias]);
            
            if (aliasRows.length > 0) {
                throw new Error('Cet alias est déjà utilisé dans ce tournoi');
            }

            // Vérifier le nombre de participants
            const countQuery = 'SELECT COUNT(*) as count FROM tournament_participants WHERE tournament_id = $1';
            const { rows: countRows } = await client.query(countQuery, [tournamentId]);
            const currentCount = parseInt(countRows[0].count);

            if (currentCount >= tournament.max_players) {
                throw new Error('Le tournoi est complet');
            }

            // Inscrire le joueur (userId peut être null pour les joueurs sans compte)
            const registerQuery = `
                INSERT INTO tournament_participants (tournament_id, user_id, alias, registration_order)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const { rows } = await client.query(registerQuery, [
                tournamentId, userId, alias, currentCount + 1
            ]);

            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Démarrer un tournoi et générer les matchs
    static async startTournament(tournamentId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Récupérer les participants
            const participantsQuery = `
                SELECT * FROM tournament_participants 
                WHERE tournament_id = $1 
                ORDER BY registration_order
            `;
            const { rows: participants } = await client.query(participantsQuery, [tournamentId]);

            if (participants.length < 2) {
                throw new Error('Au moins 2 joueurs sont nécessaires pour démarrer un tournoi');
            }

            // Mettre à jour le statut du tournoi
            await client.query(
                'UPDATE tournaments SET status = $1, started_at = CURRENT_TIMESTAMP WHERE id = $2',
                ['in_progress', tournamentId]
            );

            // Générer les matchs du premier tour
            await this._generateFirstRoundMatches(client, tournamentId, participants);

            await client.query('COMMIT');
            return { success: true, message: 'Tournoi démarré avec succès' };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Générer les matchs du premier tour
    static async _generateFirstRoundMatches(client, tournamentId, participants) {
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < shuffled.length; i += 2) {
            if (i + 1 < shuffled.length) {
                const matchQuery = `
                    INSERT INTO tournament_matches 
                    (tournament_id, round_number, match_number, player1_id, player2_id)
                    VALUES ($1, $2, $3, $4, $5)
                `;
                
                await client.query(matchQuery, [
                    tournamentId,
                    1,
                    Math.floor(i / 2) + 1,
                    shuffled[i].id,
                    shuffled[i + 1].id
                ]);
            }
        }
    }

    // Enregistrer le résultat d'un match (simple, sans validation des règles de jeu)
    static async recordMatchResult(matchId, winnerId, player1Score, player2Score) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Récupérer les informations du match
            const matchQuery = `
                SELECT tm.*, tm.tournament_id, tm.round_number,
                       p1.alias as player1_alias, p2.alias as player2_alias
                FROM tournament_matches tm
                LEFT JOIN tournament_participants p1 ON tm.player1_id = p1.id
                LEFT JOIN tournament_participants p2 ON tm.player2_id = p2.id
                WHERE tm.id = $1
            `;
            const { rows: matchRows } = await client.query(matchQuery, [matchId]);
            
            if (!matchRows.length) {
                throw new Error('Match introuvable');
            }
            
            const match = matchRows[0];

            // Validation basique des scores
            if (player1Score < 0 || player2Score < 0) {
                throw new Error('Les scores ne peuvent pas être négatifs');
            }

            if (player1Score === player2Score) {
                throw new Error('Match nul non autorisé dans un tournoi à élimination');
            }

            // Déterminer le gagnant
            const expectedWinner = this._determineWinner(match.player1_id, match.player2_id, player1Score, player2Score);
            if (expectedWinner !== winnerId) {
                throw new Error('Le gagnant déclaré ne correspond pas aux scores');
            }

            // Mettre à jour le match
            const updateMatchQuery = `
                UPDATE tournament_matches 
                SET winner_id = $1, player1_score = $2, player2_score = $3, 
                    status = 'finished', finished_at = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING tournament_id, round_number
            `;
            const { rows } = await client.query(updateMatchQuery, [
                winnerId, player1Score, player2Score, matchId
            ]);

            const { tournament_id, round_number } = rows[0];

            // Vérifier si le tour est terminé et générer le suivant
            await this._checkAndGenerateNextRound(client, tournament_id, round_number);

            await client.query('COMMIT');
            return { success: true };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Déterminer le gagnant en fonction des scores
    static _determineWinner(player1Id, player2Id, player1Score, player2Score) {
        if (player1Score > player2Score) {
            return player1Id;
        } else if (player2Score > player1Score) {
            return player2Id;
        } else {
            return null; // Match nul (ne devrait pas arriver)
        }
    }

    // Vérifier et générer le tour suivant
    static async _checkAndGenerateNextRound(client, tournamentId, currentRound) {
        // Vérifier si tous les matchs du tour sont terminés
        const pendingMatchesQuery = `
            SELECT COUNT(*) as count FROM tournament_matches 
            WHERE tournament_id = $1 AND round_number = $2 AND status != 'finished'
        `;
        const { rows: pendingRows } = await client.query(pendingMatchesQuery, [tournamentId, currentRound]);
        
        if (parseInt(pendingRows[0].count) > 0) {
            return; // Il reste des matchs à jouer
        }

        // Récupérer les gagnants du tour actuel
        const winnersQuery = `
            SELECT winner_id FROM tournament_matches 
            WHERE tournament_id = $1 AND round_number = $2 AND winner_id IS NOT NULL
        `;
        const { rows: winners } = await client.query(winnersQuery, [tournamentId, currentRound]);

        if (winners.length <= 1) {
            // Fin du tournoi
            const winnerId = winners.length === 1 ? winners[0].winner_id : null;
            await this._finishTournament(client, tournamentId, winnerId);
            return;
        }

        // Générer le tour suivant
        for (let i = 0; i < winners.length; i += 2) {
            if (i + 1 < winners.length) {
                const matchQuery = `
                    INSERT INTO tournament_matches 
                    (tournament_id, round_number, match_number, player1_id, player2_id)
                    VALUES ($1, $2, $3, $4, $5)
                `;
                
                await client.query(matchQuery, [
                    tournamentId,
                    currentRound + 1,
                    Math.floor(i / 2) + 1,
                    winners[i].winner_id,
                    winners[i + 1].winner_id
                ]);
            }
        }
    }

    // Récupérer le prochain match à jouer (méthode interne)
    static async _getNextMatch(client, tournamentId) {
        const query = `
            SELECT tm.*, 
                   p1.alias as player1_alias, p2.alias as player2_alias
            FROM tournament_matches tm
            LEFT JOIN tournament_participants p1 ON tm.player1_id = p1.id
            LEFT JOIN tournament_participants p2 ON tm.player2_id = p2.id
            WHERE tm.tournament_id = $1 AND tm.status = 'pending'
            ORDER BY tm.round_number, tm.match_number
            LIMIT 1
        `;
        const { rows } = await client.query(query, [tournamentId]);
        return rows[0] || null;
    }

    // Terminer le tournoi
    static async _finishTournament(client, tournamentId, winnerId) {
        await client.query(
            'UPDATE tournaments SET status = $1, finished_at = CURRENT_TIMESTAMP, winner_id = $2 WHERE id = $3',
            ['finished', winnerId, tournamentId]
        );
    }

    // Récupérer les détails d'un tournoi
    static async getTournamentDetails(tournamentId) {
        const query = `
            SELECT t.*, 
                   COUNT(tp.id) as participant_count,
                   w.alias as winner_alias
            FROM tournaments t
            LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
            LEFT JOIN tournament_participants w ON t.winner_id = w.id
            WHERE t.id = $1
            GROUP BY t.id, w.alias
        `;
        const { rows } = await pool.query(query, [tournamentId]);
        
        if (!rows.length) {
            throw new Error('Tournoi introuvable');
        }

        const tournament = rows[0];

        // Récupérer les participants
        const participantsQuery = `
            SELECT id, alias, registration_order, is_eliminated, user_id
            FROM tournament_participants 
            WHERE tournament_id = $1 
            ORDER BY registration_order
        `;
        const { rows: participants } = await pool.query(participantsQuery, [tournamentId]);

        // Récupérer les matchs
        const matchesQuery = `
            SELECT tm.*, 
                   p1.alias as player1_alias, p2.alias as player2_alias,
                   w.alias as winner_alias
            FROM tournament_matches tm
            LEFT JOIN tournament_participants p1 ON tm.player1_id = p1.id
            LEFT JOIN tournament_participants p2 ON tm.player2_id = p2.id
            LEFT JOIN tournament_participants w ON tm.winner_id = w.id
            WHERE tm.tournament_id = $1
            ORDER BY tm.round_number, tm.match_number
        `;
        const { rows: matches } = await pool.query(matchesQuery, [tournamentId]);

        return {
            ...tournament,
            participants,
            matches
        };
    }

    // Récupérer le prochain match à jouer (méthode publique)
    static async getNextMatch(tournamentId) {
        const client = await pool.connect();
        try {
            return await this._getNextMatch(client, tournamentId);
        } finally {
            client.release();
        }
    }

    // Lister tous les tournois
    static async listTournaments(status = null) {
        let query = `
            SELECT t.*, COUNT(tp.id) as participant_count
            FROM tournaments t
            LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
        `;
        const params = [];

        if (status) {
            query += ' WHERE t.status = $1';
            params.push(status);
        }

        query += ' GROUP BY t.id ORDER BY t.created_at DESC';

        const { rows } = await pool.query(query, params);
        return rows;
    }

    // Vérifier si un joueur peut rejoindre un tournoi
    static async canJoinTournament(tournamentId, alias) {
        const tournamentQuery = 'SELECT status, max_players FROM tournaments WHERE id = $1';
        const { rows: tournamentRows } = await pool.query(tournamentQuery, [tournamentId]);
        
        if (!tournamentRows.length) {
            return { canJoin: false, reason: 'Tournoi introuvable' };
        }
        
        const tournament = tournamentRows[0];
        if (tournament.status !== 'registration') {
            return { canJoin: false, reason: 'Les inscriptions sont fermées' };
        }

        // Vérifier l'alias
        const aliasCheckQuery = 'SELECT id FROM tournament_participants WHERE tournament_id = $1 AND alias = $2';
        const { rows: aliasRows } = await pool.query(aliasCheckQuery, [tournamentId, alias]);
        
        if (aliasRows.length > 0) {
            return { canJoin: false, reason: 'Cet alias est déjà utilisé' };
        }

        // Vérifier le nombre de participants
        const countQuery = 'SELECT COUNT(*) as count FROM tournament_participants WHERE tournament_id = $1';
        const { rows: countRows } = await pool.query(countQuery, [tournamentId]);
        const currentCount = parseInt(countRows[0].count);

        if (currentCount >= tournament.max_players) {
            return { canJoin: false, reason: 'Le tournoi est complet' };
        }

        return { canJoin: true };
    }
}
