// backend/src/server.js
import 'dotenv/config';
import Fastify from 'fastify';
import jwtPlugin from './plugins/jwt.js';
import { registerRoutes } from './routes/index.js';

async function start()
{
    const app = Fastify({ logger: true });

    app.get('/healthz', async () =>
    {
        return { ok: true, ts: Date.now() };
    });

    await app.register(jwtPlugin);
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
