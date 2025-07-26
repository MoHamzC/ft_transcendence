// Import the framework and instantiate it
import Fastify from 'fastify'

const fastify = Fastify({
	logger: true
})

fastify.get('/', async (request, reply) => {
	return { hello: 'world' }
})

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
