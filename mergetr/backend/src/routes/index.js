// src/routes/index.js
// Registre central des routes

/**
 * Register all application routes
 * @param {Object} fastify - Instance Fastify
 */
export async function registerRoutes(fastify) {
    // Routes de santé/info
    const indexRoutes = (await import('./health.js')).default
    await fastify.register(indexRoutes)

    // Routes d'authentification
    const authRoutes =  (await import('./auth/oauth.js')).default
    await fastify.register(authRoutes, { prefix: '/auth' })

    // Routes utilisateurs
    const userRoutes = (await import('./users/legacy/user_route.js')).default
    await fastify.register(userRoutes, { prefix: '/api/users' })

    // Routes des tournois
    const tournamentRoutes = (await import('./tournaments/index.js')).default
    await fastify.register(tournamentRoutes, { prefix: '/api' })

    // Routes des amis en ligne
    const friendsOnlineRoutes = (await import('./friendsOnlineRoutes.js')).default
    await fastify.register(friendsOnlineRoutes, { prefix: '/api' })

    fastify.log.info('✅ All routes registered')
}
