// backend/src/server-https.js - Version HTTPS simple
import 'dotenv/config';
import Fastify from 'fastify';
import { readFileSync } from 'fs';
import { join } from 'path';
import securityPlugin from './plugins/security.js';
import jwtPlugin from './plugins/jwt.js';
import { registerRoutes } from './routes/index.js';
import { vaultService } from './services/VaultService.js';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';

import { testDatabaseConnection } from './config/db.js';

// Fonction d'initialisation de santé
async function performHealthChecks() {
    console.log('🏥 Performing startup health checks...')

    try {
        // Test de la base de données
        const dbHealth = await testDatabaseConnection()
        if (dbHealth.status === 'healthy') {
            console.log('✅ Database health check passed')
        } else {
            console.error('❌ Database health check failed:', dbHealth.error)
            throw new Error(`Database health check failed: ${dbHealth.error}`)
        }

        console.log('✅ All startup health checks passed')
    } catch (error) {
        console.error('❌ Startup health checks failed:', error.message)
        throw error
    }
}

async function start()
{
    // Configuration HTTPS avec certificats auto-signés
    const httpsOptions = {
        key: readFileSync(join(process.cwd(), 'ssl', 'key.pem')),
        cert: readFileSync(join(process.cwd(), 'ssl', 'cert.pem'))
    };

    const app = Fastify({ 
        logger: true,
        trustProxy: true,
        https: httpsOptions // Configuration HTTPS
    });

    // Initialisation de Vault
    try {
        await vaultService.initialize();
        console.log('✅ Vault initialized successfully');
    } catch (error) {
        console.log('⚠️ Vault initialization failed:', error.message);
    }

    // Effectuer les vérifications de santé avant de continuer
    try {
        await performHealthChecks();
    } catch (error) {
        console.error('❌ Critical startup health check failed. Server will not start properly.');
        console.error('💡 Check your database connection and Vault configuration.');
        // Ne pas arrêter le serveur, mais logger l'erreur
    }

    // 1. Charger d'abord le plugin de sécurité
    await app.register(securityPlugin);

    // 1.5. Cookie plugin
    await app.register(fastifyCookie);
    console.log('🍪 Cookie plugin registered');

    // 2. Puis JWT
    await app.register(jwtPlugin);
    console.log('🔐 JWT plugin registered');
    
    // 3. Enfin les routes
    await registerRoutes(app);

    const port = Number(process.env.HTTPS_PORT ?? 3443);

    const close = async () =>
    {
        app.log.info('Shutting down HTTPS server...');
        await app.close();
        process.exit(0);
    };
    process.on('SIGINT', close);
    process.on('SIGTERM', close);

    await app.listen({ host: '0.0.0.0', port });
    app.log.info(`🔒 HTTPS server running at https://localhost:${port}`);
}

start().catch((err) =>
{
    console.error('HTTPS Server error:', err);
    process.exit(1);
});
