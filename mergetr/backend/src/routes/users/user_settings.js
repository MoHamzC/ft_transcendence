import pool from '../../config/db.js'
import bcrypt from 'bcrypt'
import { verifyUser } from './user_route.js'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import path from 'path'
import fs from 'fs'

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

	fastify.put("/reset_password", { preHandler: verifyUser }, async (request, reply) => {
		try {
			const userData = request.user;
			const { newPassword, newPasswordConfirmation } = request.body;

			if (!newPassword){
				return reply.code(400).send({error: "La case nouveau password est vide"});
			}
			if (!newPasswordConfirmation){
				return reply.code(400).send({error: "La case confirmation nouveau password est vide"});
			}
			console.log("Les champs de mot de passe sont remplis");

			if (newPassword === newPasswordConfirmation){
				const hashedPassword = await bcrypt.hash(newPassword, Number(process.env.SALT_ROUNDS));
				const changePassword = pool.query(
					"UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id",
					[hashedPassword, userData.id]
				);

				if (changePassword.length === 0){
					return reply.code(500).send({error: "Problème de communication avec la base de données"});
				}
				return reply.code(200).send({message: "Le mot de passe a été correctement remplacé"});
			} else {
				return reply.code(400).send({error: "Les mots de passe ne sont pas identiques"});
			}
		} catch (err) {
			console.log(err);
			return reply.code(500).send({error: "Internal Server Error"});
		}
	})

	fastify.post('/avatar', { preHandler: verifyUser }, async (request, reply) => {
		try {
			const userId = request.user.id;
			const data = await request.file();

			if (!data) {
				return reply.code(400).send({ error: "Aucun fichier fourni !"});
			}

			if (!data.mimetype.startsWith('image/')) {
				return reply.code(400).send({ error: "Le fichier doit être de type image"});
			}

			const fileExtension = path.extname(data.filename);
			const fileName = `${userId}_${Date.now()}${fileExtension}`;
			const filePath = path.join(process.cwd(), 'uploads', 'avatars', fileName);

			const buffer = await data.toBuffer();
			fs.writeFileSync(filePath, buffer);

			const avatarUrl = `/uploads/avatars/${fileName}`;

			await pool.query(
				'UPDATE user_settings SET avatar_url = $1 WHERE user_id = $2',
				[avatarUrl, userId]
			);

			return reply.code(200).send({message: "Avatar mis à jour", avatar_url: avatarUrl});
		} catch (err) {
			console.log(err);
			return reply.code(500).send({ error: "Erreur lors de l'upload de l'avatar" });
		}
	});
}

export default userSettingsRoutes;
