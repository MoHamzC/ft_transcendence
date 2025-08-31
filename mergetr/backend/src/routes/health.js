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
