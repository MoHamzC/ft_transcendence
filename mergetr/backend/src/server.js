import Fastify from 'fastify'
import pool from './config/db.js'
import { initDatabase } from './config/initDb.js'
import { registerCors } from './config/cors.js'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static"
import nodeMailer from "nodemailer";
import multipart from '@fastify/multipart';
import path from "path";
import fs from 'fs';

dotenv.config({ path: '../.env' })

const fastify = Fastify({
	logger: true
})

// Configuration CORS
await registerCors(fastify);

//jwt
fastify.register(fastifyJwt, { secret: process.env.SUPER_SECRET_CODE });

// Ajout du décorateur authenticate pour les routes protégées
fastify.decorate("authenticate", async function(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Invalid token' });
  }
});

fastify.addHook('preHandler', (request, reply, next) => {
	request.jwt = fastify.jwt
	return next();
})

fastify.addHook('onSend', async (request, reply) => {
	reply.header('X-Content-Type-Options', 'nosniff');
	reply.header('X-Frame-Options', 'DENY');
	reply.header('X-XSS-Protection', '1; mode=block');
});

fastify.addHook('preHandler', async (request, reply) => {
	if (request.method === 'POST' || request.method === 'PUT') {
		if (!request.headers['content-type']){
			request.headers['content-type'] = 'application/json';
		}
	}
});

// fastify.options('*', async (request, reply) => {
// 	return reply.code(200).send();
// });

fastify.register(fastifyCookie, { secret: process.env.SUPER_SECRET_CODE, hook: 'preHandler'})

await fastify.register(fastifyStatic, {
	root: path.join(process.cwd(), 'backend', 'uploads'),
	prefix: '/uploads/',
});

await fastify.register(multipart, {
	limits: {
		fileSize: 10 * 1024 * 1024
	}
})

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
fastify.register(import('./routes/health.js'));
fastify.register(import('./routes/auth/oauth/oauth.js'), { prefix: '/auth' });
fastify.register(import('./routes/auth/oauth/googleOauth.js'), { prefix: '/auth'});
fastify.register(import('./routes/auth/oauth/42Oauth.js'), { prefix: '/auth'});
fastify.register(import('./routes/auth/oauth/githubOauth.js'), { prefix: '/auth'});
fastify.register(import('./routes/users/user_route.js'), { prefix: '/api/users' });
fastify.register(import('./routes/users/user_settings.js'), { prefix: '/api/users' });
fastify.register(import('./routes/indexTournament.js'), { prefix: '/api' });
fastify.register(import('./routes/friendsRoutes.js'), { prefix: '/api/user' });

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
