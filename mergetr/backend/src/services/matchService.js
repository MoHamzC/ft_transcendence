import db from '../config/db.js';
import TournamentTempService from './TournamentTempService.js';

export default async function matchRoutes(fastify, options) {
	// API générique de match hors tournoi (si besoin)
	fastify.post('/match-classic', async (request, reply) => {
		const { player1_id, player2_id, winner_id, player1_score = 0, player2_score = 0 } = request.body;
		if (!player1_id || !player2_id || !winner_id) {
			return reply.code(400).send({ error: 'Missing required fields' });
		}
		try {
			const result = await db.query(
				'INSERT INTO games (player1_id, player2_id, winner_id, player1_score, player2_score, status, started_at, finished_at) VALUES ($1,$2,$3,$4,$5,\'finished\',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) RETURNING *',
				[player1_id, player2_id, winner_id, player1_score, player2_score]
			);
			return reply.code(201).send(result.rows[0]);
		} catch (error) {
			fastify.log.error('Error saving classic match:', error);
			return reply.code(500).send({ error: 'Internal Server Error' });
		}
	});

	// API simplifiée pour le moteur de jeu: enregistre résultat d'un match de tournoi automatiquement
	fastify.post('/match', async (request, reply) => {
		const { playerWinner, playerLoser, playerWinnerScore, playerLoserScore } = request.body || {};
		fastify.log.info({ route: '/api/match', body: request.body, note: 'Incoming generic match result' });
		if (!playerWinner || !playerLoser) {
			return reply.code(400).send({ success: false, error: 'playerWinner & playerLoser required' });
		}
		if (playerWinner === playerLoser) {
			return reply.code(400).send({ success: false, error: 'Players must differ' });
		}

		// Vérifier d'abord si c'est un match de tournoi en cherchant par participant IDs
		try {
			const tournamentMatchRes = await db.query(
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
			const matchRes = await db.query(
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
			fastify.log.info({ route: '/api/match', response: responsePayload, note: 'Response after generic match record' });
			return reply.send(responsePayload);
		} catch (error) {
			fastify.log.error('Error in /match route:', error);
			return reply.code(500).send({ success: false, error: 'Internal Server Error' });
		}
	});
}
