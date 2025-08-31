// src/routes/stats.route.js

/* stats.route.js — Routes pour les statistiques des utilisateurs
    - GET /api/stats/:userId - Récupère les statistiques complètes d'un utilisateur
    - GET /api/stats/me - Récupère les statistiques de l'utilisateur connecté
    - GET /api/stats/:userId/ranking - Récupère le classement d'un utilisateur
*/

import { StatsService } from '../services/StatsService.js';

export default async function statsRoutes(fastify, options) {
    
    // Route pour récupérer les statistiques complètes de l'utilisateur connecté
    fastify.get('/me', {
        schema: {
            description: 'Récupère les statistiques complètes de l\'utilisateur connecté',
            tags: ['Stats'],
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                overview: {
                                    type: 'object',
                                    properties: {
                                        totalGames: { type: 'integer' },
                                        totalWins: { type: 'integer' },
                                        totalLosses: { type: 'integer' },
                                        winRate: { type: 'number' },
                                        tournamentWins: { type: 'integer' },
                                        tournamentParticipations: { type: 'integer' },
                                        tournamentWinRate: { type: 'number' },
                                        lastUpdated: { type: 'string', format: 'date-time' }
                                    }
                                },
                                recentGames: { type: 'array' },
                                gameTypeStats: { type: 'array' },
                                recentTournaments: { type: 'array' },
                                ranking: { type: 'integer' }
                            }
                        }
                    }
                },
                401: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        },
        preHandler: fastify.authenticate
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            
            // Récupérer les statistiques complètes
            const stats = await StatsService.getCompleteStats(userId);
            
            // Récupérer le classement
            const ranking = await StatsService.getUserRanking(userId);
            
            return reply.code(200).send({
                success: true,
                data: {
                    ...stats,
                    ranking
                }
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            return reply.code(500).send({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    });

    // Route pour récupérer les statistiques d'un utilisateur spécifique
    fastify.get('/:userId', {
        schema: {
            description: 'Récupère les statistiques complètes d\'un utilisateur spécifique',
            tags: ['Stats'],
            params: {
                type: 'object',
                properties: {
                    userId: { type: 'string', format: 'uuid' }
                },
                required: ['userId']
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: { type: 'object' }
                    }
                },
                404: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { userId } = request.params;
            
            // Vérifier que l'utilisateur existe
            const userCheck = await fastify.db.query(
                'SELECT id FROM users WHERE id = $1',
                [userId]
            );
            
            if (userCheck.rows.length === 0) {
                return reply.code(404).send({
                    success: false,
                    message: 'Utilisateur introuvable'
                });
            }
            
            // Récupérer les statistiques
            const stats = await StatsService.getCompleteStats(userId);
            const ranking = await StatsService.getUserRanking(userId);
            
            return reply.code(200).send({
                success: true,
                data: {
                    ...stats,
                    ranking
                }
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            return reply.code(500).send({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    });

    // Route pour récupérer uniquement le classement d'un utilisateur
    fastify.get('/:userId/ranking', {
        schema: {
            description: 'Récupère le classement d\'un utilisateur dans le leaderboard',
            tags: ['Stats'],
            params: {
                type: 'object',
                properties: {
                    userId: { type: 'string', format: 'uuid' }
                },
                required: ['userId']
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                userId: { type: 'string', format: 'uuid' },
                                ranking: { type: 'integer' }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { userId } = request.params;
            
            const ranking = await StatsService.getUserRanking(userId);
            
            return reply.code(200).send({
                success: true,
                data: {
                    userId,
                    ranking
                }
            });
        } catch (error) {
            console.error('Erreur lors de la récupération du classement:', error);
            return reply.code(500).send({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    });

    // Route pour récupérer les statistiques de base (compatible avec l'ancien système)
    fastify.get('/basic/:userId', {
        schema: {
            description: 'Récupère les statistiques de base d\'un utilisateur (rétro-compatibilité)',
            tags: ['Stats'],
            params: {
                type: 'object',
                properties: {
                    userId: { type: 'string', format: 'uuid' }
                },
                required: ['userId']
            }
        }
    }, async (request, reply) => {
        try {
            const { userId } = request.params;
            const stats = await StatsService.getStats(userId);
            
            return reply.code(200).send({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques de base:', error);
            return reply.code(500).send({
                success: false,
                message: 'Erreur interne du serveur'
            });
        }
    });
}
