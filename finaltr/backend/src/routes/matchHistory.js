// routes/matchHistory.js
// Historique des matchs 1v1 pour l'utilisateur authentifié

import pool from '../config/db.js'; // path check: this file is in routes/, config is in config/

export default async function matchHistoryRoutes(fastify) {
	fastify.get('/match-history', {
		schema: {
			querystring: {
				type: 'object',
				properties: {
					limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
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
									id: { type: 'string' },
									date: { type: 'string' },
									opponentId: { type: 'string' },
									opponentUsername: { type: 'string' },
									userScore: { type: 'integer' },
									opponentScore: { type: 'integer' },
									result: { type: 'string', enum: ['win', 'loss'] }
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
		preHandler: fastify.authenticate,
		handler: async (request, reply) => {
			try {
				const userId = request.user.id;
				const { limit = 20, offset = 0 } = request.query;

				// Récupération des matchs où l'utilisateur est player1 ou player2
				const result = await pool.query(
					`SELECT g.id, g.created_at, g.player1_id, g.player2_id, g.winner_id,
									g.player1_score, g.player2_score,
									CASE WHEN g.player1_id = $1 THEN g.player2_id ELSE g.player1_id END AS opponent_id,
									u.username AS opponent_username
					 FROM games g
					 JOIN users u ON u.id = CASE WHEN g.player1_id = $1 THEN g.player2_id ELSE g.player1_id END
					 WHERE g.player1_id = $1 OR g.player2_id = $1
					 ORDER BY g.created_at DESC
					 LIMIT $2 OFFSET $3`,
					[userId, limit, offset]
				);

				const countRes = await pool.query(
					'SELECT COUNT(*) AS total FROM games WHERE player1_id = $1 OR player2_id = $1',
					[userId]
				);

				const rows = result.rows.map(r => {
					const userIsP1 = r.player1_id === userId;
						const userScore = userIsP1 ? r.player1_score : r.player2_score;
						const opponentScore = userIsP1 ? r.player2_score : r.player1_score;
					return {
						id: r.id,
						date: r.created_at,
						opponentId: r.opponent_id,
						opponentUsername: r.opponent_username,
						userScore,
						opponentScore,
						result: r.winner_id === userId ? 'win' : 'loss'
					};
				});

				return reply.send({
					success: true,
					data: rows,
					pagination: {
						total: parseInt(countRes.rows[0].total, 10),
						limit: Number(limit),
						offset: Number(offset)
					}
				});
			} catch (err) {
				fastify.log.error('Error fetching match history', err);
				return reply.code(500).send({ success: false, error: 'Internal server error' });
			}
		}
	});
}
