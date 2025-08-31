// backend/src/services/LeaderboardService.js - Version améliorée
import pool from '../config/db.js';

export class LeaderboardService {
    /**
     * Récupère le leaderboard avec pagination
     * @param {Object} options - Options de pagination
     * @param {number} options.limit - Nombre d'entrées à récupérer
     * @param {number} options.offset - Décalage pour la pagination
     * @returns {Array} Liste des joueurs classés
     */
    static async getBoard({ limit = 10, offset = 0 } = {}) {
        const { rows } = await pool.query({
            text: `
                SELECT 
                    l.id, 
                    l.user_id,
                    u.username,
                    l.email, 
                    l.wins, 
                    l.games,
                    l.win_rate,
                    l.tournament_wins,
                    l.tournament_participations,
                    l.tournament_win_rate,
                    l.updated_at
                FROM leaderboard l
                JOIN users u ON l.user_id = u.id
                ORDER BY l.wins DESC, l.win_rate DESC, l.tournament_wins DESC
                LIMIT $1 OFFSET $2
            `,
            values: [limit, offset]
        });

        return rows;
    }

    /**
     * Met à jour les statistiques d'un utilisateur dans le leaderboard
     * @param {string} userId - ID de l'utilisateur
     */
    static async updateUserStats(userId) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Récupérer les stats de jeu classiques
            const gameStats = await client.query(`
                SELECT 
                    COUNT(*) as games_played,
                    COUNT(CASE WHEN winner_id = $1 THEN 1 END) as games_won
                FROM games 
                WHERE (player1_id = $1 OR player2_id = $1) 
                AND status = 'finished'
            `, [userId]);
            
            // Récupérer les stats des tournois
            const tournamentStats = await client.query(`
                SELECT 
                    COUNT(DISTINCT t.id) as tournament_participations,
                    COUNT(CASE WHEN t.winner_id = tp.id THEN 1 END) as tournament_wins
                FROM tournaments t
                JOIN tournament_participants tp ON t.id = tp.tournament_id
                WHERE tp.user_id = $1 AND t.status = 'finished'
            `, [userId]);
            
            // Récupérer l'email de l'utilisateur
            const userInfo = await client.query(`
                SELECT email FROM users WHERE id = $1
            `, [userId]);
            
            if (userInfo.rows.length === 0) {
                throw new Error(`User ${userId} not found`);
            }
            
            const { games_played, games_won } = gameStats.rows[0];
            const { tournament_participations, tournament_wins } = tournamentStats.rows[0];
            const { email } = userInfo.rows[0];
            
            // Insérer ou mettre à jour le leaderboard
            await client.query(`
                INSERT INTO leaderboard (user_id, email, wins, games, tournament_wins, tournament_participations)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (user_id) 
                DO UPDATE SET 
                    email = EXCLUDED.email,
                    wins = EXCLUDED.wins,
                    games = EXCLUDED.games,
                    tournament_wins = EXCLUDED.tournament_wins,
                    tournament_participations = EXCLUDED.tournament_participations,
                    updated_at = CURRENT_TIMESTAMP
            `, [userId, email, games_won, games_played, tournament_wins, tournament_participations]);
            
            await client.query('COMMIT');
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Met à jour le leaderboard complet
     */
    static async updateAllStats() {
        const { rows: users } = await pool.query(`
            SELECT DISTINCT id FROM users 
            WHERE id IN (
                SELECT player1_id FROM games 
                UNION 
                SELECT player2_id FROM games
                UNION
                SELECT tp.user_id FROM tournament_participants tp WHERE tp.user_id IS NOT NULL
            )
        `);

        console.log(`📊 Mise à jour du leaderboard pour ${users.length} utilisateurs...`);
        
        for (const user of users) {
            try {
                await this.updateUserStats(user.id);
            } catch (error) {
                console.error(`❌ Erreur mise à jour utilisateur ${user.id}:`, error.message);
            }
        }
        
        console.log('✅ Leaderboard mis à jour');
    }

    /**
     * Récupère les stats détaillées d'un utilisateur
     * @param {string} userId - ID de l'utilisateur
     */
    static async getUserStats(userId) {
        const { rows } = await pool.query(`
            SELECT 
                l.*,
                u.username,
                u.created_at as user_since
            FROM leaderboard l
            JOIN users u ON l.user_id = u.id
            WHERE l.user_id = $1
        `, [userId]);

        return rows[0] || null;
    }
}
