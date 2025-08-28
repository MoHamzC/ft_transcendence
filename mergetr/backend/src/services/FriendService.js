// backend/src/services/FriendService.js
// Allman

import pool from '../config/db.js';

export class FriendService
{
    static async listFriends(userId)
    {
        const { rows } = await pool.query(
        {
            text:
            `SELECT u.id, u.email, f.status
            FROM friendships f
            JOIN users u ON u.id = f.addressee_id
            WHERE f.requester_id = $1 AND f.status = 'accepted'`,
            values: [ userId ]
        });

        return rows;
    }

    static async sendRequest(requesterId, addresseeId)
    {
        await pool.query(
        {
            text:
                `INSERT INTO friendships (requester_id, addressee_id, status)
                 VALUES ($1, $2, 'pending')
                 ON CONFLICT DO NOTHING`,
            values: [ requesterId, addresseeId ]
        });
    }

    static async acceptRequest(requesterId, addresseeId)
    {
        await pool.query(
        {
            text:
                `UPDATE friendships
                 SET status = 'accepted'
                 WHERE requester_id = $2
                   AND addressee_id = $1
                   AND status = 'pending'`,
            values: [ addresseeId, requesterId ]
        });
    }
}
