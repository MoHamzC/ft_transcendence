// src/routes/stats.js
// Routes pour les statistiques utilisateur

import pool from "../config/db.js";

/**
 * Routes pour la gestion des statistiques
 * @param {Object} fastify - Instance Fastify
 */
export default async function statsRoutes(fastify) {

    // GET /api/stats/user/:userId - Récupérer les stats d'un utilisateur
    fastify.get('/user/:userId', {
        schema: {
            params: {
                type: 'object',
                required: ['userId'],
                properties: {
                    userId: { type: 'string', format: 'uuid' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                userId: { type: 'string' },
                                username: { type: 'string' },
                                gamesPlayed: { type: 'integer' },
                                gamesWon: { type: 'integer' },
                                gamesLost: { type: 'integer' },
                                winRate: { type: 'number' },
                                createdAt: { type: 'string' },
                                updatedAt: { type: 'string' }
                            }
                        }
                    }
                },
                404: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' }
                    }
                }
            }
        },
        preHandler: fastify.authenticate, // Middleware d'authentification
        handler: async (request, reply) => {
            try {
                const { userId } = request.params;

                // Vérifier que l'utilisateur peut accéder à ces stats
                if (request.user.id !== userId && !request.user.isAdmin) {
                    return reply.code(403).send({
                        success: false,
                        error: 'Access denied: You can only view your own stats'
                    });
                }

                // Récupérer les stats depuis la base de données
                const result = await pool.query(`
                    SELECT
                        s.user_id,
                        s.games_played,
                        s.games_won,
                        s.games_lost,
                        s.created_at,
                        s.updated_at,
                        u.username
                    FROM stats s
                    JOIN users u ON s.user_id = u.id
                    WHERE s.user_id = $1
                `, [userId]);

                if (result.rows.length === 0) {
                    return reply.code(404).send({
                        success: false,
                        error: 'Stats not found for this user'
                    });
                }

                const stats = result.rows[0];

                // Calculer le taux de victoire avec protection contre division par zéro
                const winRate = stats.games_played > 0
                    ? Math.round((stats.games_won / stats.games_played) * 100 * 100) / 100
                    : 0;

                // Formater la réponse pour le frontend
                const formattedStats = {
                    userId: stats.user_id,
                    username: stats.username,
                    gamesPlayed: stats.games_played,
                    gamesWon: stats.games_won,
                    gamesLost: stats.games_lost,
                    winRate: winRate,
                    createdAt: stats.created_at,
                    updatedAt: stats.updated_at
                };

                return reply.send({
                    success: true,
                    data: formattedStats
                });

            } catch (error) {
                fastify.log.error('Error fetching user stats:', error);
                return reply.code(500).send({
                    success: false,
                    error: 'Internal server error'
                });
            }
        }
    });

    // GET /api/stats/public/:userId - Version publique pour les tests (TEMPORAIRE)
    fastify.get('/public/:userId', {
        schema: {
            params: {
                type: 'object',
                required: ['userId'],
                properties: {
                    userId: { type: 'string', format: 'uuid' }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const { userId } = request.params;

                // Vérifier d'abord si l'utilisateur existe
                const userCheck = await pool.query(`
                    SELECT id, username FROM users WHERE id = $1
                `, [userId]);

                if (userCheck.rows.length === 0) {
                    return reply.code(404).send({
                        success: false,
                        error: 'User not found'
                    });
                }

                // Créer les stats si elles n'existent pas
                await pool.query(`
                    INSERT INTO stats (user_id, games_played, games_won, games_lost)
                    VALUES ($1, 0, 0, 0)
                    ON CONFLICT (user_id) DO NOTHING
                `, [userId]);

                // Récupérer les stats depuis la base de données
                const result = await pool.query(`
                    SELECT
                        s.user_id,
                        s.games_played,
                        s.games_won,
                        s.games_lost,
                        s.created_at,
                        s.updated_at,
                        u.username
                    FROM stats s
                    JOIN users u ON s.user_id = u.id
                    WHERE s.user_id = $1
                `, [userId]);

                if (result.rows.length === 0) {
                    return reply.code(404).send({
                        success: false,
                        error: 'Stats not found for this user'
                    });
                }

                const stats = result.rows[0];
                const winRate = stats.games_played > 0
                    ? Math.round((stats.games_won / stats.games_played) * 100 * 100) / 100
                    : 0;

                return reply.send({
                    success: true,
                    data: {
                        userId: stats.user_id,
                        username: stats.username,
                        gamesPlayed: stats.games_played,
                        gamesWon: stats.games_won,
                        gamesLost: stats.games_lost,
                        winRate: winRate,
                        createdAt: stats.created_at,
                        updatedAt: stats.updated_at
                    }
                });

            } catch (error) {
                fastify.log.error('Error fetching user stats:', error);
                return reply.code(500).send({
                    success: false,
                    error: 'Internal server error'
                });
            }
        }
    });

    // GET /api/stats/leaderboard - Récupérer le classement général
    fastify.get('/leaderboard', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
                    offset: { type: 'integer', minimum: 0, default: 0 }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    rank: { type: 'integer' },
                                    userId: { type: 'string' },
                                    username: { type: 'string' },
                                    gamesPlayed: { type: 'integer' },
                                    gamesWon: { type: 'integer' },
                                    winRate: { type: 'number' }
                                }
                            }
                        },
                        pagination: {
                            type: 'object',
                            properties: {
                                total: { type: 'integer' },
                                limit: { type: 'integer' },
                                offset: { type: 'integer' }
                            }
                        }
                    }
                }
            }
        },
        handler: async (request, reply) => {
            try {
                const { limit = 10, offset = 0 } = request.query;

                // Récupérer le classement avec pagination
                const result = await pool.query(`
                    SELECT
                        s.user_id,
                        u.username,
                        s.games_played,
                        s.games_won,
                        s.games_lost,
                        CASE
                            WHEN s.games_played > 0
                            THEN ROUND((s.games_won::decimal / s.games_played) * 100, 2)
                            ELSE 0
                        END as win_rate,
                        ROW_NUMBER() OVER (
                            ORDER BY
                                CASE WHEN s.games_played > 0
                                     THEN s.games_won::decimal / s.games_played
                                     ELSE 0 END DESC,
                                s.games_won DESC,
                                s.games_played DESC,
                                u.username ASC
                        ) as rank
                    FROM stats s
                    JOIN users u ON s.user_id = u.id
                    WHERE s.games_played >= 0
                    ORDER BY rank
                    LIMIT $1 OFFSET $2
                `, [limit, offset]);

                // Compter le total pour la pagination
                const countResult = await pool.query(`
                    SELECT COUNT(*) as total
                    FROM stats s
                    JOIN users u ON s.user_id = u.id
                    WHERE s.games_played >= 0
                `);

                const total = parseInt(countResult.rows[0].total);

                const leaderboard = result.rows.map(row => ({
                    rank: parseInt(row.rank),
                    userId: row.user_id,
                    username: row.username,
                    gamesPlayed: row.games_played,
                    gamesWon: row.games_won,
                    gamesLost: row.games_lost,
                    winRate: parseFloat(row.win_rate)
                }));

                return reply.send({
                    success: true,
                    data: leaderboard,
                    pagination: {
                        total,
                        limit,
                        offset
                    }
                });

            } catch (error) {
                fastify.log.error('Error fetching leaderboard:', error);
                return reply.code(500).send({
                    success: false,
                    error: 'Internal server error'
                });
            }
        }
    });

    // POST /api/stats/update/:userId - Mettre à jour les stats après une partie
    fastify.post('/update/:userId', {
        schema: {
            params: {
                type: 'object',
                required: ['userId'],
                properties: {
                    userId: { type: 'string', format: 'uuid' }
                }
            },
            body: {
                type: 'object',
                required: ['gameResult'],
                properties: {
                    gameResult: {
                        type: 'string',
                        enum: ['win', 'loss']
                    }
                }
            }
        },
        preHandler: fastify.authenticate,
        handler: async (request, reply) => {
            try {
                const { userId } = request.params;
                const { gameResult } = request.body;

                // Vérifier les permissions
                if (request.user.id !== userId && !request.user.isAdmin) {
                    return reply.code(403).send({
                        success: false,
                        error: 'Access denied'
                    });
                }

                // Créer ou mettre à jour les stats
                const result = await pool.query(`
                    INSERT INTO stats (user_id, games_played, games_won, games_lost)
                    VALUES ($1, 1, $2, $3)
                    ON CONFLICT (user_id)
                    DO UPDATE SET
                        games_played = stats.games_played + 1,
                        games_won = stats.games_won + $2,
                        games_lost = stats.games_lost + $3,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING *
                `, [
                    userId,
                    gameResult === 'win' ? 1 : 0,
                    gameResult === 'loss' ? 1 : 0
                ]);

                const updatedStats = result.rows[0];
                const winRate = updatedStats.games_played > 0
                    ? Math.round((updatedStats.games_won / updatedStats.games_played) * 100 * 100) / 100
                    : 0;

                return reply.send({
                    success: true,
                    data: {
                        userId: updatedStats.user_id,
                        gamesPlayed: updatedStats.games_played,
                        gamesWon: updatedStats.games_won,
                        gamesLost: updatedStats.games_lost,
                        winRate: winRate,
                        updatedAt: updatedStats.updated_at
                    }
                });

            } catch (error) {
                fastify.log.error('Error updating user stats:', error);
                return reply.code(500).send({
                    success: false,
                    error: 'Internal server error'
                });
            }
        }
    });

    // POST /api/stats/init/:userId - Initialiser les stats pour un nouvel utilisateur
    fastify.post('/init/:userId', {
        schema: {
            params: {
                type: 'object',
                required: ['userId'],
                properties: {
                    userId: { type: 'string', format: 'uuid' }
                }
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                userId: { type: 'string' },
                                gamesPlayed: { type: 'integer' },
                                gamesWon: { type: 'integer' },
                                gamesLost: { type: 'integer' },
                                winRate: { type: 'number' }
                            }
                        }
                    }
                }
            }
        },
        preHandler: fastify.authenticate,
        handler: async (request, reply) => {
            try {
                const { userId } = request.params;

                // Vérifier les permissions
                if (request.user.id !== userId && !request.user.isAdmin) {
                    return reply.code(403).send({
                        success: false,
                        error: 'Access denied'
                    });
                }

                // Créer les stats initiales (ou ne rien faire si elles existent déjà)
                const result = await pool.query(`
                    INSERT INTO stats (user_id, games_played, games_won, games_lost)
                    VALUES ($1, 0, 0, 0)
                    ON CONFLICT (user_id) DO NOTHING
                    RETURNING *
                `, [userId]);

                // Si pas de retour, les stats existent déjà
                if (result.rows.length === 0) {
                    const existingStats = await pool.query(`
                        SELECT * FROM stats WHERE user_id = $1
                    `, [userId]);

                    return reply.send({
                        success: true,
                        data: {
                            userId: existingStats.rows[0].user_id,
                            gamesPlayed: existingStats.rows[0].games_played,
                            gamesWon: existingStats.rows[0].games_won,
                            gamesLost: existingStats.rows[0].games_lost,
                            winRate: 0
                        }
                    });
                }

                const newStats = result.rows[0];
                return reply.code(201).send({
                    success: true,
                    data: {
                        userId: newStats.user_id,
                        gamesPlayed: newStats.games_played,
                        gamesWon: newStats.games_won,
                        gamesLost: newStats.games_lost,
                        winRate: 0
                    }
                });

            } catch (error) {
                fastify.log.error('Error initializing user stats:', error);
                return reply.code(500).send({
                    success: false,
                    error: 'Internal server error'
                });
            }
        }
    });
}
