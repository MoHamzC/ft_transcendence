import brcypt from 'bcrypt'
import pool from '../config/db.js'

async function userRoutes(fastify, options) {
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
}

export default userRoutes
