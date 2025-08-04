// src/server.js

import 'dotenv/config';
import Fastify from 'fastify';
import jwtPlugin from './jwt.js';
import authRoutes from './auth.route.js';

const app = Fastify({ logger: true });

async function start()
{
    try
    {
        await app.register(jwtPlugin);
        await app.register(authRoutes);

        const port = parseInt(process.env.PORT) || 3001;

        await app.listen(
        {
            port,
            host: '0.0.0.0'
        });

        console.log(`🚀 Auth service running at http://localhost:${port}`);
    }
    catch (err)
    {
        app.log.error(err);
        process.exit(1);
    }
}

start();
