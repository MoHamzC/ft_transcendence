// src/routes/friendsOnlineRoutes.js

/* Routes pour la gestion du statut en ligne des amis
    - Heartbeat pour signaler l'activité
    - Récupération du statut des amis
    - Compatible avec React frontend
*/

const friendsOnlineRoutes = async (fastify, options) => {
    
    // Heartbeat - signaler que l'utilisateur est actif
    fastify.post('/heartbeat', {
        schema: {
            summary: 'Signaler que l\'utilisateur est en ligne',
            description: 'Met à jour le timestamp last_seen et marque l\'utilisateur comme en ligne',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'string' }
                    }
                }
            }
        },
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            
            const result = await fastify.pg.query(
                'UPDATE users SET last_seen = CURRENT_TIMESTAMP, is_online = TRUE WHERE id = $1 RETURNING last_seen',
                [userId]
            );
            
            return { 
                status: 'online', 
                timestamp: result.rows[0].last_seen 
            };
        } catch (error) {
            reply.code(500).send({ error: error.message });
        }
    });

    // Récupérer le statut des amis
    fastify.get('/friends/status', {
        schema: {
            summary: 'Récupérer le statut en ligne des amis',
            description: 'Retourne la liste des amis avec leur statut en ligne (online/away/offline)',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        friends: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    username: { type: 'string' },
                                    email: { type: 'string' },
                                    is_online: { type: 'boolean' },
                                    last_seen: { type: 'string' },
                                    online_status: { type: 'string' },
                                    recently_active: { type: 'boolean' }
                                }
                            }
                        }
                    }
                }
            }
        },
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            
            const result = await fastify.pg.query(`
                SELECT 
                    u.id,
                    u.username,
                    u.email,
                    u.is_online,
                    u.last_seen,
                    CASE 
                        WHEN u.last_seen > NOW() - INTERVAL '3 minutes' THEN true
                        ELSE false
                    END as recently_active,
                    CASE 
                        WHEN u.last_seen > NOW() - INTERVAL '3 minutes' THEN 'online'
                        WHEN u.last_seen > NOW() - INTERVAL '1 hour' THEN 'away'
                        ELSE 'offline'
                    END as online_status,
                    f.status as friendship_status
                FROM users u
                INNER JOIN friendships f ON 
                    (f.requester_id = $1 AND f.addressee_id = u.id) OR
                    (f.addressee_id = $1 AND f.requester_id = u.id)
                WHERE f.status = 'accepted'
                ORDER BY 
                    CASE 
                        WHEN u.last_seen > NOW() - INTERVAL '3 minutes' THEN 1
                        WHEN u.last_seen > NOW() - INTERVAL '1 hour' THEN 2
                        ELSE 3
                    END,
                    u.last_seen DESC
            `, [userId]);
            
            return { friends: result.rows };
        } catch (error) {
            reply.code(500).send({ error: error.message });
        }
    });

    // Mettre à jour le statut offline lors de la déconnexion
    fastify.post('/logout-status', {
        schema: {
            summary: 'Marquer l\'utilisateur comme offline',
            description: 'Met à jour le statut is_online à false lors de la déconnexion'
        },
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            
            await fastify.pg.query(
                'UPDATE users SET is_online = FALSE WHERE id = $1',
                [userId]
            );
            
            return { status: 'offline' };
        } catch (error) {
            reply.code(500).send({ error: error.message });
        }
    });

    // Récupérer tous les amis (pas seulement le statut)
    fastify.get('/friends', {
        schema: {
            summary: 'Lister tous les amis avec leur statut',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        friends: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    username: { type: 'string' },
                                    email: { type: 'string' },
                                    is_online: { type: 'boolean' },
                                    last_seen: { type: 'string' },
                                    online_status: { type: 'string' },
                                    friendship_created_at: { type: 'string' }
                                }
                            }
                        },
                        total: { type: 'number' }
                    }
                }
            }
        },
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            
            const result = await fastify.pg.query(`
                SELECT 
                    u.id,
                    u.username,
                    u.email,
                    u.name,
                    u.is_online,
                    u.last_seen,
                    f.status,
                    f.created_at as friendship_created_at,
                    CASE 
                        WHEN u.last_seen > NOW() - INTERVAL '3 minutes' THEN 'online'
                        WHEN u.last_seen > NOW() - INTERVAL '1 hour' THEN 'away'
                        ELSE 'offline'
                    END as online_status
                FROM users u
                INNER JOIN friendships f ON 
                    (f.requester_id = $1 AND f.addressee_id = u.id) OR
                    (f.addressee_id = $1 AND f.requester_id = u.id)
                WHERE f.status = 'accepted'
                ORDER BY 
                    CASE 
                        WHEN u.last_seen > NOW() - INTERVAL '3 minutes' THEN 1
                        WHEN u.last_seen > NOW() - INTERVAL '1 hour' THEN 2
                        ELSE 3
                    END,
                    u.username ASC
            `, [userId]);
            
            return { 
                friends: result.rows,
                total: result.rows.length
            };
        } catch (error) {
            reply.code(500).send({ error: error.message });
        }
    });

    // Route pour nettoyer les statuts offline (optionnel - peut être appelé par un cron)
    fastify.post('/cleanup-offline-users', {
        schema: {
            summary: 'Nettoyer les utilisateurs offline',
            description: 'Marque comme offline les utilisateurs inactifs depuis plus de 5 minutes'
        }
    }, async (request, reply) => {
        try {
            const result = await fastify.pg.query(`
                UPDATE users 
                SET is_online = FALSE 
                WHERE last_seen < NOW() - INTERVAL '5 minutes' 
                AND is_online = TRUE
                RETURNING id, username
            `);
            
            return { 
                message: 'Cleanup completed',
                updated_users: result.rows.length,
                users: result.rows
            };
        } catch (error) {
            reply.code(500).send({ error: error.message });
        }
    });

};

export default friendsOnlineRoutes;
