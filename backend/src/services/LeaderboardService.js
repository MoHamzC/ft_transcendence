// src/services/LeaderboardService.js
import pool from '../db/pgClient.js';

export class LeaderboardService
{
    static async getBoard()
    {
        const res = await pool.query('SELECT id, email, wins, games FROM leaderboard ORDER BY wins DESC, games DESC');
        return res.rows;
    }
}
