async function indexRoutes(fastify, options){
	fastify.get('/', async (request, reply) => {
		return reply.redirect('index.html')
	})
	fastify.get('/api/health', async (request, reply) => {
		return {
			status: 'OK',
			timestamp: new Date().toISOString(),
			message: 'ft_transcendence API is running'
		}
	})
}

export default indexRoutes
