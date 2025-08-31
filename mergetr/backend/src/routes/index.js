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
    const authRoutes = (await import('./users/user_route.js')).default
    await fastify.register(authRoutes, { prefix: '/api/auth' })

    // Routes OAuth (existantes)
    const oauthRoutes = (await import('./auth/oauth/oauth.js')).default
    await fastify.register(oauthRoutes, { prefix: '/auth' })

    // Routes utilisateurs
    const userRoutes = (await import('./users/user_route.js')).default
    await fastify.register(userRoutes, { prefix: '/api/users' })

    // Routes des paramètres utilisateurs
    const userSettingsRoutes = (await import('./users/user_settings.js')).default
    await fastify.register(userSettingsRoutes, { prefix: '/api/users' })

    // Routes des tournois avec utilisateurs temporaires
    const tournamentTempRoutes = (await import('./tournamentTemp.js')).default
    await fastify.register(tournamentTempRoutes, { prefix: '/api/tournament-temp' })

    // Routes GDPR
    const gdprRoutes = (await import('./gdpr.route.js')).default
    await fastify.register(gdprRoutes, { prefix: '/api/gdpr' })

    // Routes Vault
    const vaultRoutes = (await import('./vault.route.js')).default
    await fastify.register(vaultRoutes, { prefix: '/api/vault' })
    // Routes des amis en ligne
    const friendsOnlineRoutes = (await import('./friendsOnlineRoutes.js')).default
    await fastify.register(friendsOnlineRoutes, { prefix: '/api' })

    // Routes des joueurs/jeu
    const gameRoutes = (await import('./game_route.js')).default
    await fastify.register(gameRoutes, { prefix: '/api/players' })

	//Match Routes
    const matchRoutes = (await import('../services/matchService.js')).default
    await fastify.register(matchRoutes, { prefix: '/api' })

    // Routes des statistiques
    const statsRoutes = (await import('./stats.js')).default
    await fastify.register(statsRoutes, { prefix: '/api/stats' })


    fastify.log.info('✅ All routes registered')
}
