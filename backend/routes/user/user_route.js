import bcrypt from 'bcrypt'
import pool from '../../config/db.js'
import { createUserSchema, createUserResponseSchema } from './user_schema.js'

	async function logout(request, reply) {
		reply.clearCookie('access_token');

		return reply.send({ message: 'Logout successful' });
	}

	async function verifyUser(request, reply) {
		try {
			const token = request.cookies.access_token;
			if (!token) {
				return reply.code(401).send({ error: "You are not connected"})
			}

			const decoded = await request.jwt.verify(token);
			request.user = decoded;
		} catch (err) {
			return reply.code(401).send({ error: "Token invalid or expired" });
		}
	}

	async function login (request, reply){
		const { email, password } = request.body

		const user = await pool.query(
			'Select email, username, password FROM usertest WHERE email = $1',
			[email]
		)
		console.log("Email retrieved from DB!");
		if (user.rows.length === 0)
			return reply.code(400).send({ error: "User doesn't exist"});

		try {
			const isMatch = user && (await bcrypt.compare(password, user.rows[0].password))
			if (!isMatch || !user){
				return reply.code(401).send({ message: "Invalid email or password" })
			}
			const payload = {username: user.rows[0].username, email: user.rows[0].email}

			const token = request.jwt.sign(payload)

			reply.setCookie('access_token', token, { path:'/', httpOnly: true, secure:true })

			return { accessToken: token }
		} catch(err) {
			return reply.code(500).send({ message: "Error server"});
		}
	}

	async function createUser(request, reply) {
		const { email, username, password } = request.body
		if (!email || !username || !password){
				return reply.code(400).send({error: "Tous les champs sont requis pour créer l'utilisateur" })
		}
		const hashedPassword = await bcrypt.hash(password, 10) //Salt round in .env?
		try {

			//Check in DB if the email already exists
			const checkEmailExist = await pool.query(
				'SELECT email from usertest where email = $1',
				[email]
			)
			console.log("Email retrieved from DB!");
			if (checkEmailExist.rows.length !== 0){
				console.log("Email already registered on DB!");
				return reply.code(400).send({message: 'Email already registered'});
			}

			//Insert the user into the DB
			const result = await pool.query(
				'INSERT INTO usertest (email, username, password) VALUES ($1, $2, $3) RETURNING *',
				[email, username, hashedPassword]
			)
			console.log("User created!");

			//create a Response corresponding to the ResponseSchema
			const userResponse = {
				email: result.rows[0].email,
				username: result.rows[0].username,
				password: result.rows[0].password
			}
			reply.code(201).send(userResponse)
		} catch (err) {
			console.log(err);
			reply.code(500).send({ error: "Erreur serveur ou email déjà pris" })
		}
	}

	async function userRoutes(fastify, options) {

	// Test de l'userRoutes
	fastify.get('/', async (request, reply) => {
		reply.send({message: '/ route hit'})
	})

	// Register route
	fastify.post('/register', { schema: { body: createUserSchema, response: { 201: createUserResponseSchema, }, }, },
		createUser,
	)

	fastify.delete('/logout', { preHandler: [verifyUser] }, logout)

	fastify.get('/users', async (request, reply) => {
		try {
			const result = await pool.query('SELECT * FROM users')
			reply.send(result.rows)
	} catch (err) {
			reply.code(500).send({ error: err.message })
		}
	})

	fastify.post('/login', login);

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

export default userRoutes;
