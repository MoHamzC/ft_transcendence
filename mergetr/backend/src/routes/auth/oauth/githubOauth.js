import pool from '../../../config/db.js'
import { jwtTokenOauth } from './oauth.js';

async function linkGithubAccount(user, githubUserData){
	const addGithubDataInDb = await pool.query(
		'UPDATE users SET github_id = $1 WHERE id = $2',
		[githubUserData.id, user.rows[0].id]
	)
}

async function handleGithubLogin(request, reply, githubUserData){

	const existingUser = await pool.query(
		'SELECT * FROM users WHERE email = $1',
		[githubUserData.email]
	)

	//Si utilisateur existant
	if (existingUser && existingUser.rows.length > 0){
		if (!existingUser.rows[0].github_id){
			//Si le compte github n'est pas lié
			console.log("L'utilisateur a déjà un compte mais son compte github n'est pas lié, liaison de son compte github à son compte principal!");
			await linkGithubAccount(existingUser, githubUserData);
		}
		const dbUser = existingUser.rows[0];
		return jwtTokenOauth(request, reply, dbUser);
	}

	//Si utilisateur pas existant
	console.log("L'utilisateur n'existe pas, création de l'utilisateur");

	const result = await pool.query(
		'INSERT INTO users (username, email, github_id) VALUES ($1, $2, $3) RETURNING *',
		[githubUserData.login, githubUserData.email, githubUserData.id]
	)

	if (!result) {
		console.error('Erreur pendant l\'ajout des données utilisateur dans la base de données')
		return reply.code(400).send({ error: 'Erreur lors de la création de l\'utilisateur' })
	}

	if (!result.rows[0].providers){
		const addProvider = await pool.query (
			'UPDATE users SET providers = COALESCE(providers, ARRAY[]::text[]) || "github" WHERE id = $1',
			[result.rows[0].id]
		)
	}

	const addProvider = await pool.query(
		"UPDATE users SET providers = array_append(providers, 'github') WHERE id = $1",
		[result.rows[0].id]
	)

	jwtTokenOauth(request, reply, githubUserData);
}

async function oauthGithubRoutes (fastify, options){
	//github OAuth 2.0

	fastify.get('/github', async (request, reply) => {
		const authUrl = 'https://github.com/login/oauth/authorize?' +
			`client_id=${process.env.GITHUB_CLIENT_ID}&` +
			`redirect_uri=${process.env.GITHUB_REDIRECT_URI}&` +
			'response_type=code&' +
			'scope=public'

		reply.redirect(authUrl)
	})

	fastify.get('/github/callback', async (request, reply) => {
		const { code, error } = request.query
		if (!code) {
			return reply.code(400).send({ error: 'Code manquant' })
		}
		if (error) {
			return reply.code(400).send({ error: 'Autorisation refusée' })
		}
		try {
			const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: JSON.stringify({
				grant_type: 'authorization_code',
				code: code,
				client_id: process.env.GITHUB_CLIENT_ID,
				client_secret: process.env.GITHUB_CLIENT_SECRET,
				redirect_uri: process.env.GITHUB_REDIRECT_URI
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
		const userResponse = await fetch('https://api.github.com/user', {
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

		if (!userData || !userData.login || !userData.email) {
			return reply.code(400).send({ error: 'Données utilisateur manquantes' })
		}

		return handleGithubLogin(request, reply, userData);

		} catch (err) {
			console.error('❌ Erreur détaillée dans /auth/42/callback:', err.message)
			console.error('❌ Stack trace:', err.stack)
			console.error('❌ Type d\'erreur:', err.name)
			return reply.code(500).send({ error: 'Erreur lors de la connexion' })
		}
	})
}

export default oauthGithubRoutes
