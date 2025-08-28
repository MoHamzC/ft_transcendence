// backend/src/services/FriendService.js
// Service complet pour la gestion des amitiés
// Conforme au sujet ft_transcendence
// Service complet pour la gestion des amitiés
// Conforme au sujet ft_transcendence

import pool from '../config/db.js';

export class FriendService
{
    // Lister tous les amis acceptés (bidirectionnel)
    // Lister tous les amis acceptés (bidirectionnel)
    static async listFriends(userId)
    {
        const { rows } = await pool.query(
        {
            text:
                `SELECT
                    u.id,
                    u.email,
                    u.username,
                    f.status,
                    f.created_at as friendship_date
                 FROM friendships f
                 JOIN users u ON (
                    CASE
                        WHEN f.requester_id = $1 THEN u.id = f.addressee_id
                        WHEN f.addressee_id = $1 THEN u.id = f.requester_id
                    END
                 )
                 WHERE (f.requester_id = $1 OR f.addressee_id = $1)
                   AND f.status = 'accepted'
                 ORDER BY f.created_at DESC`,
            values: [ userId ]
        });

        return rows;
    }

    // Lister les demandes d'amis en attente reçues
    static async listPendingRequests(userId)
    {
        const { rows } = await pool.query(
        {
            text:
                `SELECT
                    u.id,
                    u.email,
                    u.username,
                    f.status,
                    f.created_at as request_date
                 FROM friendships f
                 JOIN users u ON u.id = f.requester_id
                 WHERE f.addressee_id = $1 AND f.status = 'pending'
                 ORDER BY f.created_at DESC`,
            values: [ userId ]
        });

        return rows;
    }

    // Lister les demandes d'amis envoyées
    static async listSentRequests(userId)
    {
        const { rows } = await pool.query(
        {
            text:
                `SELECT
                    u.id,
                    u.email,
                    u.username,
                    f.status,
                    f.created_at as request_date
                 FROM friendships f
                 JOIN users u ON u.id = f.addressee_id
                 WHERE f.requester_id = $1 AND f.status = 'pending'
                 ORDER BY f.created_at DESC`,
                 WHERE f.requester_id = $1 AND f.status = 'pending'
                 ORDER BY f.created_at DESC`,
            values: [ userId ]
        });

        return rows;
    }

    // Envoyer une demande d'ami
    static async sendRequest(requesterId, addresseeId)
    {
        // Vérifier que l'utilisateur ne s'ajoute pas lui-même
        if (requesterId === addresseeId)
        {
            throw new Error('Cannot send friend request to yourself');
        }

        // Vérifier que l'addressee existe
        const { rows: userCheck } = await pool.query(
            'SELECT id FROM users WHERE id = $1',
            [addresseeId]
        );

        if (userCheck.length === 0)
        {
            throw new Error('User not found');
        }

        // Vérifier qu'il n'y a pas déjà une relation existante dans les deux sens
        const { rows: existingFriendship } = await pool.query(
        {
            text:
                `SELECT id, status FROM friendships
                 WHERE (requester_id = $1 AND addressee_id = $2)
                    OR (requester_id = $2 AND addressee_id = $1)`,
            values: [ requesterId, addresseeId ]
        });

        if (existingFriendship.length > 0)
        {
            const status = existingFriendship[0].status;
            if (status === 'accepted')
            {
                throw new Error('Users are already friends');
            }
            else if (status === 'pending')
            {
                throw new Error('Friend request already exists');
            }
            else if (status === 'rejected')
            {
                throw new Error('Friend request was previously rejected');
            }
        }

        // Créer la demande d'ami
        await pool.query(
        {
            text:
                `INSERT INTO friendships (requester_id, addressee_id, status)
                 VALUES ($1, $2, 'pending')`,
                 VALUES ($1, $2, 'pending')`,
            values: [ requesterId, addresseeId ]
        });

        return { message: 'Friend request sent successfully' };
    }

    // Accepter une demande d'ami
    static async acceptRequest(currentUserId, requesterId)
    {
        const result = await pool.query(
        {
            text:
                `UPDATE friendships
                 SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
                 WHERE requester_id = $1
                   AND addressee_id = $2
                   AND status = 'pending'`,
            values: [ requesterId, currentUserId ]
        });

        if (result.rowCount === 0)
        {
            throw new Error('Friend request not found or already processed');
        }

        return { message: 'Friend request accepted successfully' };
    }

    // Rejeter une demande d'ami
    static async rejectRequest(currentUserId, requesterId)
    {
        const result = await pool.query(
        {
            text:
                `UPDATE friendships
                 SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
                 WHERE requester_id = $1
                   AND addressee_id = $2
                 SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
                 WHERE requester_id = $1
                   AND addressee_id = $2
                   AND status = 'pending'`,
            values: [ requesterId, currentUserId ]
        });

        if (result.rowCount === 0)
        {
            throw new Error('Friend request not found or already processed');
        }

        return { message: 'Friend request rejected successfully' };
    }

    // Supprimer une amitié existante
    static async removeFriend(userId, friendId)
    {
        const result = await pool.query(
        {
            text:
                `DELETE FROM friendships
                 WHERE ((requester_id = $1 AND addressee_id = $2)
                    OR (requester_id = $2 AND addressee_id = $1))
                   AND status = 'accepted'`,
            values: [ userId, friendId ]
            values: [ requesterId, currentUserId ]
        });

        if (result.rowCount === 0)
        {
            throw new Error('Friend request not found or already processed');
        }

        return { message: 'Friend request rejected successfully' };
    }

    // Supprimer une amitié existante
    static async removeFriend(userId, friendId)
    {
        const result = await pool.query(
        {
            text:
                `DELETE FROM friendships
                 WHERE ((requester_id = $1 AND addressee_id = $2)
                    OR (requester_id = $2 AND addressee_id = $1))
                   AND status = 'accepted'`,
            values: [ userId, friendId ]
        });

        if (result.rowCount === 0)
        {
            throw new Error('Friendship not found');
        }

        return { message: 'Friend removed successfully' };
    }

    // Vérifier le statut d'amitié entre deux utilisateurs
    static async getFriendshipStatus(userId1, userId2)
    {
        const { rows } = await pool.query(
        {
            text:
                `SELECT status, requester_id, addressee_id FROM friendships
                 WHERE (requester_id = $1 AND addressee_id = $2)
                    OR (requester_id = $2 AND addressee_id = $1)`,
            values: [ userId1, userId2 ]
        });

        if (rows.length === 0)
        {
            return { status: 'none' };
        }

        const friendship = rows[0];
        return {
            status: friendship.status,
            isRequester: friendship.requester_id === userId1,
            isAddressee: friendship.addressee_id === userId1
        };

        if (result.rowCount === 0)
        {
            throw new Error('Friendship not found');
        }

        return { message: 'Friend removed successfully' };
    }

    // Vérifier le statut d'amitié entre deux utilisateurs
    static async getFriendshipStatus(userId1, userId2)
    {
        const { rows } = await pool.query(
        {
            text:
                `SELECT status, requester_id, addressee_id FROM friendships
                 WHERE (requester_id = $1 AND addressee_id = $2)
                    OR (requester_id = $2 AND addressee_id = $1)`,
            values: [ userId1, userId2 ]
        });

        if (rows.length === 0)
        {
            return { status: 'none' };
        }

        const friendship = rows[0];
        return {
            status: friendship.status,
            isRequester: friendship.requester_id === userId1,
            isAddressee: friendship.addressee_id === userId1
        };
    }
}
