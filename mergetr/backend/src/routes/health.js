async function indexRoutes(fastify, options){
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
