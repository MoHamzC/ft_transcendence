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
        // Common defaults (toujours ajoutés en plus si env fourni)
        const defaultOrigins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:8443',
            'http://127.0.0.1:8443',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://localhost:8443',
            'https://127.0.0.1:8443'
        ];
    const allowedOrigins = [...new Set([...(envOrigins), ...defaultOrigins])];

    const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

        await fastify.register(fastifyCors, {
            origin: (origin, cb) => {
                // Allow server-to-server / curl (no origin)
                if (!origin) return cb(null, true);

                // Always allow localhost / 127.0.0.1 (any port) in non-production
                if (process.env.NODE_ENV !== 'production' && localhostRegex.test(origin)) {
                    return cb(null, true);
                }

                if (allowedOrigins.includes(origin)) return cb(null, true);

                // Instead of throwing (causes 400), just disable CORS for this request
                fastify.log.warn(`CORS blocked origin (no header sent): ${origin}`);
                return cb(null, false);
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
