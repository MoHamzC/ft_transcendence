// src/routes/auth.route.js
// Routes d'authentification basiques pour les tests

export default async function authRoutes(fastify, options) {
    // Route de login simple pour les tests
    fastify.post('/login', async (request, reply) => {
        const { username, password } = request.body;

        // Validation basique pour les tests
        if (username === 'test' && password === 'test') {
            const payload = {
                userId: 1,
                username: 'test',
                email: 'test@example.com'
            };

            const token = fastify.jwt.sign(payload);

            return {
                success: true,
                message: 'Login successful',
                token: token,
                user: payload
            };
        } else {
            return reply.code(401).send({
                success: false,
                message: 'Invalid credentials'
            });
        }
    });

    // Route pour vérifier le token
    fastify.get('/verify', {
        preHandler: fastify.authenticate
    }, async (request, reply) => {
        return {
            success: true,
            user: request.user
        };
    });

    // Route de test
    fastify.get('/test', async (request, reply) => {
        return {
            message: 'Auth routes are working!',
            timestamp: new Date().toISOString()
        };
    });
}
