import pool from '../../../config/db.js'
import { jwtTokenOauth } from './oauth.js';

async function linkFtAccount(user, ftUserData){
	const addFtDataInDb = await pool.query(
		'UPDATE users SET intra42_id = $1 WHERE id = $2',
		[ftUserData.id, user.rows[0].id]
	)
}

async function handleFtLogin(request, reply, ftUserData){

	const existingUser = await pool.query(
		'SELECT * FROM users WHERE email = $1',
		[ftUserData.email]
	)

	//Si utilisateur existant
	if (existingUser && existingUser.rows.length > 0){
		if (!existingUser.rows[0].intra42_id){
			//Si le compte Ft n'est pas lié
			console.log("L'utilisateur a déjà un compte mais son compte ft n'est pas lié, liaison de son compte ft à son compte principal!");
			await linkFtAccount(existingUser, ftUserData);
		}
		const dbUser = existingUser.rows[0];
		return jwtTokenOauth(request, reply, dbUser);
	}

	//Si utilisateur pas existant
	console.log("L'utilisateur n'existe pas, création de l'utilisateur");

	const result = await pool.query(
		'INSERT INTO users (username, email, intra42_id) VALUES ($1, $2, $3) RETURNING *',
		[ftUserData.login, ftUserData.email, ftUserData.id]
	)

	if (!result) {
		console.error('Erreur pendant l\'ajout des données utilisateur dans la base de données')
		return reply.code(400).send({ error: 'Erreur lors de la création de l\'utilisateur' })
	}

	if (!result.rows[0].providers){
		const addProvider = await pool.query (
			'UPDATE users SET providers = COALESCE(providers, ARRAY[]::text[]) || "42" WHERE id = $1',
			[result.rows[0].id]
		)
	}

	const addProvider = await pool.query(
		"UPDATE users SET providers = array_append(providers, '42') WHERE id = $1",
		[result.rows[0].id]
	)

	jwtTokenOauth(request, reply, ftUserData);
}

async function oauth42Routes(fastify, options){

	fastify.get('/42', async (request, reply) => {
		const authUrl = 'https://api.intra.42.fr/oauth/authorize?' +
		`client_id=${process.env.CLIENT_ID_42}&` +
		`redirect_uri=${process.env.REDIRECT_URI}&` +
		'response_type=code&' +
		'scope=public'

		reply.code(302).redirect(authUrl)
	})

	fastify.get('/42/callback', async (request, reply) => {
		const { code, error } = request.query
		if (!code) {
			return reply.code(400).send({ error: 'Code manquant' })
		}
		if (error) {
			return reply.code(400).send({ error: 'Autorisation refusée' })
		}
		try {
			const tokenResponse = await fetch('https://api.intra.42.fr/oauth/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				grant_type: 'authorization_code',
				code: code,
				client_id: process.env.CLIENT_ID_42,
				client_secret: process.env.CLIENT_SECRET_42,
				redirect_uri: process.env.REDIRECT_URI
			})
		})
		if (!tokenResponse.ok) {
			const errorData = await tokenResponse.json()
			console.error('Erreur token:', errorData)
			return reply.code(400).send({ error: 'Erreur lors de la récupération du token' })
		}
		const { access_token } = await tokenResponse.json()
		if (!access_token) {
			return reply.code(400).send({ error: 'Token d\'accès manquant' })
		}
		const userResponse = await fetch('https://api.intra.42.fr/v2/me', {
				headers: {
					Authorization: `Bearer ${access_token}`
				}
			})
		if (!userResponse.ok) {
			const errorData = await userResponse.json()
			console.error('Erreur utilisateur:', errorData)
			return reply.code(400).send({ error: 'Erreur lors de la récupération des données utilisateur' })
		}
		const userData = await userResponse.json()
		if (!userData || !userData.login || !userData.email) {
			return reply.code(400).send({ error: 'Données utilisateur manquantes' })
		}

		return handleFtLogin(request, reply, userData);

		} catch (err) {
			console.error('❌ Erreur détaillée dans /auth/42/callback:', err.message)
			console.error('❌ Stack trace:', err.stack)
			console.error('❌ Type d\'erreur:', err.name)
			return reply.code(500).send({ error: 'Erreur lors de la connexion' })
		}
	})
}

export default oauth42Routes
