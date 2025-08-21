import pool from '../../config/db.js'
import { verifyUser } from './user_route.js'

async function userSettingsRoutes(fastify, options) {
	fastify.put('/settings', { preHandler: verifyUser }, async (request, reply) => {
		console.log('request.user:', request.user);
		const userId = request.user?.id;
		console.log('userId:', userId);
		const { avatar_url, two_factor_enabled, language, add_friend, profile_private } = request.body;

		try {
			const result = await pool.query(
				`UPDATE user_settings SET avatar_url = COALESCE($1, avatar_url),
				two_factor_enabled = COALESCE($2, two_factor_enabled),
				language = COALESCE($3, language),
				add_friend = COALESCE($4, add_friend),
				profile_private = COALESCE($5, profile_private)
				WHERE user_id = $6 RETURNING *`,
				[avatar_url, two_factor_enabled, language, add_friend, profile_private, userId]
			);

			if (!result.rows[0]) {
				console.log(userId);
                return reply.code(404).send({ error: "Aucun paramètre trouvé pour cet utilisateur." });
            }

			console.log(result.rows[0]);
			return reply.code(200).send({message: "Les paramètres ont été mis à jour !"});
		} catch (err) {
			return reply.code(500).send({error: "Erreur lors de la mise à jour des paramètres" });
		}
	})
}

export default userSettingsRoutes;
