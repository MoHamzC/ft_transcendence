// src/middleware/auth.js
// Middleware d'authentification

/**
 * Middleware pour vérifier l'authentification JWT
 * @param {Object} request - Requête Fastify
 * @param {Object} reply - Réponse Fastify
 */
export const requireAuth = async (request, reply) => {
    try {
        await request.jwtVerify()
    } catch (err) {
        reply.code(401).send({
            error: 'Token manquant ou invalide',
            message: 'Authentification requise'
        })
    }
}

/**
 * Middleware optionnel pour l'authentification
 * @param {Object} request - Requête Fastify
 * @param {Object} reply - Réponse Fastify
 */
export const optionalAuth = async (request, reply) => {
    try {
        await request.jwtVerify()
    } catch (err) {
        // Pas d'erreur, juste pas d'utilisateur connecté
        request.user = null
    }
}
