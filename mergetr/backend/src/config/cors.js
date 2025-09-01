// src/config/cors.js
// Configuration CORS

/**
 * Configure CORS for the application
 * @param {Object} fastify - Instance Fastify
 */
export async function registerCors(fastify) {
    try {
        const { default: fastifyCors } = await import('@fastify/cors')

        // Build allowed origins list from env (comma-separated)
        const raw = process.env.ALLOWED_ORIGINS || '';
        const envOrigins = raw.split(',').map(o => o.trim()).filter(Boolean);
        // Add common dev defaults if none provided
        const defaultOrigins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'https://localhost:8443',
            'https://127.0.0.1:8443'
        ];
        const allowedOrigins = [...new Set([...(envOrigins.length ? envOrigins : defaultOrigins)])];

        await fastify.register(fastifyCors, {
            origin: (origin, cb) => {
                // Allow non-browser / same-origin requests (origin === undefined)
                if (!origin) return cb(null, true);
                if (allowedOrigins.includes(origin)) return cb(null, true);
                fastify.log.warn(`CORS blocked origin: ${origin}`);
                return cb(new Error('Not allowed by CORS'));
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
            exposedHeaders: ['Set-Cookie']
        });

        fastify.log.info(`✅ CORS configured (allowed: ${allowedOrigins.join(', ')})`)
    } catch (err) {
        fastify.log.info('⚠️  @fastify/cors not installed — skipping CORS registration')
    }
}
