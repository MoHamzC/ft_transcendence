import pool from '../config/db.js'

async function	authRoutes(fastify, options) {

	fastify.get('/42', async (request, reply) => {
		const authUrl = 'https://api.intra.42.fr/oauth/authorize?' +
			`client_id=${process.env.CLIENT_ID_42}&` +
			`redirect_uri=${process.env.REDIRECT_URI}&` +
			'response_type=code&' +
			'scope=public'

		reply.redirect(authUrl)
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
		const existingUser = await pool.query(
			'SELECT * FROM users WHERE email = $1',
			[userData.email]
		)
		if (existingUser.rows.length > 0) {
			return reply.code(200).send(existingUser.rows[0])
		}
		const result = await pool.query(
			'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
			[userData.login, userData.email, userData.password || 'default_password']
		)
		if (!result) {
			console.error('Erreur pendant l\'ajout des données utilisateur dans la base de données')
			return reply.code(400).send({ error: 'Erreur lors de la création de l\'utilisateur' })
		}
		reply.code(201).send(result.rows[0])
		} catch (err) {
			console.error('❌ Erreur détaillée dans /auth/42/callback:', err.message)
			console.error('❌ Stack trace:', err.stack)
			console.error('❌ Type d\'erreur:', err.name)
			return reply.code(500).send({ error: 'Erreur lors de la connexion' })
		}
	})

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
		const existingUser = await pool.query(
			'SELECT * FROM users WHERE email = $1',
			[userData.email]
		)
		if (existingUser.rows.length > 0) {
			return reply.code(200).send(existingUser.rows[0])
		}
		const result = await pool.query(
			'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
			[userData.login, userData.email, userData.password || 'default_password']
		)
		if (!result) {
			console.error('Erreur pendant l\'ajout des données utilisateur dans la base de données')
			return reply.code(400).send({ error: 'Erreur lors de la création de l\'utilisateur' })
		}
		reply.code(201).send(result.rows[0])
		} catch (err) {
			console.error('❌ Erreur détaillée dans /auth/42/callback:', err.message)
			console.error('❌ Stack trace:', err.stack)
			console.error('❌ Type d\'erreur:', err.name)
			return reply.code(500).send({ error: 'Erreur lors de la connexion' })
		}
	})

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
		if (!userData || !userData.name || !userData.email) {
			return reply.code(400).send({ error: 'Données utilisateur manquantes' })
		}
		const existingUser = await pool.query(
			'SELECT * FROM users WHERE email = $1',
			[userData.email]
		)
		if (existingUser.rows.length > 0) {
			return reply.code(200).send(existingUser.rows[0])
		}
		const result = await pool.query(
			'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
			[userData.name, userData.email, userData.password || 'default_password']
		)
		if (!result) {
			console.error('Erreur pendant l\'ajout des données utilisateur dans la base de données')
			return reply.code(400).send({ error: 'Erreur lors de la création de l\'utilisateur' })
		}
		reply.code(201).send(result.rows[0])
		} catch (err) {
			console.error('❌ Erreur détaillée dans /auth/google/callback:', err.message)
			console.error('❌ Stack trace:', err.stack)
			console.error('❌ Type d\'erreur:', err.name)
			return reply.code(500).send({ error: 'Erreur lors de la connexion' })
		}
	})
}

export default authRoutes
