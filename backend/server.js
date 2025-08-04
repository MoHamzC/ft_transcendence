// Import the framework and instantiate it
import Fastify from 'fastify'
import pool from './config/db.js'
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

fastify.register(import('./routes/index.js'))
fastify.register(import('./routes/oauth.js'), { prefix : '/auth' })
fastify.register(import('./routes/user.js'))

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
