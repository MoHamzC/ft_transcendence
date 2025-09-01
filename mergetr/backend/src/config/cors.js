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
            origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Autorise explicitement le frontend
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
            exposedHeaders: ['Set-Cookie']
        });

        fastify.log.info('✅ CORS configured')
    } catch (err) {
        fastify.log.info('⚠️  @fastify/cors not installed — skipping CORS registration')
    }
}
