import Fastify from 'fastify'
import pool from './config/db.js'
import { initDatabase } from './config/initDb.js'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import nodeMailer from "nodemailer";

dotenv.config({ path: '../.env' })

const fastify = Fastify({
	logger: true
})

//jwt
fastify.register(fastifyJwt, { secret: process.env.SUPER_SECRET_CODE });

// Ajout du décorateur authenticate pour les routes protégées
fastify.decorate("authenticate", async function(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

fastify.addHook('preHandler', (request, reply, next) => {
	request.jwt = fastify.jwt
	return next();
})

fastify.register(fastifyCookie, { secret: process.env.SUPER_SECRET_CODE, hook: 'preHandler'})

// Initialisation de la base de données
const initDB = async () => {
	try {
		// Test de connexion
		const res = await pool.query('SELECT NOW()');
		console.log('✅ Connecté à la DB — Heure actuelle:', res.rows[0].now);

		// Initialiser les tables (supprime et recrée tout)
		if (process.env.RESET_DB === 'true') {
			await initDatabase();
		}
	} catch (err) {
		console.error('❌ Erreur de connexion à la DB:', err.message);
		process.exit(1);
	}
};

await initDB();

// Import des routes
fastify.register(import('./routes/index.js'));
fastify.register(import('./routes/auth.route.js'), { prefix: '/api/auth' });
fastify.register(import('./routes/oauth.js'), { prefix: '/api/auth' });
fastify.register(import('./routes/user.route.js'), { prefix: '/api/user' })

// Run the server!
const start = async () => {
	try {
		await fastify.listen({port : 5001, host : '0.0.0.0'});
		console.log("Server listening on 0.0.0.0:5001");
	} catch (err) {
		fastify.log.error(err);
		console.log("Error: Can't start the server");
		process.exit(1);
	}
}
start()
