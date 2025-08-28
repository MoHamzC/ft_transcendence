import pool from '../../../config/db.js'
import { jwtTokenOauth } from './oauth.js';
import { generateUniqueUsername } from '../../../utils/usernameGenerator.js';

async function linkGoogleAccount(user, googleUserData){
	const addGoogleDataInDb = await pool.query(
		'UPDATE users SET google_id = $1 WHERE id = $2',
		[googleUserData.id, user.rows[0].id]
	)

	// Vérifier s'il y a déjà un avatar avant de le remplacer
	if (googleUserData.picture) {
		const currentAvatar = await pool.query(
			'SELECT avatar_url FROM user_settings WHERE user_id = $1',
			[user.rows[0].id]
		);

		// Ne mettre à jour que s'il n'y a pas d'avatar ou si c'est l'avatar par défaut
		if (currentAvatar.rows.length === 0 ||
			!currentAvatar.rows[0].avatar_url ||
			currentAvatar.rows[0].avatar_url === '/uploads/avatars/default_avatar.svg') {
			await pool.query(
				'UPDATE user_settings SET avatar_url = $1 WHERE user_id = $2',
				[googleUserData.picture, user.rows[0].id]
			)
			console.log('✅ Avatar Google ajouté pour utilisateur existant (remplace avatar par défaut)');
		} else {
			console.log('ℹ️  Avatar personnalisé existant conservé, Google non appliqué');
		}
	}
}

async function handleGoogleLogin(request, reply, googleUserData){

	const existingUser = await pool.query(
		'SELECT * FROM users WHERE email = $1',
		[googleUserData.email]
	)

	//Si utilisateur existant
	if (existingUser && existingUser.rows.length > 0){
		if (!existingUser.rows[0].google_id){
			//Si le compte Google n'est pas lié
			console.log("L'utilisateur a déjà un compte mais son compte google n'est pas lié, liaison de son compte google à son compte principal!");
			await linkGoogleAccount(existingUser, googleUserData);

			// Vérifier si user_settings existe pour cet utilisateur
			const settingsCheck = await pool.query(
				'SELECT id FROM user_settings WHERE user_id = $1',
				[existingUser.rows[0].id]
			);

			// Créer user_settings si n'existe pas
			if (settingsCheck.rows.length === 0) {
				await pool.query(
					'INSERT INTO user_settings (user_id) VALUES ($1)',
					[existingUser.rows[0].id]
				);
				console.log('✅ user_settings créé pour utilisateur existant');
			}

			const result = await pool.query(
				'SELECT providers FROM users WHERE id = $1',
				[existingUser.rows[0].id]
			)

			if (!result) {
				console.error('Erreur pendant l\'ajout des données utilisateur dans la base de données')
				return reply.code(400).send({ error: 'Erreur lors de la création de l\'utilisateur' })
			}

			if (!result.rows[0].providers){
				const addProvider = await pool.query (
					"UPDATE users SET providers = COALESCE(providers, ARRAY[]::text[]) || ARRAY['google'] WHERE id = $1",
					[existingUser.rows[0].id]
				)
			}
			else{
				const currentProviders = result.rows[0].providers || [];
				if (!currentProviders.includes('google')) {
					const addProvider = await pool.query(
						"UPDATE users SET providers = array_append(providers, 'google') WHERE id = $1",
						[existingUser.rows[0].id]
					)
					console.log("✅ Google ajouté en tant que provider")
				}
			}
		}
		const dbUser = existingUser.rows[0];
		return jwtTokenOauth(request, reply, dbUser);
	}

	//Si utilisateur pas existant
	console.log("L'utilisateur n'existe pas, création de l'utilisateur");

	// Générer un username unique basé sur le nom Google
	const uniqueUsername = await generateUniqueUsername(googleUserData.name);

	const result = await pool.query(
		'INSERT INTO users (username, email, google_id) VALUES ($1, $2, $3) RETURNING *',
		[uniqueUsername, googleUserData.email, googleUserData.id]
	)

	if (!result) {
		console.error('Erreur pendant l\'ajout des données utilisateur dans la base de données')
		return reply.code(400).send({ error: 'Erreur lors de la création de l\'utilisateur' })
	}

	if (!result.rows[0].providers){
		const addProvider = await pool.query (
			'UPDATE users SET providers = COALESCE(providers, ARRAY[]::text[]) || ARRAY[\'google\'] WHERE id = $1',
			[result.rows[0].id]
		)
	}

	// Créer les paramètres utilisateur
	await pool.query(
		'INSERT INTO user_settings (user_id) VALUES ($1)',
		[result.rows[0].id]
	)

	// Ajouter l'avatar Google dans user_settings si disponible
	if (googleUserData.picture) {
		await pool.query(
			'UPDATE user_settings SET avatar_url = $1 WHERE user_id = $2',
			[googleUserData.picture, result.rows[0].id]
		)
		console.log('✅ Avatar Google ajouté pour nouvel utilisateur');
	}

	return jwtTokenOauth(request, reply, result.rows[0]);
}

async function	oauthGoogleRoutes(fastify, options){
	// Google OAuth 2.0
	fastify.get('/google', async (request, reply) => {
		const authUrl = 'https://accounts.google.com/o/oauth2/auth?' +
			`client_id=${process.env.GOOGLE_CLIENT_ID}&` +
			`redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&` +
			'response_type=code&' +
			'scope=email profile'

		reply.redirect(authUrl)
	})

	fastify.get('/google/callback', async (request, reply) => {
		const { code, error } = request.query
		if (!code) {
			return reply.code(400).send({ error: 'Code manquant' })
		}
		if (error) {
			return reply.code(400).send({ error: 'Autorisation refusée' })
		}
		try {
			const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				grant_type: 'authorization_code',
				code: code,
				client_id: process.env.GOOGLE_CLIENT_ID,
				client_secret: process.env.GOOGLE_CLIENT_SECRET,
				redirect_uri: process.env.GOOGLE_REDIRECT_URI
			})
		})
		if (!tokenResponse.ok) {
			const errorData = await tokenResponse.json()
			console.error('Erreur token:', errorData)
			return reply.code(400).send({ error: 'Erreur lors de la récupération du token' })
		}
		const { access_token } = await tokenResponse.json()
		if (!access_token) {
			return reply.code(400).send({ error : 'Token d\'accès manquant' })
		}
		const userResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
				headers: {
					Authorization: `Bearer ${access_token}`,
					'User-Agent': 'ft_transcendence'
				}
			})
		if (!userResponse.ok) {
			const errorData = await userResponse.json()
			console.error('Erreur utilisateur:', errorData)
			return reply.code(400).send({ error: 'Erreur lors de la récupération des données utilisateur' })
		}
		const userData = await userResponse.json()
		if (!userData || !userData.name || !userData.email || !userData.id) {
			return reply.code(400).send({ error: 'Données utilisateur manquantes' })
		}

		return handleGoogleLogin(request, reply, userData);

		} catch (err) {
			console.error('❌ Erreur détaillée dans /auth/google/callback:', err.message)
			console.error('❌ Stack trace:', err.stack)
			console.error('❌ Type d\'erreur:', err.name)
			return reply.code(500).send({ error: 'Erreur lors de la connexion' })
		}
	})
}

export default oauthGoogleRoutes
