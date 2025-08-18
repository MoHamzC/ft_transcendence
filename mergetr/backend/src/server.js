// backend/src/server.js
import 'dotenv/config';
import Fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import jwtPlugin from './plugins/jwt.js';
import { registerRoutes } from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function start()
{
    const app = Fastify({ logger: true });

    // Health check endpoint
    app.get('/healthz', async () =>
    {
        return { ok: true, ts: Date.now() };
    });

    // Register JWT plugin
    await app.register(jwtPlugin);

    // Register API routes
    await registerRoutes(app);

    // Serve static files from the built frontend
    await app.register(import('@fastify/static'), {
        root: path.join(__dirname, '..', 'public'),
        prefix: '/', // optional: default '/'
    });

    // Fallback to index.html for SPA routing (catch-all route)
    app.setNotFoundHandler(async (request, reply) => {
        // If the request is for an API route that doesn't exist, return 404 JSON
        if (request.url.startsWith('/api/') || request.url.startsWith('/auth/')) {
            reply.code(404).send({ error: 'Not Found' });
            return;
        }
        
        // For all other routes, serve the index.html (SPA routing)
        reply.type('text/html');
        return reply.sendFile('index.html');
    });

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
