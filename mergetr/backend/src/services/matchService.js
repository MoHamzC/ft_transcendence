import pool from '../config/db.js';
import { verifyUser } from '../routes/users/user_route.js';
import TournamentTempService from './TournamentTempService.js';

export default async function matchRoutes(fastify, options) {
  const getPlayerSchema = {
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          pong_color: { type: 'string' },
          pong_skin_type: { type: 'string' },
          avatar_url: { type: ['string', 'null'] }
        }
      },
      404: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  };

  const getPlayerByIdSchema = {
    params: {
      type: 'object',
      properties: {
        playerId: { type: 'string' }
      },
      required: ['playerId']
    },
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          pong_color: { type: 'string' },
          pong_skin_type: { type: 'string' },
          avatar_url: { type: ['string', 'null'] }
        }
      },
      404: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  };

  // Récupérer les données du joueur connecté
  fastify.get(
    '/me',
    {
      schema: getPlayerSchema,
      preHandler: [verifyUser]
    },
    async (request, reply) => {
      try {
        const userId = request.user.id;

		console.log('User ID:', userId);

        // Changed: join with user_settings and use result.rows[0], then merge into userData
        const result = await pool.query(
          `SELECT u.id, u.username,
                  us.pong_color, us.pong_skin_type, us.avatar_url
           FROM users u
           LEFT JOIN user_settings us ON u.id = us.user_id
           WHERE u.id = $1`,
          [userId]
        );

        const user = result.rows[0];
        if (!user) {
          return reply.status(404).send({ error: 'Utilisateur non trouvé' });
        }

        const userData = {
          id: user.id,
          name: user.username,
          pong_color: user.pong_color || '#0000FF',
          pong_skin_type: user.pong_skin_type || 'color',
          avatar_url: user.avatar_url
        };

        return userData;
      } catch (error) {
        fastify.log.error('Erreur récupération joueur:', error);
        return reply.status(500).send({ error: 'Erreur serveur' });
      }
    }
  );

