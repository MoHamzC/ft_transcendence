// backend/src/server.js
import 'dotenv/config';
import Fastify from 'fastify';
import securityPlugin from './plugins/security.js';
import jwtPlugin from './plugins/jwt.js';
import { registerRoutes } from './routes/index.js';

async function start()
{
    const app = Fastify({ logger: true });

    // 1. Charger d'abord le plugin de sécurité (OBLIGATOIRE)
    await app.register(securityPlugin);

    app.get('/healthz', async () =>
    {
        return { ok: true, ts: Date.now() };
    });

    // 2. Puis JWT
    await app.register(jwtPlugin);
    
    // 3. Enfin les routes
    await registerRoutes(app);

    // a virer plus tard vvvv
    app.log.info(app.printRoutes());
    // a virer plus tard ^^^^

    const port = Number(process.env.PORT ?? 3000);

    const close = async () =>
    {
        app.log.info('Shutting down...');
        await app.close();
        process.exit(0);
    };
    process.on('SIGINT', close);
    process.on('SIGTERM', close);

    await app.listen({ host: '0.0.0.0', port });
    app.log.info(`http://localhost:${port}`);
}
start().catch((err) =>
{
    console.error(err);
    process.exit(1);
});
