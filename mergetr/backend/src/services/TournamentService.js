// src/services/TournamentService.js

/* TournamentService.js — Service pour gérer les tournois
    - Création et gestion des tournois
    - Inscription des joueurs
    - Génération des matchs
    - Gestion de la progression du tournoi
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

    // Inscrire un joueur au tournoi
    static async registerPlayer(tournamentId, userId, alias) {
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

            // Vérifier le nombre de participants
            const countQuery = 'SELECT COUNT(*) as count FROM tournament_participants WHERE tournament_id = $1';
            const { rows: countRows } = await client.query(countQuery, [tournamentId]);
            const currentCount = parseInt(countRows[0].count);

            if (currentCount >= tournament.max_players) {
                throw new Error('Le tournoi est complet');
            }

            // Inscrire le joueur
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

    // Enregistrer le résultat d'un match
    static async recordMatchResult(matchId, winnerId, player1Score, player2Score) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

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

            if (!rows.length) {
                throw new Error('Match introuvable');
            }

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

    // Vérifier et générer le tour suivant
    static async _checkAndGenerateNextRound(client, tournamentId, currentRound) {
        // Vérifier si tous les matchs du tour sont terminés
        const pendingMatchesQuery = `
            SELECT COUNT(*) as count FROM tournament_matches 
            WHERE tournament_id = $1 AND round_number = $2 AND status != 'finished'
        `;
        const { rows: pendingRows } = await client.query(pendingMatchesQuery, [tournamentId, currentRound]);
        
        if (parseInt(pendingRows[0].count) > 0) {
            return; // Il reste des matchs en cours
        }

        // Récupérer les gagnants du tour actuel
        const winnersQuery = `
            SELECT winner_id FROM tournament_matches 
            WHERE tournament_id = $1 AND round_number = $2 AND winner_id IS NOT NULL
        `;
        const { rows: winners } = await client.query(winnersQuery, [tournamentId, currentRound]);

        if (winners.length <= 1) {
            // Tournoi terminé
            await this._finishTournament(client, tournamentId, winners[0]?.winner_id);
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

    // Terminer le tournoi
    static async _finishTournament(client, tournamentId, winnerId) {
        await client.query(
            'UPDATE tournaments SET status = $1, finished_at = CURRENT_TIMESTAMP, winner_id = $2 WHERE id = $3',
            ['finished', winnerId, tournamentId]
        );
    }

    // Récupérer les détails d'un tournoi
    static async getTournamentDetails(tournamentId) {
        const tournamentQuery = 'SELECT * FROM tournaments WHERE id = $1';
        const { rows: tournamentRows } = await pool.query(tournamentQuery, [tournamentId]);
        
        if (!tournamentRows.length) {
            throw new Error('Tournoi introuvable');
        }

        const tournament = tournamentRows[0];

        // Récupérer les participants
        const participantsQuery = `
            SELECT tp.*, u.username, u.email 
            FROM tournament_participants tp
            LEFT JOIN users u ON tp.user_id = u.id
            WHERE tp.tournament_id = $1
            ORDER BY tp.registration_order
        `;
        const { rows: participants } = await pool.query(participantsQuery, [tournamentId]);

        // Récupérer les matchs
        const matchesQuery = `
            SELECT tm.*, 
                   p1.alias as player1_alias, p2.alias as player2_alias, 
                   winner.alias as winner_alias
            FROM tournament_matches tm
            LEFT JOIN tournament_participants p1 ON tm.player1_id = p1.id
            LEFT JOIN tournament_participants p2 ON tm.player2_id = p2.id
            LEFT JOIN tournament_participants winner ON tm.winner_id = winner.id
            WHERE tm.tournament_id = $1
            ORDER BY tm.round_number, tm.match_number
        `;
        const { rows: matches } = await pool.query(matchesQuery, [tournamentId]);

        return {
            tournament,
            participants,
            matches
        };
    }

    // Récupérer le prochain match à jouer
    static async getNextMatch(tournamentId) {
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
        const { rows } = await pool.query(query, [tournamentId]);
        return rows[0] || null;
    }

    // Lister tous les tournois
    static async listTournaments(status = null) {
        let query = 'SELECT * FROM tournaments';
        const params = [];
        
        if (status) {
            query += ' WHERE status = $1';
            params.push(status);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const { rows } = await pool.query(query, params);
        return rows;
    }
}
