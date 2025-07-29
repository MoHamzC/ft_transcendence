// Import the framework and instantiate it
import Fastify from 'fastify'
import pool from './db.js'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

const fastify = Fastify({
	logger: true
})

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erreur de connexion à la DB:', err.message)
  } else {
    console.log('✅ Connecté à la DB — Heure actuelle:', res.rows[0].now)
  }
})

fastify.get('/users', async (req, reply) => {
	try {
    const result = await pool.query('SELECT * FROM users')
    reply.send(result.rows)
} catch (err) {
    reply.code(500).send({ error: err.message })
  }
})

fastify.post('/users', async (req, reply) => {
  const { name, email, password } = req.body
  if (!name || !email || !password){
      return reply.code(400).send({error: "Tous les champs sont requis pour créer l'utilisateur" })
  }
  const hashedPassword = await bcrypt.hash(password, 10)
  try {
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
      [name, email, hashedPassword]
    )
    reply.code(201).send(result.rows[0])
  } catch (err) {
    reply.code(500).send({ error: "Erreur serveur ou email déjà pris" })
  }
})

fastify.post('/connect', async (req, reply) => {
  const { email, password } = req.body
  if (!email || !password){
    return reply.code(400).send({error: "Veuillez remplir tout les champs"})
  }

  try {
  const resultPassword = await pool.query(
    'SELECT password from users WHERE email = $1',
    [email]
  )

  if (resultPassword.rows.length === 0) {
    return reply.code(400).send({ error: "Utilisateur non trouvé" })
  }

  const hashedPassword = resultPassword.rows[0].password

  const isValid = await bcrypt.compare(password, hashedPassword)
  if (isValid){
    return reply.code(200).send("Tu t'es connecté!")
  }
  else
    return reply.code(400).send({error: "Mauvais mot de passe"})
} catch (err) {
    reply.code(500).send({ error: "Erreur serveur" })
  }
})

fastify.get('/', async (request, reply) => {
	return { hello: 'world' }
})

fastify.get('/auth/42', async (request, reply) => {
  const authUrl = 'https://api.intra.42.fr/oauth/authorize?' +
    `client_id=${process.env.CLIENT_ID_42}&` +
    `redirect_uri=${process.env.REDIRECT_URI}&` +
    'response_type=code&' +
    'scope=public'

  reply.redirect(authUrl)
})

fastify.get('/auth/42/callback', async (request, reply) => {
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
      client_id: 'u-s4t2ud-7b8d69f34adc53cab0982f85dfdaf3dc3c3f2973ace351bee0a5ffd4aa7d3164',
      client_secret: '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',
      redirect_uri: 'http://localhost:5001/auth/42/callback'
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

fastify.get('/auth/github', async (request, reply) => {
  const authUrl = 'https://github.com/login/oauth/authorize?' +
    `client_id=${process.env.GITHUB_CLIENT_ID}&` +
    `redirect_uri=${process.env.GITHUB_REDIRECT_URI}&` +
    'response_type=code&' +
    'scope=public'

  reply.redirect(authUrl)
})

fastify.get('/auth/github/callback', async (request, reply) => {
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
      client_id: 'Ov23liZLU2czn5z65zLJ',
      client_secret: 'e8bb68c68f3847871294f4117bdb7c7109801737',
      redirect_uri: 'http://localhost:5001/auth/github/callback'
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

// Run the server!
const start = async () => {
	try {
		await fastify.listen({port : 5001, host : '0.0.0.0'})
	} catch (err) {
		fastify.log.error(err)
		process.exit(1)
	}
}
start()
