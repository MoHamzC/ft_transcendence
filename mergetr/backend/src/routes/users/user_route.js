import bcrypt from 'bcrypt'
import nodeMailer from 'nodemailer';
import pool from '../../config/db.js'
import { createUserSchema, createUserResponseSchema } from './user_schema.js'
import { generateUniqueUsername, validateUsername } from '../../utils/usernameGenerator.js'

	async function otpAuth(request, reply, email){
		// Generate a 6-digit code
			const code_Otp = Math.floor(100000 + Math.random() * 900000).toString();
			if (!code_Otp){
				console.log("Error code_Otp creation");
				return reply.send({Error: "Internal Servor Error"});
			}
			else
				console.log(code_Otp);

			//Create transporter
			const transporter = nodeMailer.createTransport({
				host: process.env.MAIL_HOST,
				port: 587,
				secure: false,
				auth: {
					user: process.env.MAIL_USER,
					pass: process.env.MAIL_PASS
				},
			});

			if (!transporter){
				console.log("Error transporter");
				return reply.send({Error: "transporter creation failed"});
			};

			console.log("transporter variable successfuly created");

			const otpHtml = (code_Otp) => `
				<div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 32px;">
					<h2 style="color: #4F46E5;">Votre code de vérification</h2>
					<p>Bonjour,</p>
					<p>Voici votre code OTP pour vous connecter à <b>Transcendance 42</b> :</p>
					<div style="font-size: 2em; font-weight: bold; letter-spacing: 4px; color: #16A34A; margin: 24px 0;">
						${code_Otp}
					</div>
					<p>Ce code est valable 5 minutes.</p>
					<p style="color: #888;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.</p>
					<hr style="margin: 32px 0;">
					<small>Transcendance 42 &copy; ${new Date().getFullYear()}</small>
				</div>
			`;

			console.log("otpHtml successfuly created");

		// Send the mail to the user
		try {
			const info = await transporter.sendMail({
					from: `"Transcendance 42" <${process.env.MAIL_USER}>`,
					to: email,
					subject: "Votre code OTP 42 Transcendence",
					html: otpHtml(code_Otp)
				})
			console.log("Message envoyé :", info.messageId);
			} catch(err) {
					console.log(err);
				}

			//Place OTP code and time in DB for the user
			const otp_Creation_Time = new Date().toISOString();
			console.log(otp_Creation_Time);

			const place_Otp_Db = await pool.query(
				'UPDATE users SET otp_code = $1, otp_generated_at = $2 WHERE email = $3',
				[code_Otp, otp_Creation_Time, email]
			);
			if (!place_Otp_Db){
				console.log("Error d'insert dans DB");
				return reply.code(400).send({Error: "DB"});
			}
			console.log("Information about OTP correctly placed in DB!");
			return reply.send({ "step": "otp", "message": "Un code OTP a été envoyé à votre email." });
	}

	async function logout(request, reply) {
		reply.clearCookie('access_token');
		return reply.code(200).redirect('http://localhost:5173');
	}

	async function verifyUser(request, reply) {
		try {
			const token = request.cookies.access_token;
			console.log('Token reçu:', token);

			if (!token) {
				return reply.code(401).send({ error: "You are not connected"});
			}

			const decoded = await request.jwt.verify(token);
			console.log('Token décodé:', decoded);
			request.user = decoded;
		} catch (err) {
			console.log('Erreur dans verifyUser:', err);
			return reply.code(500).send(err);
		}
	}

	async function login (request, reply){
		const { email, password } = request.body

		const user = await pool.query(
			'Select id, email, username, password_hash FROM users WHERE email = $1',
			[email]
		)
		console.log("Email retrieved from DB!");
		if (user.rows.length === 0)
			return reply.code(400).send({ error: "User doesn't exist"});

		try {
			const isMatch = user && (await bcrypt.compare(password, user.rows[0].password_hash))
			if (!isMatch || !user){
				return reply.code(401).send({ message: "Invalid email or password" })
			}
			console.log("Password match!");


			//check if user has activated 2FA
			const check2FA = await pool.query(
				'SELECT two_factor_enabled FROM user_settings WHERE user_id = $1',
				[user.rows[0].id]
			)

			if (!check2FA || check2FA.rows.length === 0){
				console.log("La variable check2FA est vide, check DB");
				return reply.code(500).send({error: "Erreur interne serveur"})
			}

			console.log(check2FA.rows[0].two_factor_enabled)
			if (check2FA.rows[0].two_factor_enabled){
				return otpAuth(request, reply, email);
			}

			// Create JWT token
			const payload = {id: user.rows[0].id, username: user.rows[0].username, email: email}
			console.log(payload);
			const token = request.jwt.sign(payload)
			reply.setCookie('access_token', token, { path:'/', httpOnly: true, secure:false })
			return reply.code(200).send({ message: "Login successful", username: user.rows[0].username });
		} catch(err) {
			console.log(err);
			return reply.code(500).send({ message: "Error server"});
		}
	}

	async function createUser(request, reply) {
		const { email, username, password } = request.body
		if (!email || !username || !password){
				return reply.code(400).send({error: "Tous les champs sont requis pour créer l'utilisateur" })
		}

		// Valider le username
		const validation = validateUsername(username);
		if (!validation.isValid) {
			return reply.code(400).send({ error: validation.error });
		}

		const hashedPassword = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS));
		try {

			//Check in DB if the email already exists
			const checkEmailExist = await pool.query(
				'SELECT email from users where email = $1',
				[email]
			)
			console.log("Email retrieved from DB!");

			if (checkEmailExist.rows.length !== 0){
				console.log("Email already registered on DB!");
				return reply.code(409).send({message: 'Email already registered'});
			}

			// Générer un username unique
			const uniqueUsername = await generateUniqueUsername(username);

		//Insert the user into the DB
		const result = await pool.query(
			'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING *',
			[email, uniqueUsername, hashedPassword]
		)
		console.log("User created!");

		// Créer les paramètres utilisateur avec l'avatar par défaut
		await pool.query(
			'INSERT INTO user_settings (user_id, avatar_url) VALUES ($1, $2)',
			[result.rows[0].id, '/uploads/avatars/default_avatar.jpg']
		)
		console.log("✅ Avatar par défaut assigné lors de l'inscription");			//create a Response corresponding to the ResponseSchema
			const userResponse = {
				email: result.rows[0].email,
				username: result.rows[0].username,
				password: result.rows[0].password_hash
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

	fastify.delete('/logout', { preHandler: verifyUser }, logout)
	fastify.get('/logout', logout);

	fastify.get('/users', async (request, reply) => {
		try {
			const result = await pool.query('SELECT * FROM users')
			return reply.send(result.rows)
	} catch (err) {
			return reply.code(500).send({ error: err.message })
		}
	})

	fastify.get('/protected', {preHandler: verifyUser}, async (request, reply) => {
		return reply.code(200).send({showLogin: true});
	});

	fastify.post('/login', login)

	fastify.post('/verify-otp', async (request, reply) => {
		try {
			const { email, otp_Code } = request.body;
			const result = await pool.query('SELECT id, otp_code, otp_generated_at, username from users WHERE email = $1',
				[email]
			)

			if (!email || !otp_Code){
				console.log("Wrong user information");
				return reply.code(400).send({Message: "Wrong user information sent"});
			};
			if (!result){
				console.log("Can't retrieve information from DB");
				return reply.code(401).send({Error: "Database"});
			};

			if (otp_Code != result.rows[0].otp_code){
				console.log("OTP code are not the same");
				return reply.send("Wrong OTP code!");
			}

			if ((Date.now() - new Date(result.rows[0].otp_generated_at).getTime()) >= 5 * 60 * 1000){
				console.log("OTP code expired");
				const delete_Otp = await pool.query(
					'UPDATE users SET otp_code = NULL, otp_generated_at = NULL WHERE email = $1',
					[email]
				)
				return reply.code(400).send({Message: "OTP code expired, please try to login again"});
			};

			console.log("OTP code correct! Giving client a JWT Token");
			const delete_Otp = await pool.query(
				'UPDATE users SET otp_code = NULL, otp_generated_at = NULL WHERE email = $1',
				[email]
			)

			// Create JWT token
			const payload = {id: result.rows[0].id, username: result.rows[0].username, email: email}
			const token = request.jwt.sign(payload)
			reply.setCookie('access_token', token, { path:'/', httpOnly: true, secure:false })
			return reply.code(200).send({ message: "OTP verification successful", username: result.rows[0].username });
		} catch(err) {
			console.log(err);
			return reply.code(500).send({Error: "Internal Server Error"});
		}
	});

	fastify.post('/connect', async (req, reply) => {
		const { email, password } = req.body
		if (!email || !password){
			return reply.code(400).send({error: "Veuillez remplir tout les champs"})
		}

		try {
		const resultPassword = await pool.query(
			'SELECT password_hash from users WHERE email = $1',
			[email]
		)

		if (resultPassword.rows.length === 0) {
			return reply.code(400).send({ error: "Utilisateur non trouvé" })
		}

		const hashedPassword = resultPassword.rows[0].password_hash

		const isValid = await bcrypt.compare(password, hashedPassword)
		if (isValid){
			return reply.code(200).send("Tu t'es connecté!")
		}
		else
			return reply.code(400).send({error: "Mauvais mot de passe"})
	} catch (err) {
			return reply.code(500).send({ error: "Erreur serveur" })
		}
	})
}

export default userRoutes;
export { verifyUser };
