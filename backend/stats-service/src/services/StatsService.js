// src/services/StatsService.js

/* StatsService.js — Service pour gérer les statistiques des utilisateurs
    - Récupère les statistiques d'un utilisateur.
    - Calcule les statistiques de jeu, victoires, etc.
*/

export class StatsService
{
    static async getStats(userId)
    {
        // TODO: real logic for proper stats
        return {
            gamesPlayed: 10,
            gamesWon: 7,
            winRate: 70
        };
    }
}
