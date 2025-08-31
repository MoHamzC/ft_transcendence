import pool from '../config/db.js';


export default async function matchRoutes(fastify, options) {

	fastify.post('/match', async (request, reply) => {
	  const { player1_id, player2_id, winner_id } = request.body;

	  // Valider les données d'entrée
	  if (!player1_id || !player2_id || !winner_id) {
		return reply.status(400).send({ error: 'Invalid input' });
	  }

	  try {
		// Enregistrer le résultat du match dans la base de données
		const result = await pool.query(
		  'INSERT INTO games (player1_id, player2_id, winner_id) VALUES ($1, $2, $3) RETURNING *',
		  [player1_id, player2_id, winner_id]
		);

		console.log('Match result saved:', result.rows[0]);
		return reply.status(201).send(result.rows[0]);
	  } catch (error) {
		console.error('Error saving match result:', error);
		return reply.status(500).send({ error: 'Internal Server Error' });
	  }
	});
}
