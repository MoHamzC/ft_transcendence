// backend/src/server-https.js - Version HTTPS simple
import 'dotenv/config';
import Fastify from 'fastify';
import { readFileSync } from 'fs';
import { join } from 'path';
import securityPlugin from './plugins/security.js';
import jwtPlugin from './plugins/jwt.js';
import { registerRoutes } from './routes/index.js';

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

    // 1. Charger d'abord le plugin de sécurité
    await app.register(securityPlugin);

    app.get('/healthz', async () =>
    {
        return { ok: true, ts: Date.now(), protocol: 'https' };
    });

    // 2. Puis JWT
    await app.register(jwtPlugin);
    
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
