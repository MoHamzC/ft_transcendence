// src/services/TournamentService.js

/* TournamentService.js — Service pour gérer les tournois LOCAL
    - Création et gestion des tournois
    - Inscription des joueurs
    - Génération des matchs
    - Gestion de la progression du tournoi
    - VERSION SIMPLIFIÉE POUR TOURNOI LOCAL
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
                
                // Le tournoi ne gère que la logique de tournoi, pas les règles du jeu (frontend responsable)
                // On stocke juste les matchs sans règles spécifiques
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

            // Notifier le résultat du match
            const winnerAlias = winnerId === match.player1_id ? match.player1_alias : match.player2_alias;
            await this._notifyParticipants(client, tournament_id, {
                type: 'match_finished',
                message: `Match terminé : ${winnerAlias} remporte le match !`,
                data: { 
                    match: {
                        player1: match.player1_alias,
                        player2: match.player2_alias,
                        winner: winnerAlias,
                        score: `${player1Score} - ${player2Score}`
                    }
                }
            });

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

    // Suppression des méthodes de validation de règles de jeu (frontend responsable)

    // Déterminer le gagnant en fonction des scores
    static _determineWinner(player1Id, player2Id, player1Score, player2Score) {
        if (player1Score > player2Score) {
            return player1Id;
        } else if (player2Score > player1Score) {
            return player2Id;
        } else {
            throw new Error('Match nul non autorisé dans un tournoi à élimination');
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
            // Il reste des matchs, annoncer le prochain
            await this._announceNextMatch(client, tournamentId);
            return;
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

        // Notifier la fin du tour
        await this._notifyParticipants(client, tournamentId, {
            type: 'round_finished',
            message: `Tour ${currentRound} terminé ! Génération du tour suivant...`,
            data: { finishedRound: currentRound, nextRound: currentRound + 1 }
        });

        // Générer le tour suivant (pas de règles spécifiques)
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

        // Annoncer le premier match du nouveau tour
        await this._announceNextMatch(client, tournamentId);
    }

    // Annoncer le prochain match
    static async _announceNextMatch(client, tournamentId) {
        const nextMatch = await this._getNextMatch(client, tournamentId);
        
        if (nextMatch) {
            await this._notifyParticipants(client, tournamentId, {
                type: 'next_match_announced',
                message: `Prochain match : ${nextMatch.player1_alias} vs ${nextMatch.player2_alias}`,
                data: { 
                    match: nextMatch,
                    call_to_action: 'Préparez-vous pour le match !'
                }
            });
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

    // Notifier tous les participants d'un tournoi
    static async _notifyParticipants(client, tournamentId, notification) {
        // Enregistrer la notification dans la base
        const notificationQuery = `
            INSERT INTO tournament_notifications (tournament_id, type, message, data, created_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        `;
        await client.query(notificationQuery, [
            tournamentId,
            notification.type,
            notification.message,
            JSON.stringify(notification.data)
        ]);

        // Envoyer via WebSocket en temps réel
        tournamentNotificationService.broadcast(tournamentId, notification);

        console.log(`[TOURNAMENT ${tournamentId}] ${notification.message}`, notification.data);
    }

    // Terminer le tournoi
    static async _finishTournament(client, tournamentId, winnerId) {
        await client.query(
            'UPDATE tournaments SET status = $1, finished_at = CURRENT_TIMESTAMP, winner_id = $2 WHERE id = $3',
            ['finished', winnerId, tournamentId]
        );

        // Récupérer les informations du gagnant
        let winnerMessage = 'Tournoi terminé !';
        if (winnerId) {
            const winnerQuery = 'SELECT alias FROM tournament_participants WHERE id = $1';
            const { rows: winnerRows } = await client.query(winnerQuery, [winnerId]);
            if (winnerRows.length) {
                winnerMessage = `🏆 Tournoi terminé ! Félicitations à ${winnerRows[0].alias} !`;
            }
        }

        await this._notifyParticipants(client, tournamentId, {
            type: 'tournament_finished',
            message: winnerMessage,
            data: { winnerId, tournamentFinished: true }
        });
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

        // Récupérer les notifications récentes
        const notificationsQuery = `
            SELECT * FROM tournament_notifications 
            WHERE tournament_id = $1 
            ORDER BY created_at DESC 
            LIMIT 10
        `;
        const { rows: notifications } = await pool.query(notificationsQuery, [tournamentId]);

        return {
            tournament,
            participants,
            matches,
            notifications
        };
    }

    // Récupérer le prochain match à jouer (méthode publique)
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
        let query = `
            SELECT t.*, 
                   COUNT(tp.id) as participant_count,
                   winner.alias as winner_alias
            FROM tournaments t
            LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
            LEFT JOIN tournament_participants winner ON t.winner_id = winner.id
        `;
        const params = [];
        
        if (status) {
            query += ' WHERE t.status = $1';
            params.push(status);
        }
        
        query += ' GROUP BY t.id, winner.alias ORDER BY t.created_at DESC';
        
        const { rows } = await pool.query(query, params);
        return rows;
    }

    // Récupérer les notifications d'un tournoi
    static async getTournamentNotifications(tournamentId, limit = 20) {
        const query = `
            SELECT * FROM tournament_notifications 
            WHERE tournament_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2
        `;
        const { rows } = await pool.query(query, [tournamentId, limit]);
        return rows;
    }

    // Vérifier si un joueur peut rejoindre un tournoi
    static async canJoinTournament(tournamentId, alias) {
        const tournamentQuery = `
            SELECT status, max_players,
                   (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = $1) as current_count
            FROM tournaments 
            WHERE id = $1
        `;
        const { rows } = await pool.query(tournamentQuery, [tournamentId]);
        
        if (!rows.length) {
            return { canJoin: false, reason: 'Tournoi introuvable' };
        }
        
        const tournament = rows[0];
        
        if (tournament.status !== 'registration') {
            return { canJoin: false, reason: 'Les inscriptions sont fermées' };
        }
        
        if (tournament.current_count >= tournament.max_players) {
            return { canJoin: false, reason: 'Le tournoi est complet' };
        }

        // Vérifier l'unicité de l'alias
        const aliasQuery = 'SELECT id FROM tournament_participants WHERE tournament_id = $1 AND alias = $2';
        const { rows: aliasRows } = await pool.query(aliasQuery, [tournamentId, alias]);
        
        if (aliasRows.length > 0) {
            return { canJoin: false, reason: 'Cet alias est déjà utilisé' };
        }
        
        return { canJoin: true };
    }

    // Suppression de la méthode getStandardTournamentRules (frontend gère les règles)
}
