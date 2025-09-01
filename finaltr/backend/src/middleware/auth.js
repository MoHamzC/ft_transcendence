// src/middleware/auth.js
// Middleware d'authentification

/**
 * Middleware pour vérifier l'authentification JWT
 * @param {Object} request - Requête Fastify
 * @param {Object} reply - Réponse Fastify
 */
export const requireAuth = async (request, reply) => {
    try {
        // Récupération du token depuis le cookie ou l'en-tête Authorization
        let token = request.cookies?.access_token;
        if (!token && request.headers.authorization) {
            token = request.headers.authorization.replace('Bearer ', '');
        }

        if (!token) {
            return reply.code(401).send({
                error: 'No token provided',
                message: 'Authentification requise'
            });
        }

        const decoded = await request.server.jwt.verify(token);
        request.user = decoded;

        // Harmoniser l'ID utilisateur
        if (request.user && request.user.sub && !request.user.id) {
            request.user.id = request.user.sub;
        }
    } catch (err) {
        return reply.code(401).send({
            error: 'Token manquant ou invalide',
            message: 'Authentification requise'
        });
    }
}

/**
 * Middleware optionnel pour l'authentification
 * @param {Object} request - Requête Fastify
 * @param {Object} reply - Réponse Fastify
 */
export const optionalAuth = async (request, reply) => {
    try {
        let token = request.cookies?.access_token;
        if (!token && request.headers.authorization) {
            token = request.headers.authorization.replace('Bearer ', '');
        }
        if (!token) {
            request.user = null;
            return;
        }
        const decoded = await request.server.jwt.verify(token);
        request.user = decoded;
        if (request.user && request.user.sub && !request.user.id) {
            request.user.id = request.user.sub;
        }
    } catch (err) {
        request.user = null; // utilisateur non authentifié
    }
}
