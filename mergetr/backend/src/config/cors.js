// src/config/cors.js
// Configuration CORS

/**
 * Configure CORS for the application
 * @param {Object} fastify - Instance Fastify
 */
export async function registerCors(fastify) {
    try {
        const { default: fastifyCors } = await import('@fastify/cors')

        await fastify.register(fastifyCors, {
            origin: true,
            credentials: true
        })

        fastify.log.info('✅ CORS configured')
    } catch (err) {
        fastify.log.info('⚠️  @fastify/cors not installed — skipping CORS registration')
    }
}
