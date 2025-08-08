// Import the framework and instantiate it
import Fastify from 'fastify'
import pool from './config/db.js'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";

dotenv.config({ path: '../.env' })

const fastify = Fastify({
	logger: true
})

//jwt
fastify.register(fastifyJwt, { secret: process.env.SUPER_SECRET_CODE });

fastify.addHook('preHandler', (request, reply, next) => {
	request.jwt = fastify.jwt
	return next();
})

fastify.register(fastifyCookie, { secret: process.env.SUPER_SECRET_CODE, hook: 'preHandler'})

pool.query('SELECT NOW()', (err, res) => {
	if (err) {
		console.error('❌ Erreur de connexion à la DB:', err.message)
	} else {
	console.log('✅ Connecté à la DB — Heure actuelle:', res.rows[0].now)
	}
})

// Import des routes

fastify.register(import('./routes/index.js'))
fastify.register(import('./routes/oauth.js'), { prefix : '/auth' })
fastify.register(import('./routes/user/user_route.js'), { prefix : 'api/users'})

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
