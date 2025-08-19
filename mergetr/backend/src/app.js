// src/app.js
// Configuration centralisée de Fastify
import Fastify from 'fastify'
import dotenv from 'dotenv'

// Configuration
import { registerDatabase } from './plugins/database.js'
import { registerAuthentication } from './plugins/authentication.js'
import { registerCors } from './config/cors.js'

// Routes
import { registerRoutes } from './routes/index.js'

// Charger les variables d'environnement
dotenv.config({ path: '../.env' })

/**
 * Build the Fastify application with all plugins and routes
 * @param {Object} opts - Options for Fastify instance
 * @returns {Object} Configured Fastify instance
 */
export async function buildApp(opts = {}) {
    const app = Fastify({
        logger: true,
        ...opts
    })

    // Sanity check des variables d'environnement critiques
    if (!process.env.SUPER_SECRET_CODE) {
        app.log.warn('⚠️  SUPER_SECRET_CODE is not set — JWT features may fail')
    }

    try {
        // 1. Configuration de base (CORS, etc.)
        await registerCors(app)

        // 2. Base de données
        await registerDatabase(app)

        // 3. Authentification (JWT, cookies)
        await registerAuthentication(app)

        // 4. Routes applicatives
        await registerRoutes(app)

        app.log.info('✅ Application configured successfully')

    } catch (error) {
        app.log.error('❌ Failed to configure application:', error)
        throw error
    }

    return app
}
