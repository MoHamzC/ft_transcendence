// src/services/StatsService.js

/* StatsService.js — Service pour gérer les statistiques des utilisateurs
    - Récupère les statistiques d'un utilisateur.
    - Calcule les statistiques de jeu, victoires, etc.
*/

import pool from '../config/db.js';

export class StatsService
{
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
}
