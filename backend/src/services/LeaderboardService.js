// backend/src/services/LeaderboardService.js
// Allman

import { pool } from '../db/pgClient.js';

export class LeaderboardService
{
    static async getBoard({ limit = 10, offset = 0 } = {})
    {
        const { rows } = await pool.query(
        {
            text:
                `SELECT id, email, wins, games
                 FROM leaderboard
                 ORDER BY wins DESC, games DESC
                 LIMIT $1 OFFSET $2`,
            values: [ limit, offset ]
        });

        return rows;
    }
}
