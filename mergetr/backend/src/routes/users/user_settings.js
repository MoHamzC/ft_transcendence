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
		const {
			avatar_url,
			two_factor_enabled,
			language,
			add_friend,
			profile_private,
			pong_color,
			pong_skin_type
		} = request.body;

		try {
			// D'abord, vérifier si l'utilisateur a déjà des paramètres
			const existingSettings = await pool.query(
				'SELECT user_id FROM user_settings WHERE user_id = $1',
				[userId]
			);

			let result;
			if (existingSettings.rows.length === 0) {
				// Créer les paramètres pour la première fois
				result = await pool.query(
					`INSERT INTO user_settings (user_id, two_factor_enabled, language, add_friend, profile_private, pong_color, pong_skin_type, avatar_url)
					VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
					[userId, two_factor_enabled, language, add_friend, profile_private, pong_color, pong_skin_type, avatar_url]
				);
				console.log('Settings créés pour user:', userId);
			} else {
				// Mettre à jour les paramètres existants
				result = await pool.query(
					`UPDATE user_settings SET
					avatar_url = COALESCE($1, avatar_url),
					two_factor_enabled = COALESCE($2, two_factor_enabled),
					language = COALESCE($3, language),
					add_friend = COALESCE($4, add_friend),
					profile_private = COALESCE($5, profile_private),
					pong_color = COALESCE($7, pong_color),
					pong_skin_type = COALESCE($8, pong_skin_type)
					WHERE user_id = $6 RETURNING *`,
					[avatar_url, two_factor_enabled, language, add_friend, profile_private, userId, pong_color, pong_skin_type]
				);
				console.log('Settings mis à jour pour user:', userId);
			}

			console.log(result.rows[0]);
			return reply.code(200).send({
				message: "Les paramètres ont été mis à jour !",
				settings: result.rows[0]
			});
		} catch (err) {
			console.error('Erreur mise à jour settings:', err);
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

	fastify.get('/avatar', { preHandler: verifyUser }, async (request, reply) => {
		try {
			const user = request.user;

			if (!user) {
				return reply.code(400).send({error: "erreur lors da la récupération de l'identifiant utilisateur"});
			}

			const avatarUrl = await pool.query(
				'SELECT avatar_url FROM user_settings WHERE user_id = $1',
				[user.id]
			)

			if (!avatarUrl || !avatarUrl.rows.length > 0) {
				return reply.code(400).send("error DB pour avatar url");
			}

			console.log(avatarUrl.rows[0].avatar_url);

			return reply.code(200).send(avatarUrl.rows[0].avatar_url);

		} catch (err) {
			console.log(err);
			return reply.code(500).send("Error Server");
		}
	});

	fastify.post('/avatar', { preHandler: verifyUser }, async (request, reply) => {
		try {
			const userId = request.user.id;
			const data = await request.file();
			console.log(request.file);

			if (!data) {
				return reply.code(400).send({ error: "Aucun fichier fourni !"});
			}

			if (!data.mimetype.startsWith('image/')) {
				return reply.code(400).send({ error: "Le fichier doit être de type image"});
			}

		// Créer le dossier s'il n'existe pas
		const uploadDir = path.join(process.cwd(), 'backend', 'uploads', 'avatars');
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}

		const fileExtension = path.extname(data.filename);
		const fileName = `${userId}_${Date.now()}${fileExtension}`;
		const filePath = path.join(uploadDir, fileName);

		console.log('📂 Dossier upload:', uploadDir);
		console.log('📁 Fichier complet:', filePath);
		console.log("-------------------");

		const buffer = await data.toBuffer();
		fs.writeFileSync(filePath, buffer);

		// Vérifier que le fichier a bien été créé
		if (fs.existsSync(filePath)) {
			console.log('✅ Fichier créé avec succès');
		} else {
			throw new Error('Le fichier n\'a pas été créé');
		}

		const avatarUrl = `/uploads/avatars/${fileName}`;

		await pool.query(
			'UPDATE user_settings SET avatar_url = $1 WHERE user_id = $2',
			[avatarUrl, userId]
		);

		return reply.code(201).send({message: "Avatar mis à jour", avatar_url: avatarUrl});
	} catch (err) {
		console.log(err);
		return reply.code(500).send({ error: "Erreur lors de l'upload de l'avatar" });
	}
})

	// Route pour récupérer tous les paramètres utilisateur
	fastify.get('/user-settings', { preHandler: verifyUser }, async (request, reply) => {
		try {
			const userId = request.user.id;

			const result = await pool.query(
				'SELECT * FROM user_settings WHERE user_id = $1',
				[userId]
			);

			if (!result.rows[0]) {
				// Créer des paramètres par défaut s'ils n'existent pas
				const defaultSettings = await pool.query(
					`INSERT INTO user_settings (user_id, two_factor_enabled, language, add_friend, profile_private)
					VALUES ($1, false, 'en', true, false) RETURNING *`,
					[userId]
				);
				
				return reply.code(200).send({
					message: "Paramètres par défaut créés",
					settings: defaultSettings.rows[0]
				});
			}

			return reply.code(200).send({
				message: "Paramètres récupérés avec succès",
				settings: result.rows[0]
			});
		} catch (err) {
			console.error('Erreur récupération settings:', err);
			return reply.code(500).send({ error: "Erreur lors de la récupération des paramètres" });
		}
	});

	// Route de test pour vérifier la configuration
	fastify.get('/test-upload', async (request, reply) => {
		try {
			const uploadDir = path.join(process.cwd(), 'backend', 'uploads', 'avatars');
			const staticRoot = path.join(process.cwd(), 'backend', 'uploads');

			console.log('📂 Upload directory:', uploadDir);
			console.log('📂 Static root:', staticRoot);
			console.log('📂 Working directory:', process.cwd());

			// Lister les fichiers dans le dossier s'il existe
			const files = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [];

			return reply.send({
				workingDir: process.cwd(),
				uploadDir,
				staticRoot,
				filesInUploadDir: files,
				message: 'Configuration OK - les fichiers seront accessibles via /uploads/'
			});
		} catch (err) {
			return reply.code(500).send({ error: err.message });
		}
	})
}

export default userSettingsRoutes;
