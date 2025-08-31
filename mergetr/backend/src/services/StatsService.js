// src/services/StatsService.js

/* StatsService.js — Service pour gérer les statistiques des utilisateurs
    - Récupère les statistiques d'un utilisateur.
    - Calcule les statistiques de jeu, victoires, etc.
    - Récupère l'historique des parties
    - Récupère les stats de tournois
*/

import pool from '../config/db.js';

export class StatsService
{
    // Récupère les statistiques de base d'un utilisateur
    static async getStats(userId)
    {
        const { rows } = await pool.query(
            `SELECT games_played, games_won, games_lost
             FROM stats WHERE user_id = $1`, [userId]
        );
        const stats = rows[0] || { games_played: 0, games_won: 0, games_lost: 0 };

        // Calculer le taux de victoire
        let winRate;
        if (stats.games_played > 0)
            winRate = Math.round((stats.games_won / stats.games_played) * 100);
        else
            winRate = 0;

        // Retourner les statistiques formatées
        return{
            gamesPlayed: stats.games_played,
            gamesWon: stats.games_won,
            gamesLost: stats.games_lost,
            winRate
        };
    }

    // Récupère les statistiques complètes d'un utilisateur (leaderboard + historique)
    static async getCompleteStats(userId)
    {
        try {
            // 1. Récupérer les stats du leaderboard
            const leaderboardQuery = `
                SELECT 
                    wins,
                    games,
                    tournament_wins,
                    tournament_participations,
                    win_rate,
                    tournament_win_rate,
                    updated_at
                FROM leaderboard 
                WHERE user_id = $1
            `;
            const { rows: leaderboardRows } = await pool.query(leaderboardQuery, [userId]);
            
            const leaderboardStats = leaderboardRows[0] || {
                wins: 0,
                games: 0,
                tournament_wins: 0,
                tournament_participations: 0,
                win_rate: 0,
                tournament_win_rate: 0,
                updated_at: null
            };

            // 2. Récupérer l'historique des 10 dernières parties
            const gamesHistoryQuery = `
                SELECT 
                    g.id,
                    g.player1_score,
                    g.player2_score,
                    g.game_type,
                    g.status,
                    g.finished_at,
                    CASE 
                        WHEN g.winner_id = $1 THEN true 
                        ELSE false 
                    END as won,
                    CASE 
                        WHEN g.player1_id = $1 THEN u2.username 
                        ELSE u1.username 
                    END as opponent_name,
                    CASE 
                        WHEN g.player1_id = $1 THEN g.player1_score 
                        ELSE g.player2_score 
                    END as my_score,
                    CASE 
                        WHEN g.player1_id = $1 THEN g.player2_score 
                        ELSE g.player1_score 
                    END as opponent_score
                FROM games g
                JOIN users u1 ON g.player1_id = u1.id
                JOIN users u2 ON g.player2_id = u2.id
                WHERE (g.player1_id = $1 OR g.player2_id = $1) 
                    AND g.status = 'finished'
                ORDER BY g.finished_at DESC
                LIMIT 10
            `;
            const { rows: gamesHistory } = await pool.query(gamesHistoryQuery, [userId]);

            // 3. Calculer les statistiques par type de jeu
            const gameTypesQuery = `
                SELECT 
                    game_type,
                    COUNT(*) as total_games,
                    SUM(CASE WHEN winner_id = $1 THEN 1 ELSE 0 END) as wins
                FROM games 
                WHERE (player1_id = $1 OR player2_id = $1) 
                    AND status = 'finished'
                GROUP BY game_type
            `;
            const { rows: gameTypes } = await pool.query(gameTypesQuery, [userId]);

            // 4. Récupérer les tournois récents
            const tournamentsQuery = `
                SELECT 
                    t.id,
                    t.name,
                    t.status,
                    t.finished_at,
                    tp.alias,
                    CASE 
                        WHEN t.winner_id = tp.id THEN true 
                        ELSE false 
                    END as won
                FROM tournaments t
                JOIN tournament_participants tp ON t.id = tp.tournament_id
                WHERE tp.user_id = $1
                ORDER BY t.created_at DESC
                LIMIT 5
            `;
            const { rows: tournaments } = await pool.query(tournamentsQuery, [userId]);

            return {
                overview: {
                    totalGames: leaderboardStats.games,
                    totalWins: leaderboardStats.wins,
                    totalLosses: leaderboardStats.games - leaderboardStats.wins,
                    winRate: parseFloat(leaderboardStats.win_rate) || 0,
                    tournamentWins: leaderboardStats.tournament_wins,
                    tournamentParticipations: leaderboardStats.tournament_participations,
                    tournamentWinRate: parseFloat(leaderboardStats.tournament_win_rate) || 0,
                    lastUpdated: leaderboardStats.updated_at
                },
                recentGames: gamesHistory,
                gameTypeStats: gameTypes.map(gt => ({
                    gameType: gt.game_type,
                    totalGames: parseInt(gt.total_games),
                    wins: parseInt(gt.wins),
                    losses: parseInt(gt.total_games) - parseInt(gt.wins),
                    winRate: gt.total_games > 0 ? Math.round((gt.wins / gt.total_games) * 100) : 0
                })),
                recentTournaments: tournaments
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques complètes:', error);
            throw error;
        }
    }

    // Récupère le classement d'un utilisateur dans le leaderboard
    static async getUserRanking(userId)
    {
        try {
            const rankQuery = `
                WITH ranked_users AS (
                    SELECT 
                        user_id,
                        wins,
                        games,
                        win_rate,
                        ROW_NUMBER() OVER (ORDER BY wins DESC, win_rate DESC, games DESC) as rank
                    FROM leaderboard
                    WHERE games > 0
                )
                SELECT rank FROM ranked_users WHERE user_id = $1
            `;
            const { rows } = await pool.query(rankQuery, [userId]);
            return rows[0]?.rank || null;
        } catch (error) {
            console.error('Erreur lors de la récupération du classement:', error);
            return null;
        }
    }
}
