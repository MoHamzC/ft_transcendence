// src/server.js
// Point d'entrée du serveur ft_transcendence
import { buildApp } from './app.js'

/**
 * Start the server
 */
const start = async () => {
    try {
        // Build l'application avec tous les plugins
        const app = await buildApp()

        // Démarrer le serveur
        await app.listen({ port: 5001, host: '0.0.0.0' })
        console.log('🚀 Server listening on 0.0.0.0:5001')

    } catch (err) {
        console.error('❌ Failed to start server:', err)
        process.exit(1)
    }
}

start()
