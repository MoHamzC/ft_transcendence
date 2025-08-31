// src/plugins/database.js
// Plugin pour la configuration de la base de données
import { getPool } from '../config/db.js'
import { initDatabase } from '../config/initDb.js'

/**
 * Plugin Fastify pour la base de données
 * @param {Object} fastify - Instance Fastify
 */
export async function registerDatabase(fastify) {
    try {
        // Obtenir le pool de connexions
        const pool = await getPool()

        // Test de connexion
        const res = await pool.query('SELECT NOW()')
        fastify.log.info('✅ Database connected — Current time:', res.rows[0].now)

        // Initialiser les tables si demandé
        if (process.env.RESET_DB === 'true') {
            fastify.log.info('🔄 Resetting database...')
            await initDatabase()
            fastify.log.info('✅ Database reset completed')
        }

        // Rendre le pool disponible dans l'app
        fastify.decorate('db', pool)

    } catch (err) {
        fastify.log.error('❌ Database connection failed:', err.message)
        throw err
    }
}