fastify.get('/ia', async (request, reply) => {
  try {
    // Récupérer l'utilisateur IA avec ses settings
    const result = await pool.query(`
      SELECT u.id, u.username, u.name,
             us.pong_color, us.pong_skin_type
      FROM users u
      LEFT JOIN user_settings us ON u.id = us.user_id
      WHERE u.username = $1
    `, ['IA']); // Changé de 'AI' à 'IA'

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'AI user not found' });
    }

    const aiUser = result.rows[0];
    return {
      id: aiUser.id,
      name: aiUser.name || aiUser.username, // fallback au username si pas de name
      username: aiUser.username,
      pong_color: aiUser.pong_color || '#FF0000',
      pong_skin_type: aiUser.pong_skin_type || 'color'
    };
  } catch (error) {
    fastify.log.error('Erreur récupération IA:', error);
    return reply.code(500).send({ error: 'Internal server error' });
  }
});

	// API générique de match hors tournoi (si besoin)
  fastify.post('/match', async (request, reply) => {
    const { playerWinner, playerLoser, playerWinnerScore, playerLoserScore } = request.body;

    // Valider les données d'entrée
    if (!playerWinner || !playerLoser) {
      return reply.status(400).send({ error: 'Invalid input' });
    }

    try {
      // Enregistrer le résultat du match dans la base de données
      const result = await pool.query(
        'INSERT INTO games (player1_id, player2_id, winner_id, player1_score, player2_score) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [playerLoser, playerWinner, playerWinner, playerWinnerScore, playerLoserScore]
      );

      console.log('Match result saved:', result.rows[0]);

	  // Enregistrer le résultat personnelle dans les stats du joueur dans la base de données
      await pool.query(
        'UPDATE stats SET games_won = games_won + 1, games_played = games_played + 1 WHERE user_id = $1',
        [playerWinner]
      );
	  await pool.query(
        'UPDATE stats SET games_lost = games_lost + 1, games_played = games_played + 1 WHERE user_id = $1',
        [playerLoser]
      );

      return reply.status(201).send(result.rows[0]);
    } catch (error) {
      console.error('Error saving match result:', error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

	// API simplifiée pour le moteur de jeu: enregistre résultat d'un match de tournoi automatiquement
	fastify.post('/match-tournoi', async (request, reply) => {
		const { playerWinner, playerLoser, playerWinnerScore, playerLoserScore } = request.body || {};
		fastify.log.info({ route: '/api/match-tournoi', body: request.body, note: 'Incoming generic match result' });
		if (!playerWinner || !playerLoser) {
			return reply.code(400).send({ success: false, error: 'playerWinner & playerLoser required' });
		}
		if (playerWinner === playerLoser) {
			return reply.code(400).send({ success: false, error: 'Players must differ' });
		}

		// Vérifier d'abord si c'est un match de tournoi en cherchant par participant IDs
		try {
			const tournamentMatchRes = await pool.query(
				`SELECT tm.id as match_id, tm.tournament_id, tm.round_number, tm.status as match_status,
						p1.id as p1_participant_id, p2.id as p2_participant_id
				 FROM tournament_matches tm
				 JOIN tournament_participants p1 ON tm.player1_id = p1.id
				 JOIN tournament_participants p2 ON tm.player2_id = p2.id
				 JOIN tournaments t ON tm.tournament_id = t.id
				 WHERE t.status = 'in_progress'
				   AND tm.status IN ('pending','in_progress')
				   AND (p1.id = $1 OR p2.id = $1)
				   AND (p1.id = $2 OR p2.id = $2)`,
				[playerWinner, playerLoser]
			);

			console.log('Tournament match found:', tournamentMatchRes.rows);

			if (tournamentMatchRes.rows.length === 1) {
				// C'est un match de tournoi - utiliser la logique tournoi
				const row = tournamentMatchRes.rows[0];
				const { match_id, tournament_id } = row;

				const record = await TournamentTempService.recordMatchResult({
					tournamentId: tournament_id,
					matchId: match_id,
					playerWinner,
					playerLoser,
					playerWinnerScore: playerWinnerScore ?? 0,
					playerLoserScore: playerLoserScore ?? 0
				});
				if (!record.success) return reply.code(400).send(record);

				const matchesAfter = await TournamentTempService.getTournamentMatches(tournament_id);
				const responsePayload = {
					success: true,
					tournamentId: tournament_id,
					matchId: match_id,
					round: row.round_number,
					updated: true,
					matches: matchesAfter.success ? matchesAfter.matches : undefined
				};
				fastify.log.info({ route: '/api/match', response: responsePayload, note: 'Tournament match recorded via generic endpoint' });
				return reply.send(responsePayload);
			}
		} catch (tournamentError) {
			fastify.log.warn('Error checking for tournament match:', tournamentError);
		}

		// Si ce n'est pas un match de tournoi, essayer l'ancienne logique avec user IDs
		try {
			const matchRes = await pool.query(
				`SELECT tm.id as match_id, tm.tournament_id, tm.round_number, tm.status as match_status,
						p1.id as p1_participant_id, p2.id as p2_participant_id,
						p1.user_id as p1_user_id, p2.user_id as p2_user_id
				 FROM tournament_matches tm
				 JOIN tournament_participants p1 ON tm.player1_id = p1.id
				 JOIN tournament_participants p2 ON tm.player2_id = p2.id
				 JOIN tournaments t ON tm.tournament_id = t.id
				 WHERE t.status = 'in_progress'
				   AND tm.status IN ('pending','in_progress')
				   AND p1.user_id IN ($1,$2)
				   AND p2.user_id IN ($1,$2)`,
				[playerWinner, playerLoser]
			);

			if (matchRes.rows.length === 0) {
				return reply.code(404).send({ success: false, error: 'No active match found for these players' });
			}
			if (matchRes.rows.length > 1) {
				return reply.code(409).send({ success: false, error: 'Ambiguous: multiple matches found' });
			}
			const row = matchRes.rows[0];
			const { match_id, tournament_id, p1_participant_id, p2_participant_id } = row;

			// Mapper user winner/loser -> participant IDs
			let winnerParticipantId = (row.p1_user_id === playerWinner) ? p1_participant_id : p2_participant_id;
			let loserParticipantId = (row.p1_user_id === playerLoser) ? p1_participant_id : p2_participant_id;

			// Enregistrer résultat via service
			const record = await TournamentTempService.recordMatchResult({
				tournamentId: tournament_id,
				matchId: match_id,
				playerWinner: winnerParticipantId,
				playerLoser: loserParticipantId,
				playerWinnerScore: playerWinnerScore ?? 0,
				playerLoserScore: playerLoserScore ?? 0
			});
			if (!record.success) return reply.code(400).send(record);

			// Récupérer état tournoi après update
			const matchesAfter = await TournamentTempService.getTournamentMatches(tournament_id);
			const responsePayload = {
				success: true,
				tournamentId: tournament_id,
				matchId: match_id,
				round: row.round_number,
				updated: true,
				matches: matchesAfter.success ? matchesAfter.matches : undefined
			};
			fastify.log.info({ route: '/api/match-tournoi', response: responsePayload, note: 'Response after generic match record' });
			return reply.send(responsePayload);
		} catch (error) {
			fastify.log.error('Error in /match-tournoi route:', error);
			return reply.code(500).send({ success: false, error: 'Internal Server Error' });
		}
	});
}
