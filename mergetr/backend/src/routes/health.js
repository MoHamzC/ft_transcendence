import { testDatabaseConnection } from '../config/db.js'

async function indexRoutes(fastify, options){
	// Route racine
	fastify.get('/', async (request, reply) => {
		reply.send({
			message: 'Welcome to ft_transcendence API',
			version: '1.0.0',
			status: 'running',
			timestamp: new Date().toISOString(),
			available_endpoints: {
				health: '/healthz',
				database_health: '/healthz/database',
				auth: '/api/auth',
				users: '/api/users',
				vault: '/api/vault',
				gdpr: '/api/gdpr',
				oauth: '/auth'
			}
		});
	});

	fastify.get('/healthcheck', async (request, reply) => {
		reply.send ({
			status: 'OK',
			timestamp: new Date().toISOString(),
			message: 'ft_transcendence API is running'
		});
	})

	// Route de santé de la base de données
	fastify.get('/healthz/database', async (request, reply) => {
		try {
			const dbHealth = await testDatabaseConnection()

			if (dbHealth.status === 'healthy') {
				return reply.send({
					status: 'healthy',
					database: 'connected',
					timestamp: new Date().toISOString(),
					data: dbHealth.data
				})
			} else {
				return reply.code(503).send({
					status: 'unhealthy',
					database: 'disconnected',
					error: dbHealth.error,
					timestamp: new Date().toISOString()
				})
			}
		} catch (error) {
			return reply.code(503).send({
				status: 'error',
				database: 'error',
				error: error.message,
				timestamp: new Date().toISOString()
			})
		}
	})

	// Route de santé générale
	fastify.get('/healthz', async (request, reply) => {
		try {
			const dbHealth = await testDatabaseConnection()

			const healthStatus = {
				status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
				timestamp: new Date().toISOString(),
				services: {
					api: 'healthy',
					database: dbHealth.status
				}
			}

			if (dbHealth.status === 'healthy') {
				return reply.send(healthStatus)
			} else {
				return reply.code(503).send({
					...healthStatus,
					error: dbHealth.error
				})
			}
		} catch (error) {
			return reply.code(503).send({
				status: 'error',
				timestamp: new Date().toISOString(),
				services: {
					api: 'healthy',
					database: 'error'
				},
				error: error.message
			})
		}
	})

	//graceful shutdown
	const listeners = ['SIGINT', 'SIGTERM']
	listeners.forEach((signal) => {
		process.on(signal, async () => {
			await fastify.close();
			console.log("Server closed properly!");
			process.exit(0);
		})
	})
}

export default indexRoutes
